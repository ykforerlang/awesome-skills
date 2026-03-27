#!/usr/bin/env python3
"""Render pie charts from ECharts-like options."""

from __future__ import annotations

import math

from bootstrap import bootstrap_runtime

bootstrap_runtime()

from matplotlib.patches import Wedge

from common import (
    apply_legend,
    apply_title,
    build_parser,
    create_figure,
    format_label,
    first_scalar,
    load_option,
    parse_percent,
    pie_radius,
    save_figure,
    series_color,
    to_rgba,
)


def resolve_pie_data(option: dict, series: dict) -> list[dict]:
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


def resolve_center(series: dict) -> tuple[float, float]:
    center = series.get("center", ["50%", "50%"])
    if not isinstance(center, list) or len(center) != 2:
        center = ["50%", "50%"]
    x = parse_percent(center[0], 1.0, 0.5)
    y = parse_percent(center[1], 1.0, 0.5)
    return x, y


def resolve_explode(data: list[dict], series: dict) -> list[float]:
    selected_offset = float(series.get("selectedOffset", 0) or 0)
    explode = []
    for item in data:
        explode.append(selected_offset / 100.0 if item.get("selected") else 0.0)
    return explode


def apply_text_style(texts: list, label_conf: dict) -> None:
    for text in texts:
        if label_conf.get("color"):
            text.set_color(label_conf.get("color"))
        if label_conf.get("fontSize"):
            text.set_fontsize(label_conf.get("fontSize"))


def render_standard_pie(ax, data: list[dict], option: dict, series: dict, names: list[str], values: list[float], colors: list[str], inner_radius: float, outer_radius: float, label_conf: dict):
    series_item_style = series.get("itemStyle", {})
    total = sum(values) or 1
    label_index = {"value": 0}

    def autopct_formatter(pct: float) -> str:
        index = min(label_index["value"], len(names) - 1)
        label_index["value"] += 1
        value = round(total * pct / 100.0, 2)
        return format_label(label_conf.get("formatter"), names[index], value, pct)

    center = resolve_center(series)
    pie_result = ax.pie(
        values,
        labels=names if label_conf.get("show", True) and label_conf.get("position") != "inside" else None,
        colors=[
            to_rgba(
                color,
                item.get("itemStyle", {}).get("opacity", series_item_style.get("opacity", 1.0)),
            )
            for color, item in zip(colors, data)
        ],
        startangle=series.get("startAngle", 90),
        autopct=autopct_formatter if label_conf.get("show", True) and label_conf.get("position") == "inside" else None,
        wedgeprops={"width": outer_radius - inner_radius} if inner_radius > 0 else None,
        pctdistance=0.72 if inner_radius > 0 else 0.6,
        center=center,
        radius=outer_radius,
        explode=resolve_explode(data, series),
    )
    if len(pie_result) == 3:
        wedges, texts, autotexts = pie_result
    else:
        wedges, texts = pie_result
        autotexts = []

    if label_conf.get("show", True) and label_conf.get("position") != "inside":
        formatter = label_conf.get("formatter")
        for index, text in enumerate(texts):
            percent = values[index] / total * 100.0
            text.set_text(format_label(formatter, names[index], values[index], percent))
        apply_text_style(list(texts), label_conf)

    apply_text_style(list(autotexts), label_conf)

    for wedge, item in zip(wedges, data):
        item_style = item.get("itemStyle", {})
        border_color = item_style.get("borderColor", series_item_style.get("borderColor"))
        border_width = item_style.get("borderWidth", series_item_style.get("borderWidth", 0))
        if border_color is not None:
            wedge.set_edgecolor(border_color)
        if border_width is not None:
            wedge.set_linewidth(border_width)
    return wedges


