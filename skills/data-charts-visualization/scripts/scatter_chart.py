#!/usr/bin/env python3
"""Render scatter charts from ECharts-like options."""

from __future__ import annotations

from bootstrap import bootstrap_runtime

bootstrap_runtime()

from common import (
    apply_axis_style,
    apply_legend,
    apply_title,
    build_parser,
    create_figure,
    first_scalar,
    format_label,
    load_option,
    resolve_marker,
    save_figure,
    series_color,
    to_rgba,
)


def resolve_scatter_dataset(option: dict, series: dict) -> list[dict]:
    dataset = option.get("dataset", {})
    source = dataset.get("source")
    if not source:
        return []

    encode = series.get("encode", {})
    name_field = first_scalar(encode.get("itemName")) or first_scalar(encode.get("name"))
    x_field = first_scalar(encode.get("x"))
    y_field = first_scalar(encode.get("y"))
    size_field = first_scalar(encode.get("symbolSize")) or first_scalar(encode.get("size"))

    if isinstance(source, list) and source and isinstance(source[0], dict):
        first_row = source[0]
        fields = list(first_row.keys())
        if x_field is None:
            x_field = fields[0]
        if y_field is None:
            y_field = fields[1] if len(fields) > 1 else fields[0]
        return [
            {
                "name": row.get(name_field) if name_field else None,
                "value": [row.get(x_field), row.get(y_field)] + ([row.get(size_field)] if size_field else []),
            }
            for row in source
        ]

    if isinstance(source, list) and source and isinstance(source[0], list):
        header_row = source[0]
        has_header_row = all(isinstance(item, str) for item in header_row)
        data_rows = source[1:] if has_header_row else source
        dimensions = header_row if has_header_row else dataset.get("dimensions") or [str(index) for index in range(len(data_rows[0]))]
        if x_field is None:
            x_field = dimensions[0]
        if y_field is None:
            y_field = dimensions[1] if len(dimensions) > 1 else dimensions[0]
        x_index = dimensions.index(x_field)
        y_index = dimensions.index(y_field)
        name_index = dimensions.index(name_field) if name_field in dimensions else None
        size_index = dimensions.index(size_field) if size_field in dimensions else None
        return [
            {
                "name": row[name_index] if name_index is not None else None,
                "value": [row[x_index], row[y_index]] + ([row[size_index]] if size_index is not None else []),
            }
            for row in data_rows
        ]

    return []


def resolve_scatter_points(option: dict, series: dict) -> list[dict]:
    data = series.get("data")
    if data is None:
        return resolve_scatter_dataset(option, series)

    points = []
    for index, item in enumerate(data):
        if isinstance(item, dict):
            value = item.get("value")
            if not isinstance(value, (list, tuple)):
                value = [index, value]
            points.append(
                {
                    "name": item.get("name"),
                    "value": list(value),
                    "itemStyle": item.get("itemStyle", {}),
                }
            )
            continue
        if isinstance(item, (list, tuple)):
            points.append({"name": None, "value": list(item), "itemStyle": {}})
            continue
        points.append({"name": None, "value": [index, item], "itemStyle": {}})
    return points


def main() -> None:
    parser = build_parser("Render a scatter chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    x_axis = option.get("xAxis", {}) if isinstance(option.get("xAxis"), dict) else (option.get("xAxis") or [{}])[0]
    y_axis = option.get("yAxis", {}) if isinstance(option.get("yAxis"), dict) else (option.get("yAxis") or [{}])[0]

    for series_index, series in enumerate(option.get("series", [])):
        if series.get("type") != "scatter":
            continue
        points = resolve_scatter_points(option, series)
        if not points:
            continue

        default_color = series_color(option, series, series_index)
        series_style = series.get("itemStyle", {})
        marker = resolve_marker(series.get("symbol"))
        default_size = float(series.get("symbolSize", 64) or 64)
        x_values = [point.get("value", [None, None])[0] for point in points]
        y_values = [point.get("value", [None, None])[1] for point in points]
        raw_sizes = [
            float(point.get("value", [None, None, default_size])[2]) if len(point.get("value", [])) > 2 else default_size
            for point in points
        ]
        has_explicit_bubble_size = any(len(point.get("value", [])) > 2 for point in points)
        if has_explicit_bubble_size:
            min_raw = min(raw_sizes)
            max_raw = max(raw_sizes)
            if max_raw > min_raw:
                min_render = max(80.0, default_size * 1.15)
                max_render = max(260.0, default_size * 3.8)
                size_span = max_render - min_render
                sizes = [
                    min_render + ((size - min_raw) / (max_raw - min_raw)) * size_span
                    for size in raw_sizes
                ]
            else:
                sizes = [max(160.0, default_size * 2.2) for _ in raw_sizes]
        else:
            sizes = raw_sizes
        colors = [
            to_rgba(
                point.get("itemStyle", {}).get("color", default_color),
                point.get("itemStyle", {}).get("opacity", series_style.get("opacity", 1.0)),
            )
            for point in points
        ]
        edgecolors = [
            point.get("itemStyle", {}).get("borderColor", series_style.get("borderColor", "none"))
            for point in points
        ]
        linewidths = [
            float(point.get("itemStyle", {}).get("borderWidth", series_style.get("borderWidth", 0)) or 0)
            for point in points
        ]

        ax.scatter(
            x_values,
            y_values,
            s=sizes,
            c=colors,
            marker=marker,
            label=series.get("name", f"series-{series_index + 1}"),
            edgecolors=edgecolors,
            linewidths=linewidths,
        )

        label_conf = series.get("label", {})
        if label_conf.get("show"):
            formatter = label_conf.get("formatter")
            for point, x_value, y_value in zip(points, x_values, y_values):
                raw_value = point.get("value", [])[:2]
                ax.text(
                    x_value,
                    y_value,
                    format_label(formatter, point.get("name"), raw_value, series_name=series.get("name")),
                    fontsize=label_conf.get("fontSize", 9),
                    color=label_conf.get("color"),
                    ha="left",
                    va="bottom",
                )

    apply_title(fig, ax, option)
    apply_axis_style(ax, x_axis or {}, y_axis or {})
    if x_axis.get("min") is not None:
        ax.set_xlim(left=x_axis["min"])
    if x_axis.get("max") is not None:
        ax.set_xlim(right=x_axis["max"])
    if y_axis.get("min") is not None:
        ax.set_ylim(bottom=y_axis["min"])
    if y_axis.get("max") is not None:
        ax.set_ylim(top=y_axis["max"])
    if option.get("backgroundColor"):
        ax.set_facecolor(to_rgba(option.get("backgroundColor")))
    apply_legend(ax, option)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
