#!/usr/bin/env python3
"""Render line chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("line_basic_single_series.json", "line_basic_single_series.png"),
    ("line_multi_series.json", "line_multi_series.png"),
    ("line_dataset_encode.json", "line_dataset_encode.png"),
    ("line_line_styles_symbols.json", "line_line_styles_symbols.png"),
    ("line_object_data_labels.json", "line_object_data_labels.png"),
    ("line_smooth.json", "line_smooth.png"),
    ("line_step.json", "line_step.png"),
    ("line_value_axis_pairs.json", "line_value_axis_pairs.png"),
    ("line_axis_grid_range_formatter.json", "line_axis_grid_range_formatter.png"),
    ("line_dataset_encode_table.json", "line_dataset_encode_table.png"),
    ("line_null_gap.json", "line_null_gap.png"),
    ("line_connect_nulls.json", "line_connect_nulls.png"),
    ("line_show_symbol_hidden.json", "line_show_symbol_hidden.png"),
    ("line_legend_hidden.json", "line_legend_hidden.png"),
    ("line_legend_vertical_right.json", "line_legend_vertical_right.png"),
    ("line_legend_bottom_center.json", "line_legend_bottom_center.png"),
    ("line_global_palette.json", "line_global_palette.png"),
    ("line_background_color.json", "line_background_color.png"),
    ("line_style_config.json", "line_style_config.png", ["base_test_style.json", "line_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render line chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "line"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "line"
    golden_dir = skill_dir / "test" / "golden" / "line"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "line_chart.py",
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
