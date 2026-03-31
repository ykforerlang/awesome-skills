#!/usr/bin/env python3
"""Render funnel charts from ECharts-like options."""

from __future__ import annotations

from bootstrap import bootstrap_runtime

bootstrap_runtime()

import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

from common import (
    apply_legend,
    apply_title,
    build_parser,
    first_scalar,
    format_label,
    load_option,
    parse_percent,
    save_figure,
    series_color,
    to_rgba,
)


def resolve_funnel_data(option: dict, series: dict) -> list[dict]:
    data = series.get("data")
    if data is not None:
        return data

    dataset = option.get("dataset", {})
    source = dataset.get("source")
    if not source:
        return []

    encode = series.get("encode", {})
    name_field = first_scalar(encode.get("itemName")) or first_scalar(encode.get("name")) or first_scalar(encode.get("x"))
    value_field = first_scalar(encode.get("value")) or first_scalar(encode.get("y"))

    if isinstance(source, list) and source and isinstance(source[0], dict):
        first_row = source[0]
        if name_field is None:
            name_field = first_scalar(list(first_row.keys()))
        if value_field is None:
            remaining = [key for key in first_row.keys() if key != name_field]
            value_field = remaining[0] if remaining else name_field
        return [{"name": row.get(name_field), "value": row.get(value_field)} for row in source]

    if isinstance(source, list) and source and isinstance(source[0], list):
        header_row = source[0]
        has_header_row = all(isinstance(item, str) for item in header_row)
        data_rows = source[1:] if has_header_row else source
        dimensions = header_row if has_header_row else dataset.get("dimensions") or [str(index) for index in range(len(data_rows[0]))]
        if name_field is None:
            name_field = dimensions[0]
        if value_field is None:
            value_field = dimensions[1] if len(dimensions) > 1 else dimensions[0]
        name_index = dimensions.index(name_field)
        value_index = dimensions.index(value_field)
        return [{"name": row[name_index], "value": row[value_index]} for row in data_rows]

    return []


def sort_funnel_data(data: list[dict], sort_order: str) -> list[dict]:
    if sort_order == "ascending":
        return sorted(data, key=lambda item: float(item.get("value", 0)))
    if sort_order == "descending":
        return sorted(data, key=lambda item: float(item.get("value", 0)), reverse=True)
    return list(data)


def resolve_size_ratio(value, total_ratio: float, default_ratio: float, total_px: float) -> float:
    if value is None:
        return default_ratio
    if isinstance(value, str) and value.endswith("%"):
        return parse_percent(value, total_ratio, default_ratio)
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return default_ratio
    if numeric <= 1:
        return numeric
    return max(0.0, min(total_ratio, numeric / total_px))


def resolve_gap_ratio(value, total_px: float) -> float:
    if value is None:
        return 0.0
    if isinstance(value, str) and value.endswith("%"):
        return parse_percent(value, 1.0, 0.0)
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.0
    if numeric <= 1:
        return numeric
    return max(0.0, min(0.25, numeric / total_px))


def width_for_value(value: float, min_value: float, max_value: float, min_ratio: float, max_ratio: float) -> float:
    if max_value == min_value:
        return max_ratio
    ratio = (float(value) - min_value) / (max_value - min_value)
    return min_ratio + (max_ratio - min_ratio) * max(0.0, min(1.0, ratio))


