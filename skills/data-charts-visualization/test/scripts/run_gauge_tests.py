#!/usr/bin/env python3
"""Render gauge chart test cases into the out directory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from golden_image import add_golden_arguments, render_case, verify_or_update_golden


TEST_CASES = [
    ("gauge_basic.json", "gauge_basic.png"),
    ("gauge_custom_range.json", "gauge_custom_range.png"),
    ("gauge_custom_angles.json", "gauge_custom_angles.png"),
    ("gauge_progress_arc.json", "gauge_progress_arc.png"),
    ("gauge_ticks_and_labels.json", "gauge_ticks_and_labels.png"),
    ("gauge_detail_and_title_style.json", "gauge_detail_and_title_style.png"),
    ("gauge_multilingual.json", "gauge_multilingual.png"),
    ("gauge_pointer_anchor_style.json", "gauge_pointer_anchor_style.png"),
    ("gauge_center_radius.json", "gauge_center_radius.png"),
    ("gauge_pointer_length_hidden.json", "gauge_pointer_length_hidden.png"),
    ("gauge_detail_value_formatter.json", "gauge_detail_value_formatter.png"),
    ("gauge_axis_label_distance.json", "gauge_axis_label_distance.png"),
    ("gauge_axisline_segments.json", "gauge_axisline_segments.png"),
    ("gauge_background_color.json", "gauge_background_color.png"),
    ("gauge_style_config.json", "gauge_style_config.png", ["base_test_style.json", "gauge_style_test.json"]),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render gauge chart test cases.")
    add_golden_arguments(parser)
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parents[1]
    chart_script_dir = skill_dir / "scripts"
    data_dir = skill_dir / "test" / "data" / "gauge"
    style_dir = skill_dir / "test" / "style"
    out_dir = skill_dir / "test" / "out" / "gauge"
    golden_dir = skill_dir / "test" / "golden" / "gauge"
    diff_dir = out_dir / args.diff_dirname
    out_dir.mkdir(parents=True, exist_ok=True)

    for test_case in TEST_CASES:
        option_name, output_name = test_case[:2]
        style_names = test_case[2] if len(test_case) > 2 else []
        render_case(
            chart_script_dir / "gauge_chart.py",
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
