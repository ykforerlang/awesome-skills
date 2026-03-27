#!/usr/bin/env python3
"""Workspace-level virtualenv bootstrap for chart scripts."""

from __future__ import annotations

import json
import importlib.util
import os
import platform
import subprocess
import sys
import venv
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from runtime_env import setup_runtime_env

RUNTIME_ENV = setup_runtime_env()


REQUIRED_MODULES = {
    "matplotlib": "matplotlib>=3.8",
    "numpy": "numpy>=1.26",
}

CHECK_FLAG = "--check-deps"
INSTALL_FLAG = "--install-deps"
NO_INSTALL_FLAG = "--no-install-deps"
DEFAULT_VENV_DIRNAME = ".venv"
KNOWN_VENV_DIRS = (".venv", "venv")


@dataclass
class DependencyStatus:
    workspace: Path
    venv_path: Path
    venv_exists: bool
    using_workspace_python: bool
    missing_modules: list[str]

    @property
    def ok(self) -> bool:
        return self.venv_exists and self.using_workspace_python and not self.missing_modules


def discover_workspace() -> Path:
    return Path.cwd().resolve()


def is_virtualenv(path: Path) -> bool:
    return (path / "pyvenv.cfg").exists()


def discover_workspace_venv(workspace: Path) -> Path:
    for dirname in KNOWN_VENV_DIRS:
        candidate = workspace / dirname
        if is_virtualenv(candidate):
            return candidate
    return workspace / DEFAULT_VENV_DIRNAME


def venv_python_path(venv_path: Path) -> Path:
    if platform.system() == "Windows":
        return venv_path / "Scripts" / "python.exe"
    return venv_path / "bin" / "python"


def current_python_path() -> Path:
    return Path(sys.executable).resolve()


def is_using_workspace_python(venv_path: Path) -> bool:
    candidate = venv_python_path(venv_path)
    return candidate.exists() and candidate.resolve() == current_python_path()


def detect_missing_modules() -> list[str]:
    return [module for module in REQUIRED_MODULES if importlib.util.find_spec(module) is None]


def detect_missing_modules_in_python(python_executable: Path) -> list[str]:
    if python_executable.resolve() == current_python_path():
        return detect_missing_modules()
    command = [
        str(python_executable),
        "-c",
        (
            "import importlib.util, json; "
            f"modules={list(REQUIRED_MODULES.keys())!r}; "
            "missing=[name for name in modules if importlib.util.find_spec(name) is None]; "
            "print(json.dumps(missing))"
        ),
    ]
    result = subprocess.check_output(command, text=True)
    return json.loads(result)


def get_status() -> DependencyStatus:
    workspace = discover_workspace()
    venv_path = discover_workspace_venv(workspace)
    venv_exists = is_virtualenv(venv_path)
    python_executable = venv_python_path(venv_path) if venv_exists else current_python_path()
    return DependencyStatus(
        workspace=workspace,
        venv_path=venv_path,
        venv_exists=venv_exists,
        using_workspace_python=is_using_workspace_python(venv_path),
        missing_modules=detect_missing_modules_in_python(python_executable),
    )


def supported_platform_summary() -> str:
    return f"{platform.system()} / Python {sys.version_info.major}.{sys.version_info.minor}"


def sanitize_argv(argv: Sequence[str] | None = None) -> list[str]:
    argv = list(sys.argv[1:] if argv is None else argv)
    return [arg for arg in argv if arg not in {CHECK_FLAG, INSTALL_FLAG, NO_INSTALL_FLAG}]


def ensure_workspace_venv(venv_path: Path) -> None:
    if is_virtualenv(venv_path):
        return
    builder = venv.EnvBuilder(with_pip=True)
    builder.create(str(venv_path))


def ensure_pip_available(python_executable: Path) -> None:
    try:
        subprocess.check_call([str(python_executable), "-m", "pip", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        subprocess.check_call([str(python_executable), "-m", "ensurepip", "--upgrade"])


def install_missing_modules(venv_path: Path, missing_modules: Sequence[str]) -> None:
    python_executable = venv_python_path(venv_path)
    ensure_pip_available(python_executable)
    packages = [REQUIRED_MODULES[module] for module in missing_modules]
    command = [str(python_executable), "-m", "pip", "install", *packages]
    env = os.environ.copy()
    env.setdefault("PIP_DISABLE_PIP_VERSION_CHECK", "1")
    subprocess.check_call(command, env=env)


def manual_install_command(venv_path: Path, missing_modules: Sequence[str]) -> str:
    packages = " ".join(REQUIRED_MODULES[module] for module in missing_modules)
    return f'"{venv_python_path(venv_path)}" -m pip install {packages}'


def print_status(status: DependencyStatus) -> None:
    script_name = Path(sys.argv[0]).name
    print(f"[INFO] Workspace: {status.workspace}")
    print(f"[INFO] Workspace venv: {status.venv_path}")
    print(f"[INFO] Platform: {supported_platform_summary()}")
    if status.ok:
        print(f"[OK] Runtime dependencies are available for {script_name}.")
        return
    if not status.venv_exists:
        print(f"[MISSING] No workspace virtual environment found. Expected at: {status.venv_path}")
    elif not status.using_workspace_python:
        print(f"[MISSING] {script_name} is not running from the workspace virtual environment.")
    if status.missing_modules:
        print(f"[MISSING] Required modules: {', '.join(status.missing_modules)}")
        print(f"[INFO] Install command: {manual_install_command(status.venv_path, status.missing_modules)}")


def reexec_into_workspace_python(venv_path: Path, argv: Sequence[str] | None = None) -> "NoReturn":
    clean_args = sanitize_argv(argv)
    os.execv(str(venv_python_path(venv_path)), [str(venv_python_path(venv_path)), sys.argv[0], *clean_args])


def handle_dependency_flags(argv: Sequence[str] | None = None) -> list[str]:
    argv = list(sys.argv[1:] if argv is None else argv)
    check_only = CHECK_FLAG in argv
    force_install = INSTALL_FLAG in argv
    no_auto_install = NO_INSTALL_FLAG in argv

    status = get_status()
    if check_only:
        print_status(status)
        raise SystemExit(0 if status.ok else 1)

    if not status.venv_exists:
        if no_auto_install and not force_install:
            print_status(status)
            raise SystemExit(1)
        ensure_workspace_venv(status.venv_path)
        status = get_status()

    if not status.using_workspace_python:
        reexec_into_workspace_python(status.venv_path, argv)

    if not status.missing_modules:
        return sanitize_argv(argv)

    if no_auto_install and not force_install:
        print_status(status)
        raise SystemExit(1)

    try:
        install_missing_modules(status.venv_path, status.missing_modules)
    except subprocess.CalledProcessError as exc:
        print_status(status)
        print(f"[ERROR] Automatic installation failed with exit code {exc.returncode}.", file=sys.stderr)
        raise SystemExit(exc.returncode) from exc

    refreshed = get_status()
    if refreshed.missing_modules:
        print_status(refreshed)
        print("[ERROR] Dependencies are still missing after installation attempt.", file=sys.stderr)
        raise SystemExit(1)
    print(f"[OK] Installed required dependencies into workspace venv: {', '.join(status.missing_modules)}")
    return sanitize_argv(argv)


def bootstrap_runtime(argv: Sequence[str] | None = None) -> list[str]:
    clean_args = handle_dependency_flags(argv)
    sys.argv = [sys.argv[0], *clean_args]
    return clean_args
