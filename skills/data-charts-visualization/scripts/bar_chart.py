#!/usr/bin/env python3
"""Render bar charts from ECharts-like options."""

from __future__ import annotations

from collections import defaultdict

from bootstrap import bootstrap_runtime

bootstrap_runtime()

import numpy as np

from common import (
    apply_axis_style,
    apply_legend,
    apply_title,
    build_parser,
    create_figure,
    format_label,
    first_scalar,
    load_option,
    parse_percent,
    resolve_xy,
    save_figure,
    series_color,
    to_rgba,
)


def resolve_bar_gap(option: dict, series_list: list[dict]) -> float:
    for series in series_list:
        if series.get("barGap") is not None:
            return parse_percent(series.get("barGap"), 1.0, 0.3)
    return parse_percent(option.get("barGap"), 1.0, 0.3)


def resolve_group_bar_width(group_series: list[dict], fallback: float, category_span: float) -> float:
    for series in group_series:
        if series.get("barWidth") is not None:
            return parse_percent(series.get("barWidth"), category_span, fallback)
    return fallback


def build_group_offsets(group_keys: list[str], group_series_map: dict[str, list[dict]], option: dict) -> tuple[dict[str, float], dict[str, float]]:
    if not group_keys:
        return {}, {}

    category_span = 0.8
    gap_ratio = resolve_bar_gap(option, [series for group in group_series_map.values() for series in group])
    default_width = category_span / max(len(group_keys) + gap_ratio * max(len(group_keys) - 1, 0), 1)
    group_widths = {
        group_key: resolve_group_bar_width(group_series_map[group_key], default_width, category_span)
        for group_key in group_keys
    }
    average_width = sum(group_widths.values()) / len(group_widths)
    gap = 0.0 if len(group_keys) <= 1 else average_width * gap_ratio
    total_span = sum(group_widths.values()) + gap * max(len(group_keys) - 1, 0)

    offsets: dict[str, float] = {}
    cursor = -total_span / 2.0
    for group_key in group_keys:
        width = group_widths[group_key]
        offsets[group_key] = cursor + width / 2.0
        cursor += width + gap
    return offsets, group_widths


def resolve_bar_colors(series: dict, default_color: str, default_opacity: float) -> list[tuple[float, float, float, float]] | tuple[float, float, float, float]:
    raw_data = series.get("data", [])
    if raw_data and isinstance(raw_data[0], dict):
        return [
            to_rgba(
                item.get("itemStyle", {}).get("color", default_color),
                item.get("itemStyle", {}).get("opacity", default_opacity),
            )
            for item in raw_data
        ]
    return to_rgba(default_color, default_opacity)


def resolve_bar_data(option: dict, series: dict, category_axis: dict, horizontal: bool) -> tuple[list, list]:
    if series.get("data") is not None:
        data = series.get("data", [])
        if data and isinstance(data[0], (list, tuple)) and len(data[0]) >= 2:
            if horizontal:
                return [item[1] for item in data], [item[0] for item in data]
            return [item[0] for item in data], [item[1] for item in data]
        if data and isinstance(data[0], dict):
            return [item.get("name") for item in data], [item.get("value") for item in data]
        categories = category_axis.get("data") or list(range(len(data)))
        return categories, data

    dataset = option.get("dataset", {})
    source = dataset.get("source")
    if not source:
        return resolve_xy(option, series, category_axis or {})

    encode = series.get("encode", {})
    if isinstance(source, list) and source and isinstance(source[0], dict):
        if horizontal:
            category_field = first_scalar(encode.get("y")) or first_scalar(list(source[0].keys()))
            value_field = first_scalar(encode.get("x"))
        else:
            category_field = first_scalar(encode.get("x")) or first_scalar(list(source[0].keys()))
            value_field = first_scalar(encode.get("y"))
        if value_field is None:
            remaining = [key for key in source[0].keys() if key != category_field]
            value_field = remaining[0] if remaining else category_field
        return [row.get(category_field) for row in source], [row.get(value_field) for row in source]

    if isinstance(source, list) and source and isinstance(source[0], list):
        header_row = source[0]
        has_header_row = all(isinstance(item, str) for item in header_row)
        data_rows = source[1:] if has_header_row else source
        dimensions = header_row if has_header_row else dataset.get("dimensions") or [str(index) for index in range(len(data_rows[0]))]
        if horizontal:
            category_field = first_scalar(encode.get("y")) or dimensions[0]
            value_field = first_scalar(encode.get("x")) or dimensions[1]
        else:
            category_field = first_scalar(encode.get("x")) or dimensions[0]
            value_field = first_scalar(encode.get("y")) or dimensions[1]
        category_index = dimensions.index(category_field)
        value_index = dimensions.index(value_field)
        return [row[category_index] for row in data_rows], [row[value_index] for row in data_rows]

    return [], []


