#!/usr/bin/env python3
"""Render area chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("area_basic.json", "area_basic.png"),
    ("area_stacked.json", "area_stacked.png"),
    ("area_multi_series.json", "area_multi_series.png"),
    ("area_custom_style.json", "area_custom_style.png"),
    ("area_labels.json", "area_labels.png"),
    ("area_dataset_encode.json", "area_dataset_encode.png"),
    ("area_multilingual.json", "area_multilingual.png"),
    ("area_axis_grid_style.json", "area_axis_grid_style.png"),
    ("area_smooth.json", "area_smooth.png"),
    ("area_gradient_fill.json", "area_gradient_fill.png"),
    ("area_dataset_encode_table.json", "area_dataset_encode_table.png"),
    ("area_label_name_value_formatter.json", "area_label_name_value_formatter.png"),
    ("area_null_gap.json", "area_null_gap.png"),
    ("area_connect_nulls.json", "area_connect_nulls.png"),
    ("area_show_symbol_hidden.json", "area_show_symbol_hidden.png"),
    ("area_legend_hidden.json", "area_legend_hidden.png"),
    ("area_legend_vertical_right.json", "area_legend_vertical_right.png"),
    ("area_legend_bottom_center.json", "area_legend_bottom_center.png"),
    ("area_global_palette.json", "area_global_palette.png"),
    ("area_background_color.json", "area_background_color.png"),
    ("area_style_config.json", "area_style_config.png", ["area_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render area chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "area"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "area"
    golden_dir = skill_dir / "test" / "golden" / "area"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "area_chart.py",
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
