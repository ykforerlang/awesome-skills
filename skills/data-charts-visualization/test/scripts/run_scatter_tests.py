#!/usr/bin/env python3
"""Render scatter chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("scatter_basic_multi_series.json", "scatter_basic_multi_series.png"),
    ("scatter_bubble_sizes.json", "scatter_bubble_sizes.png"),
    ("scatter_dataset_encode_table.json", "scatter_dataset_encode_table.png"),
    ("scatter_dataset_encode_multi_series_table.json", "scatter_dataset_encode_multi_series_table.png"),
    ("scatter_dataset_encode_multi_series_object.json", "scatter_dataset_encode_multi_series_object.png"),
    ("scatter_object_data_labels.json", "scatter_object_data_labels.png"),
    ("scatter_item_style_details.json", "scatter_item_style_details.png"),
    ("scatter_legend_hidden.json", "scatter_legend_hidden.png"),
    ("scatter_legend_vertical_right.json", "scatter_legend_vertical_right.png"),
    ("scatter_legend_bottom_center.json", "scatter_legend_bottom_center.png"),
    ("scatter_global_palette.json", "scatter_global_palette.png"),
    ("scatter_background_color.json", "scatter_background_color.png"),
    ("scatter_axis_grid_range_formatter.json", "scatter_axis_grid_range_formatter.png"),
    ("scatter_style_config.json", "scatter_style_config.png", ["base_test_style.json", "scatter_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render scatter chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "scatter"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "scatter"
    golden_dir = skill_dir / "test" / "golden" / "scatter"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "scatter_chart.py",
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
