#!/usr/bin/env python3
"""Render bar chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("bar_basic_single_group.json", "bar_basic_single_group.png"),
    ("bar_stacked.json", "bar_stacked.png"),
    ("bar_grouped_multi_series.json", "bar_grouped_multi_series.png"),
    ("bar_custom_colors.json", "bar_custom_colors.png"),
    ("bar_custom_width.json", "bar_custom_width.png"),
    ("bar_gap_spacing.json", "bar_gap_spacing.png"),
    ("bar_top_labels.json", "bar_top_labels.png"),
    ("bar_horizontal.json", "bar_horizontal.png"),
    ("bar_negative_values.json", "bar_negative_values.png"),
    ("bar_dataset_encode.json", "bar_dataset_encode.png"),
    ("bar_stacked_with_labels.json", "bar_stacked_with_labels.png"),
    ("bar_item_style_details.json", "bar_item_style_details.png"),
    ("bar_dataset_encode_table.json", "bar_dataset_encode_table.png"),
    ("bar_dataset_encode_multi_series_table.json", "bar_dataset_encode_multi_series_table.png"),
    ("bar_legend_hidden.json", "bar_legend_hidden.png"),
    ("bar_legend_vertical_right.json", "bar_legend_vertical_right.png"),
    ("bar_legend_bottom_center.json", "bar_legend_bottom_center.png"),
    ("bar_global_palette.json", "bar_global_palette.png"),
    ("bar_background_color.json", "bar_background_color.png"),
    ("bar_style_config.json", "bar_style_config.png", ["base_test_style.json", "bar_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render bar chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "bar"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "bar"
    golden_dir = skill_dir / "test" / "golden" / "bar"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "bar_chart.py",
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
