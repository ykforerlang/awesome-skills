#!/usr/bin/env python3
"""Render pie and donut chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("pie_basic.json", "pie_basic.png"),
    ("donut_basic.json", "donut_basic.png"),
    ("pie_custom_colors.json", "pie_custom_colors.png"),
    ("pie_outside_labels.json", "pie_outside_labels.png"),
    ("pie_inside_labels.json", "pie_inside_labels.png"),
    ("pie_start_angle.json", "pie_start_angle.png"),
    ("pie_item_style_details.json", "pie_item_style_details.png"),
    ("pie_multilingual.json", "pie_multilingual.png"),
    ("pie_dataset_encode.json", "pie_dataset_encode.png"),
    ("pie_center_offset.json", "pie_center_offset.png"),
    ("pie_selected_offset.json", "pie_selected_offset.png"),
    ("pie_rose_radius.json", "pie_rose_radius.png"),
    ("pie_rose_area.json", "pie_rose_area.png"),
    ("pie_legend_hidden.json", "pie_legend_hidden.png"),
    ("pie_legend_bottom_center.json", "pie_legend_bottom_center.png"),
    ("pie_global_palette.json", "pie_global_palette.png"),
    ("pie_background_color.json", "pie_background_color.png"),
    ("pie_dataset_encode_table.json", "pie_dataset_encode_table.png"),
    ("pie_style_config.json", "pie_style_config.png", ["base_test_style.json", "pie_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render pie and donut chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "pie"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "pie"
    golden_dir = skill_dir / "test" / "golden" / "pie"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "pie_chart.py",
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