def render_rose_pie(ax, data: list[dict], series: dict, names: list[str], values: list[float], colors: list[str], inner_radius: float, outer_radius: float, label_conf: dict):
    center = resolve_center(series)
    total = sum(values) or 1
    max_value = max(values) if values else 1
    start_angle = float(series.get("startAngle", 90))
    angle = start_angle
    wedges = []
    text_items = []
    line_items = []

    for index, (item, name, value, color) in enumerate(zip(data, names, values, colors)):
        theta = 360.0 * value / total
        scale = math.sqrt(value / max_value) if series.get("roseType") == "area" and max_value else (value / max_value if max_value else 1.0)
        item_outer_radius = inner_radius + (outer_radius - inner_radius) * scale
        wedge = Wedge(
            center,
            item_outer_radius,
            angle,
            angle + theta,
            width=item_outer_radius - inner_radius if inner_radius > 0 else None,
            facecolor=to_rgba(color, item.get("itemStyle", {}).get("opacity", series.get("itemStyle", {}).get("opacity", 1.0))),
            edgecolor=item.get("itemStyle", {}).get("borderColor", series.get("itemStyle", {}).get("borderColor")),
            linewidth=item.get("itemStyle", {}).get("borderWidth", series.get("itemStyle", {}).get("borderWidth", 0)),
        )
        ax.add_patch(wedge)
        wedges.append(wedge)

        mid_angle = math.radians(angle + theta / 2.0)
        if label_conf.get("show", True):
            if label_conf.get("position") == "inside":
                label_radius = inner_radius + (item_outer_radius - inner_radius) * 0.55
                x = center[0] + label_radius * math.cos(mid_angle)
                y = center[1] + label_radius * math.sin(mid_angle)
                text = ax.text(
                    x,
                    y,
                    format_label(label_conf.get("formatter"), name, value, value / total * 100.0),
                    ha="center",
                    va="center",
                )
                text_items.append(text)
            else:
                line_start_radius = item_outer_radius
                line_mid_radius = item_outer_radius + 0.10
                text_radius = item_outer_radius + 0.18
                x1 = center[0] + line_start_radius * math.cos(mid_angle)
                y1 = center[1] + line_start_radius * math.sin(mid_angle)
                x2 = center[0] + line_mid_radius * math.cos(mid_angle)
                y2 = center[1] + line_mid_radius * math.sin(mid_angle)
                x3 = center[0] + text_radius * math.cos(mid_angle)
                y3 = center[1] + text_radius * math.sin(mid_angle)
                if label_conf.get("labelLine", {}).get("show", True):
                    line_items.extend(ax.plot([x1, x2, x3], [y1, y2, y3], color="#94a3b8", linewidth=0.8))
                text = ax.text(
                    x3,
                    y3,
                    format_label(label_conf.get("formatter"), name, value, value / total * 100.0),
                    ha="left" if math.cos(mid_angle) >= 0 else "right",
                    va="center",
                )
                text_items.append(text)
        angle += theta

    apply_text_style(text_items, label_conf)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    return wedges


def main() -> None:
    parser = build_parser("Render a pie chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    series = next((item for item in option.get("series", []) if item.get("type", "pie") == "pie"), None)
    if not series:
        raise ValueError("No pie series found in option.series.")

    data = resolve_pie_data(option, series)
    series_item_style = series.get("itemStyle", {})
    names = [item.get("name", f"item-{index + 1}") for index, item in enumerate(data)]
    values = [item.get("value", 0) for item in data]
    colors = [
        item.get("itemStyle", {}).get(
            "color",
            series_color(option, {"itemStyle": {"color": series_item_style.get("color") or item.get("itemStyle", {}).get("color")}}, index),
        )
        for index, item in enumerate(data)
    ]
    inner_radius, outer_radius = pie_radius(series.get("radius"))
    label_conf = series.get("label", {})
    if not data:
        raise ValueError("No pie data found in series.data or dataset source.")

    if series.get("roseType") in ("radius", "area"):
        wedges = render_rose_pie(ax, data, series, names, values, colors, inner_radius, outer_radius, label_conf)
    else:
        wedges = render_standard_pie(ax, data, option, series, names, values, colors, inner_radius, outer_radius, label_conf)

    ax.set_aspect("equal")
    apply_title(fig, ax, option)
    apply_legend(ax, option, handles=wedges, labels=names)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
