#!/usr/bin/env python3
"""Check or install dependencies for the data-charts-visualization skill."""

from __future__ import annotations

import argparse

from bootstrap import ensure_workspace_venv, get_status, install_missing_modules, print_status


def main() -> None:
    parser = argparse.ArgumentParser(description="Check or install runtime dependencies for chart rendering.")
    parser.add_argument("--install", action="store_true", help="Install missing dependencies with pip.")
    args = parser.parse_args()

    status = get_status()
    print_status(status)
    if status.ok or (status.venv_exists and not status.missing_modules):
        return
    if not args.install:
        raise SystemExit(1)
    ensure_workspace_venv(status.venv_path)
    refreshed = get_status()
    if refreshed.missing_modules:
        install_missing_modules(refreshed.venv_path, refreshed.missing_modules)
    refreshed = get_status()
    print_status(refreshed)
    raise SystemExit(0 if refreshed.venv_exists and not refreshed.missing_modules else 1)


if __name__ == "__main__":
    main()
