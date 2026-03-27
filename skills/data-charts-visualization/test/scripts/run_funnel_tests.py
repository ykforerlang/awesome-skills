#!/usr/bin/env python3
"""Render funnel chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("funnel_basic_descending.json", "funnel_basic_descending.png"),
    ("funnel_ascending.json", "funnel_ascending.png"),
    ("funnel_inside_labels.json", "funnel_inside_labels.png"),
    ("funnel_item_style_details.json", "funnel_item_style_details.png"),
    ("funnel_dataset_encode_table.json", "funnel_dataset_encode_table.png"),
    ("funnel_dataset_encode_object.json", "funnel_dataset_encode_object.png"),
    ("funnel_size_gap.json", "funnel_size_gap.png"),
    ("funnel_sort_none_preserve_order.json", "funnel_sort_none_preserve_order.png"),
    ("funnel_label_percent_formatter.json", "funnel_label_percent_formatter.png"),
    ("funnel_legend_hidden.json", "funnel_legend_hidden.png"),
    ("funnel_legend_vertical_right.json", "funnel_legend_vertical_right.png"),
    ("funnel_legend_bottom_center.json", "funnel_legend_bottom_center.png"),
    ("funnel_global_palette.json", "funnel_global_palette.png"),
    ("funnel_background_color.json", "funnel_background_color.png"),
    ("funnel_style_config.json", "funnel_style_config.png", ["base_test_style.json", "funnel_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render funnel chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "funnel"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "funnel"
    golden_dir = skill_dir / "test" / "golden" / "funnel"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "funnel_chart.py",
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