def render_bar_labels(ax, bars, labels: list[str], values: list[float], label_conf: dict, horizontal: bool = False) -> None:
    if not label_conf.get("show"):
        return

    formatter = label_conf.get("formatter")
    fontsize = label_conf.get("fontSize", 9)
    color = label_conf.get("color")
    position = label_conf.get("position", "top")

    for patch, category_label, value in zip(bars.patches, labels, values):
        if horizontal:
            bar_end = patch.get_x() + patch.get_width()
            y_center = patch.get_y() + patch.get_height() / 2.0
            if position in ("inside", "insideRight", "insideLeft"):
                xy = (bar_end, y_center)
                xytext = (-4 if value >= 0 else 4, 0)
                ha = "right" if value >= 0 else "left"
            else:
                xy = (bar_end, y_center)
                xytext = (4 if value >= 0 else -4, 0)
                ha = "left" if value >= 0 else "right"
            va = "center"
        else:
            bar_top = patch.get_y() + patch.get_height()
            if position in ("inside", "insideTop"):
                xy = (patch.get_x() + patch.get_width() / 2.0, bar_top)
                xytext = (0, -4 if value >= 0 else 4)
                va = "top" if value >= 0 else "bottom"
            else:
                xy = (patch.get_x() + patch.get_width() / 2.0, bar_top)
                xytext = (0, 4 if value >= 0 else -4)
                va = "bottom" if value >= 0 else "top"
            ha = "center"

        text = str(value) if not formatter else format_label(formatter, category_label, value)
        ax.annotate(
            text,
            xy=xy,
            xytext=xytext,
            textcoords="offset points",
            ha=ha,
            va=va,
            fontsize=fontsize,
            color=color,
        )


def main() -> None:
    parser = build_parser("Render a bar chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    x_axis = option.get("xAxis", {}) if isinstance(option.get("xAxis"), dict) else (option.get("xAxis") or [{}])[0]
    y_axis = option.get("yAxis", {}) if isinstance(option.get("yAxis"), dict) else (option.get("yAxis") or [{}])[0]
    horizontal = (x_axis or {}).get("type") == "value" and (y_axis or {}).get("type") == "category"
    category_axis = y_axis if horizontal else x_axis
    series_list = [series for series in option.get("series", []) if series.get("type", "bar") == "bar"]

    if not series_list:
        raise ValueError("No bar series found in option.series.")

    categories, _ = resolve_bar_data(option, series_list[0], category_axis or {}, horizontal)
    labels = [str(item) for item in categories]
    positions = np.arange(len(labels))
    stack_groups = []
    stack_bottoms = defaultdict(lambda: np.zeros(len(labels)))
    group_lookup = {}
    group_series_map = defaultdict(list)

    for index, series in enumerate(series_list):
        group_key = series.get("stack") or f"__single__{index}"
        group_lookup[id(series)] = group_key
        if group_key not in stack_groups:
            stack_groups.append(group_key)
        group_series_map[group_key].append(series)

    group_offsets, group_widths = build_group_offsets(stack_groups, group_series_map, option)

    for index, series in enumerate(series_list):
        _, values = resolve_bar_data(option, series, category_axis or {}, horizontal)
        color = series_color(option, series, index)
        item_style = series.get("itemStyle", {})
        opacity = item_style.get("opacity", 1.0)
        group_key = group_lookup[id(series)]
        offset = group_offsets[group_key]
        bottom = stack_bottoms[group_key] if series.get("stack") else None
        if horizontal:
            bars = ax.barh(
                positions + offset,
                values,
                height=group_widths[group_key],
                label=series.get("name", f"series-{index + 1}"),
                color=resolve_bar_colors(series, color, opacity),
                edgecolor=item_style.get("borderColor"),
                linewidth=item_style.get("borderWidth", 0),
                left=bottom,
            )
        else:
            bars = ax.bar(
                positions + offset,
                values,
                width=group_widths[group_key],
                label=series.get("name", f"series-{index + 1}"),
                color=resolve_bar_colors(series, color, opacity),
                edgecolor=item_style.get("borderColor"),
                linewidth=item_style.get("borderWidth", 0),
                bottom=bottom,
            )
        render_bar_labels(ax, bars, labels, values, series.get("label", {}), horizontal=horizontal)
        if series.get("stack"):
            stack_bottoms[group_key] = stack_bottoms[group_key] + np.array(values, dtype=float)

    if horizontal:
        ax.set_yticks(positions)
        ax.set_yticklabels(labels, rotation=y_axis.get("axisLabel", {}).get("rotate", 0))
    else:
        ax.set_xticks(positions)
        ax.set_xticklabels(labels, rotation=x_axis.get("axisLabel", {}).get("rotate", 0))
    apply_title(fig, ax, option)
    apply_axis_style(ax, x_axis or {}, y_axis or {})
    if option.get("backgroundColor"):
        ax.set_facecolor(to_rgba(option.get("backgroundColor")))
    apply_legend(ax, option)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
