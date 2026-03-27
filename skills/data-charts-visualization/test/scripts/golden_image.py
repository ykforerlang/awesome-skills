#!/usr/bin/env python3
"""Golden image helpers for chart test runners."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path
from typing import Sequence

import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parents[1]
RUNTIME_SCRIPT_DIR = SKILL_DIR / "scripts"
if str(RUNTIME_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(RUNTIME_SCRIPT_DIR))

from runtime_env import setup_runtime_env

RUNTIME_ENV = setup_runtime_env()

from matplotlib import image as mpimg


PIXEL_DIFF_TOLERANCE = 2
MAX_DIFF_RATIO = 0.0005


def add_golden_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--python", default=None, help="Python interpreter used to launch chart scripts.")
    parser.add_argument("--update-golden", action="store_true", help="Replace golden images with current rendered outputs.")
    parser.add_argument("--no-verify", action="store_true", help="Skip golden-image comparison after rendering.")
    parser.add_argument(
        "--diff-dirname",
        default="_diff",
        help="Directory name under the out path where diff artifacts are written when verification fails.",
    )


def render_case(
    script_path: Path,
    option_path: Path,
    output_path: Path,
    python_executable: str,
    style_config_paths: Sequence[Path] = (),
) -> None:
    import subprocess

    command = [
        python_executable,
        str(script_path),
        "--option",
        str(option_path),
        "--output",
        str(output_path),
    ]
    for style_config_path in style_config_paths:
        command.extend(["--style-config", str(style_config_path)])
    subprocess.check_call(command)


def verify_or_update_golden(
    rendered_path: Path,
    golden_path: Path,
    diff_path: Path,
    update_golden: bool = False,
    verify: bool = True,
) -> None:
    if update_golden:
        golden_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(rendered_path, golden_path)
        return

    if not verify:
        return

    if not golden_path.exists():
        raise AssertionError(f"Missing golden image: {golden_path}")

    rendered = load_rgba(rendered_path)
    expected = load_rgba(golden_path)
    if rendered.shape != expected.shape:
        raise AssertionError(
            f"Golden size mismatch for {rendered_path.name}: rendered={rendered.shape}, expected={expected.shape}"
        )

    diff = np.abs(rendered.astype(np.int16) - expected.astype(np.int16))
    diff_mask = np.any(diff > PIXEL_DIFF_TOLERANCE, axis=2)
    diff_ratio = float(diff_mask.mean()) if diff_mask.size else 0.0
    max_channel_diff = int(diff.max()) if diff.size else 0
    if diff_ratio <= MAX_DIFF_RATIO:
        if diff_path.exists():
            diff_path.unlink()
        return

    diff_path.parent.mkdir(parents=True, exist_ok=True)
    mpimg.imsave(diff_path, build_diff_preview(expected, rendered, diff_mask))
    raise AssertionError(
        f"Golden image mismatch for {rendered_path.name}: diff_ratio={diff_ratio:.6f}, "
        f"max_channel_diff={max_channel_diff}, diff={diff_path}"
    )


def load_rgba(path: Path) -> np.ndarray:
    image = mpimg.imread(path)
    if image.ndim == 2:
        image = np.stack([image, image, image], axis=2)
    if image.shape[2] == 3:
        alpha = np.ones((image.shape[0], image.shape[1], 1), dtype=image.dtype)
        image = np.concatenate([image, alpha], axis=2)
    if np.issubdtype(image.dtype, np.floating):
        image = np.clip(np.rint(image * 255.0), 0, 255).astype(np.uint8)
    else:
        image = image.astype(np.uint8)
    return image


def build_diff_preview(expected: np.ndarray, rendered: np.ndarray, diff_mask: np.ndarray) -> np.ndarray:
    expected_rgb = expected[:, :, :3].copy()
    rendered_rgb = rendered[:, :, :3].copy()
    overlay = rendered_rgb.copy()
    overlay[diff_mask] = np.array([255, 0, 0], dtype=np.uint8)
    separator = np.full((expected.shape[0], 12, 3), 255, dtype=np.uint8)
    return np.concatenate([expected_rgb, separator, rendered_rgb, separator, overlay], axis=1)
