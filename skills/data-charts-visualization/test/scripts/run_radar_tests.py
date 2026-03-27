#!/usr/bin/env python3
"""Render radar chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("radar_basic_single_series.json", "radar_basic_single_series.png"),
    ("radar_multi_series.json", "radar_multi_series.png"),
    ("radar_circle_shape.json", "radar_circle_shape.png"),
    ("radar_custom_style_labels.json", "radar_custom_style_labels.png"),
    ("radar_split_area_axis_name_style.json", "radar_split_area_axis_name_style.png"),
    ("radar_show_symbol_hidden.json", "radar_show_symbol_hidden.png"),
    ("radar_legend_hidden.json", "radar_legend_hidden.png"),
    ("radar_legend_vertical_right.json", "radar_legend_vertical_right.png"),
    ("radar_legend_bottom_center.json", "radar_legend_bottom_center.png"),
    ("radar_global_palette.json", "radar_global_palette.png"),
    ("radar_background_color.json", "radar_background_color.png"),
    ("radar_style_config.json", "radar_style_config.png", ["base_test_style.json", "radar_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render radar chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "radar"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "radar"
    golden_dir = skill_dir / "test" / "golden" / "radar"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "radar_chart.py",
            data_dir / option_name,
            out_dir / output_name,
            args.python or sys.executable,
            [style_dir / style_name for style_name in style_names],
        )
        verify_or_update_golden(
            out_dir / output_name,
            golden_dir / output_name,
            diff_dir / output_name,
            update_golden=args.update_golden,
            verify=not args.no_verify,
        )
        print(f"[OK] Rendered {out_dir / output_name}")


if __name__ == "__main__":
    main()
