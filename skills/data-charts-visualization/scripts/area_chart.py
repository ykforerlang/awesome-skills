#!/usr/bin/env python3
"""Render area charts from ECharts-like options."""

from __future__ import annotations

from collections import defaultdict

from bootstrap import bootstrap_runtime

bootstrap_runtime()

import numpy as np
from matplotlib import colors as mcolors
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Polygon

from common import (
    apply_axis_style,
    apply_legend,
    apply_title,
    build_parser,
    create_figure,
    format_label,
    load_option,
    prepare_x_axis,
    resolve_line_style,
    resolve_series_marker,
    resolve_xy,
    save_figure,
    series_color,
    to_rgba,
)


def prepare_area_series(x_plot, y_values, connect_nulls: bool = False):
    points = [(x_item, y_item) for x_item, y_item in zip(x_plot, y_values) if y_item is not None]
    if connect_nulls:
        if not points:
            return np.asarray([], dtype=float), np.asarray([], dtype=float), np.asarray([], dtype=float), points
        x_array = np.asarray([item[0] for item in points], dtype=float)
        y_array = np.asarray([item[1] for item in points], dtype=float)
        baseline = np.zeros_like(y_array)
        return x_array, y_array, baseline, points

    x_array = np.asarray(x_plot, dtype=float)
    y_array = np.asarray([np.nan if value is None else float(value) for value in y_values], dtype=float)
    baseline = np.zeros_like(y_array)
    return x_array, y_array, baseline, points


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


def gradient_cmap(gradient_conf: dict):
    stops = gradient_conf.get("colorStops") or []
    if not stops:
        return None
    stop_values = []
    for item in stops:
        offset = float(item.get("offset", 0))
        color = item.get("color", "#5470c6")
        stop_values.append((offset, color))
    stop_values.sort(key=lambda item: item[0])
    return LinearSegmentedColormap.from_list("area-gradient", stop_values)


def fill_area_gradient(ax, x_values, lower_values, upper_values, gradient_conf: dict, opacity: float, zorder: int = 1):
    if len(x_values) < 2:
        return

    x_array = np.asarray(x_values, dtype=float)
    lower_array = np.asarray(lower_values, dtype=float)
    upper_array = np.asarray(upper_values, dtype=float)
    xmin = float(np.min(x_array))
    xmax = float(np.max(x_array))
    ymin = float(np.min(np.concatenate([lower_array, upper_array])))
    ymax = float(np.max(np.concatenate([lower_array, upper_array])))
    if ymax <= ymin:
        ymax = ymin + 1e-6

    vertices = np.column_stack(
        [
            np.concatenate([x_array, x_array[::-1]]),
            np.concatenate([upper_array, lower_array[::-1]]),
        ]
    )
    polygon = Polygon(vertices, closed=True, facecolor="none", edgecolor="none")
    ax.add_patch(polygon)

    cmap = gradient_cmap(gradient_conf)
    if cmap is None:
        ax.fill_between(x_array, lower_array, upper_array, color=to_rgba("#5470c6", opacity), zorder=zorder)
        return

    x0 = float(gradient_conf.get("x", 0))
    y0 = float(gradient_conf.get("y", 0))
    x1 = float(gradient_conf.get("x2", 0))
    y1 = float(gradient_conf.get("y2", 1))
    vertical = abs(y1 - y0) >= abs(x1 - x0)
    if vertical:
        gradient = np.linspace(0, 1, 256).reshape(256, 1)
    else:
        gradient = np.linspace(0, 1, 256).reshape(1, 256)

    image = ax.imshow(
        gradient,
        extent=[xmin, xmax, ymin, ymax],
        origin="lower",
        aspect="auto",
        cmap=cmap,
        alpha=opacity,
        zorder=zorder,
    )
    image.set_clip_path(polygon)


def main() -> None:
    parser = build_parser("Render an area chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    x_axis = option.get("xAxis", {}) if isinstance(option.get("xAxis"), dict) else (option.get("xAxis") or [{}])[0]
    y_axis = option.get("yAxis", {}) if isinstance(option.get("yAxis"), dict) else (option.get("yAxis") or [{}])[0]
    stack_state = defaultdict(lambda: None)

    for index, series in enumerate(option.get("series", [])):
        if series.get("type", "line") not in ("line", "area"):
            continue
        x_values, y_values = resolve_xy(option, series, x_axis or {})
        x_plot = prepare_x_axis(ax, x_values, x_axis or {})
        connect_nulls = bool(series.get("connectNulls"))
        line_x, y_array, baseline, label_points = prepare_area_series(x_plot, y_values, connect_nulls=connect_nulls)
        color = series_color(option, series, index)
        line_style = series.get("lineStyle", {})
        marker = resolve_series_marker(series)
        stack_key = series.get("stack")
        if len(y_array) == 0:
            continue
        if stack_key:
            existing = stack_state[stack_key]
            if existing is not None:
                baseline = existing
            stack_state[stack_key] = baseline + y_array
        plotted_y = baseline + y_array if stack_key else y_array
        area_style = series.get("areaStyle", {})
        smooth = bool(series.get("smooth"))
        line_y = np.asarray(plotted_y, dtype=float)
        fill_x = line_x
        fill_lower = np.asarray(baseline, dtype=float)
        fill_upper = line_y
        if smooth and not np.isnan(line_y).any():
            line_x, line_y = smooth_curve(line_x, line_y)
            _, fill_lower = smooth_curve(np.asarray(fill_x, dtype=float), np.asarray(baseline, dtype=float))
            fill_x = line_x
            fill_upper = line_y

        ax.plot(
            line_x,
            line_y,
            label=series.get("name", f"series-{index + 1}"),
            color=color,
            linewidth=line_style.get("width", 2.0),
            linestyle=resolve_line_style(line_style.get("type")),
            marker=None if smooth else marker,
            markersize=series.get("symbolSize", 4),
        )
        if smooth and marker is not None and label_points:
            ax.plot(
                [item[0] for item in label_points],
                [item[1] for item in label_points],
                linestyle="None",
                marker=marker,
                markersize=series.get("symbolSize", 4),
                color=color,
            )
        area_color = area_style.get("color", color)
        if isinstance(area_color, dict) and area_color.get("type") == "linear":
            fill_area_gradient(
                ax,
                fill_x,
                fill_lower,
                fill_upper,
                area_color,
                area_style.get("opacity", 0.35),
            )
        else:
            ax.fill_between(
                fill_x,
                fill_lower,
                fill_upper,
                color=to_rgba(area_color, area_style.get("opacity", 0.35)),
            )
        label_conf = series.get("label", {})
        if label_conf.get("show"):
            formatter = label_conf.get("formatter")
            if connect_nulls:
                label_source = [
                    (x_item, y_item, raw_x, raw_y)
                    for x_item, y_item, raw_x, raw_y in zip(x_plot, plotted_y, x_values, y_values)
                    if raw_y is not None
                ]
            else:
                label_source = list(zip(x_plot, plotted_y, x_values, y_values))

            for x_item, y_item, raw_name, raw_value in label_source:
                if raw_value is None:
                    continue
                ax.text(
                    x_item,
                    y_item,
                    format_label(formatter, raw_name, raw_value),
                    fontsize=label_conf.get("fontSize", 9),
                    color=label_conf.get("color"),
                    ha="center",
                    va="bottom",
                )

    apply_title(fig, ax, option)
    apply_axis_style(ax, x_axis or {}, y_axis or {})
    if option.get("backgroundColor"):
        ax.set_facecolor(to_rgba(option.get("backgroundColor")))
    apply_legend(ax, option)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
