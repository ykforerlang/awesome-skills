#!/usr/bin/env python3
"""Render line charts from ECharts-like options."""

from __future__ import annotations

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
    load_option,
    prepare_x_axis,
    resolve_marker,
    resolve_series_marker,
    resolve_line_style,
    resolve_xy,
    save_figure,
    series_color,
    to_rgba,
)


def prepare_line_series(x_plot, y_values, connect_nulls: bool = False):
    points = [(x_item, y_item) for x_item, y_item in zip(x_plot, y_values) if y_item is not None]
    if connect_nulls:
        if not points:
            return np.asarray([], dtype=float), np.asarray([], dtype=float), []
        x_clean = np.asarray([item[0] for item in points], dtype=float)
        y_clean = np.asarray([item[1] for item in points], dtype=float)
        return x_clean, y_clean, points

    x_array = np.asarray(x_plot, dtype=float)
    y_array = np.asarray([np.nan if value is None else float(value) for value in y_values], dtype=float)
    return x_array, y_array, points


def smooth_curve(x_values, y_values, points_per_segment: int = 24):
    x_array = np.asarray(x_values, dtype=float)
    y_array = np.asarray(y_values, dtype=float)
    if len(x_array) < 3:
        return x_array, y_array

    tangents = np.zeros_like(y_array, dtype=float)
    tangents[0] = y_array[1] - y_array[0]
    tangents[-1] = y_array[-1] - y_array[-2]
    for index in range(1, len(y_array) - 1):
        tangents[index] = (y_array[index + 1] - y_array[index - 1]) / 2.0

    smooth_x = []
    smooth_y = []
    for index in range(len(x_array) - 1):
        x0 = x_array[index]
        x1 = x_array[index + 1]
        y0 = y_array[index]
        y1 = y_array[index + 1]
        m0 = tangents[index]
        m1 = tangents[index + 1]
        segment_t = np.linspace(0.0, 1.0, points_per_segment, endpoint=False)
        h00 = 2 * segment_t**3 - 3 * segment_t**2 + 1
        h10 = segment_t**3 - 2 * segment_t**2 + segment_t
        h01 = -2 * segment_t**3 + 3 * segment_t**2
        h11 = segment_t**3 - segment_t**2
        dx = x1 - x0
        segment_x = x0 + dx * segment_t
        segment_y = h00 * y0 + h10 * dx * m0 + h01 * y1 + h11 * dx * m1
        smooth_x.extend(segment_x.tolist())
        smooth_y.extend(segment_y.tolist())

    smooth_x.append(float(x_array[-1]))
    smooth_y.append(float(y_array[-1]))
    return np.asarray(smooth_x), np.asarray(smooth_y)


def resolve_step_drawstyle(step) -> str | None:
    mapping = {
        True: "steps-post",
        "start": "steps-pre",
        "middle": "steps-mid",
        "end": "steps-post",
    }
    return mapping.get(step)


def main() -> None:
    parser = build_parser("Render a line chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    x_axis = option.get("xAxis", {}) if isinstance(option.get("xAxis"), dict) else (option.get("xAxis") or [{}])[0]
    y_axis = option.get("yAxis", {}) if isinstance(option.get("yAxis"), dict) else (option.get("yAxis") or [{}])[0]

    for index, series in enumerate(option.get("series", [])):
        if series.get("type", "line") != "line":
            continue
        x_values, y_values = resolve_xy(option, series, x_axis or {})
        x_plot = prepare_x_axis(ax, x_values, x_axis or {})
        color = series_color(option, series, index)
        line_style = series.get("lineStyle", {})
        marker = resolve_series_marker(series)
        smooth = bool(series.get("smooth"))
        connect_nulls = bool(series.get("connectNulls"))
        drawstyle = resolve_step_drawstyle(series.get("step"))
        line_x, line_y, label_points = prepare_line_series(x_plot, y_values, connect_nulls=connect_nulls)
        if smooth and len(line_y) and not np.isnan(line_y).any():
            line_x, line_y = smooth_curve(line_x, line_y)
        ax.plot(
            line_x,
            line_y,
            label=series.get("name", f"series-{index + 1}"),
            color=color,
            linewidth=line_style.get("width", 2.2),
            linestyle=resolve_line_style(line_style.get("type")),
            marker=None if smooth else marker,
            markersize=series.get("symbolSize", 5),
            drawstyle=drawstyle,
        )
        if smooth and marker is not None and label_points:
            ax.plot(
                [item[0] for item in label_points],
                [item[1] for item in label_points],
                linestyle="None",
                marker=marker,
                markersize=series.get("symbolSize", 5),
                color=color,
            )
        if series.get("label", {}).get("show"):
            formatter = series.get("label", {}).get("formatter")
            for x_item, y_item, raw_name in zip(x_plot, y_values, x_values):
                if y_item is None:
                    continue
                ax.text(
                    x_item,
                    y_item,
                    format_label(formatter, raw_name, y_item, series_name=series.get("name")),
                    fontsize=series.get("label", {}).get("fontSize", 9),
                    color=series.get("label", {}).get("color"),
                    ha="center",
                    va="bottom",
                )

    apply_title(fig, ax, option)
    apply_axis_style(ax, x_axis or {}, y_axis or {})
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
