#!/usr/bin/env python3
"""Shared runtime environment setup for writable plotting caches."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


RUNTIME_ROOT = Path(tempfile.gettempdir()) / "data-charts-visualization-runtime"
MPLCONFIG_DIR = RUNTIME_ROOT / "mplconfig"
XDG_CACHE_DIR = RUNTIME_ROOT / "xdg-cache"
FONTCONFIG_CACHE_DIR = XDG_CACHE_DIR / "fontconfig"


def setup_runtime_env() -> dict[str, Path]:
    for path in (RUNTIME_ROOT, MPLCONFIG_DIR, XDG_CACHE_DIR, FONTCONFIG_CACHE_DIR):
        path.mkdir(parents=True, exist_ok=True)

    os.environ["MPLCONFIGDIR"] = str(MPLCONFIG_DIR)
    os.environ["XDG_CACHE_HOME"] = str(XDG_CACHE_DIR)
    return {
        "runtime_root": RUNTIME_ROOT,
        "mplconfig_dir": MPLCONFIG_DIR,
        "xdg_cache_dir": XDG_CACHE_DIR,
        "fontconfig_cache_dir": FONTCONFIG_CACHE_DIR,
    }