def main() -> None:
    parser = build_parser("Render a funnel chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig = None
    ax = None
    import common as common_module

    fig, ax = common_module.create_figure(option, args)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    series = next((item for item in option.get("series", []) if item.get("type") == "funnel"), None)
    if not series:
        raise ValueError("No funnel series found in option.series.")

    data = resolve_funnel_data(option, series)
    if not data:
        raise ValueError("No funnel data found in series.data or dataset source.")
    data = sort_funnel_data(data, str(series.get("sort", "descending")))

    values = [float(item.get("value", 0)) for item in data]
    min_value = float(series.get("min", min(values)))
    max_value = float(series.get("max", max(values)))
    total_height_px = args.height * args.dpi
    total_width_px = args.width * args.dpi
    chart_left = parse_percent(series.get("left"), 1.0, 0.04)
    chart_top_margin = parse_percent(series.get("top"), 1.0, 0.0)
    chart_width_ratio = parse_percent(series.get("width"), 1.0, 0.92)
    chart_height_ratio = parse_percent(series.get("height"), 1.0, 1.0 - chart_top_margin)
    chart_height_ratio = max(0.12, min(chart_height_ratio, 1.0 - chart_top_margin))
    chart_center = chart_left + chart_width_ratio / 2.0
    gap_ratio = resolve_gap_ratio(series.get("gap"), total_height_px)
    segment_height = (chart_height_ratio - gap_ratio * max(len(data) - 1, 0)) / len(data)
    min_size_ratio = resolve_size_ratio(series.get("minSize"), chart_width_ratio, 0.25 * chart_width_ratio, total_width_px)
    max_size_ratio = resolve_size_ratio(series.get("maxSize"), chart_width_ratio, chart_width_ratio, total_width_px)
    handles = []
    labels = []
    label_conf = series.get("label", {})
    item_style = series.get("itemStyle", {})

    widths = [width_for_value(value, min_value, max_value, min_size_ratio, max_size_ratio) for value in values]
    terminal_width = min_size_ratio if len(widths) == 1 else max(min_size_ratio, widths[-1] * 0.8)

    for index, item in enumerate(data):
        top_width = widths[index]
        bottom_width = widths[index + 1] if index + 1 < len(widths) else terminal_width
        y_top = 1.0 - chart_top_margin - index * (segment_height + gap_ratio)
        y_bottom = y_top - segment_height
        x_top_left = chart_center - top_width / 2.0
        x_top_right = chart_center + top_width / 2.0
        x_bottom_left = chart_center - bottom_width / 2.0
        x_bottom_right = chart_center + bottom_width / 2.0

        color = item.get("itemStyle", {}).get("color", series_color(option, series, index))
        opacity = item.get("itemStyle", {}).get("opacity", item_style.get("opacity", 1.0))
        polygon = Polygon(
            [(x_top_left, y_top), (x_top_right, y_top), (x_bottom_right, y_bottom), (x_bottom_left, y_bottom)],
            closed=True,
            facecolor=to_rgba(color, opacity),
            edgecolor=item.get("itemStyle", {}).get("borderColor", item_style.get("borderColor")),
            linewidth=item.get("itemStyle", {}).get("borderWidth", item_style.get("borderWidth", 0)),
        )
        ax.add_patch(polygon)
        handles.append(plt.Rectangle((0, 0), 1, 1, color=to_rgba(color, opacity)))
        labels.append(item.get("name", f"stage-{index + 1}"))

        if label_conf.get("show"):
            position = label_conf.get("position", "outside")
            percent = (float(item.get("value", 0)) / max_value * 100.0) if max_value else None
            text = format_label(
                label_conf.get("formatter"),
                item.get("name"),
                item.get("value"),
                percent,
                series.get("name"),
            )
            center_y = (y_top + y_bottom) / 2.0
            if position == "inside":
                text_x = chart_center
                ha = "center"
            else:
                text_x = x_top_right + 0.05
                ha = "left"
            ax.text(
                text_x,
                center_y,
                text,
                fontsize=label_conf.get("fontSize", 10),
                color=label_conf.get("color"),
                ha=ha,
                va="center",
            )

    apply_title(fig, ax, option)
    if option.get("backgroundColor"):
        ax.set_facecolor(to_rgba(option.get("backgroundColor")))
        fig.patch.set_facecolor(to_rgba(option.get("backgroundColor")))
    apply_legend(ax, option, handles=handles, labels=labels)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
