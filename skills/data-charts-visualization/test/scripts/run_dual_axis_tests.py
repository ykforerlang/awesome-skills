#!/usr/bin/env python3
"""Render dual-axis chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("dual_axis_basic_mixed.json", "dual_axis_basic_mixed.png"),
    ("dual_axis_grouped_bars_line.json", "dual_axis_grouped_bars_line.png"),
    ("dual_axis_stacked_bars_labels.json", "dual_axis_stacked_bars_labels.png"),
    ("dual_axis_dataset_encode.json", "dual_axis_dataset_encode.png"),
    ("dual_axis_dual_line_styles.json", "dual_axis_dual_line_styles.png"),
    ("dual_axis_axis_style_formatter.json", "dual_axis_axis_style_formatter.png"),
    ("dual_axis_area_smooth.json", "dual_axis_area_smooth.png"),
    ("dual_axis_negative_stacked.json", "dual_axis_negative_stacked.png"),
    ("dual_axis_horizontal.json", "dual_axis_horizontal.png"),
    ("dual_axis_dataset_encode_table.json", "dual_axis_dataset_encode_table.png"),
    ("dual_axis_null_gap.json", "dual_axis_null_gap.png"),
    ("dual_axis_connect_nulls.json", "dual_axis_connect_nulls.png"),
    ("dual_axis_show_symbol_hidden.json", "dual_axis_show_symbol_hidden.png"),
    ("dual_axis_legend_hidden.json", "dual_axis_legend_hidden.png"),
    ("dual_axis_legend_vertical_right.json", "dual_axis_legend_vertical_right.png"),
    ("dual_axis_legend_bottom_center.json", "dual_axis_legend_bottom_center.png"),
    ("dual_axis_global_palette.json", "dual_axis_global_palette.png"),
    ("dual_axis_background_color.json", "dual_axis_background_color.png"),
    ("dual_axis_style_config.json", "dual_axis_style_config.png", ["base_test_style.json", "dual_axis_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render dual-axis chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "dual_axis"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "dual_axis"
    golden_dir = skill_dir / "test" / "golden" / "dual_axis"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "dual_axis_chart.py",
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
