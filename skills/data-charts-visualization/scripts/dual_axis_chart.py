#!/usr/bin/env python3
"""Render dual-axis charts from ECharts-like options."""

from __future__ import annotations

from collections import defaultdict

from bootstrap import bootstrap_runtime

bootstrap_runtime()

import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Polygon
from matplotlib.ticker import FuncFormatter

from common import (
    apply_axis_style,
    apply_legend,
    apply_title,
    build_legend_proxy,
    build_parser,
    create_figure,
    first_scalar,
    format_label,
    load_option,
    normalize_font,
    palette,
    parse_percent,
    prepare_x_axis,
    resolve_line_style,
    resolve_series_marker,
    resolve_xy,
    save_figure,
    series_color,
    to_rgba,
)


def ensure_axis_list(value, fallback: dict | None = None) -> list[dict]:
    if isinstance(value, list):
        return value or [fallback or {}]
    if isinstance(value, dict):
        return [value]
    return [fallback or {}]


def is_horizontal_layout(x_axes: list[dict], y_axes: list[dict]) -> bool:
    primary_x = x_axes[0] if x_axes else {}
    primary_y = y_axes[0] if y_axes else {}
    return primary_y.get("type") == "category" and primary_x.get("type") == "value"


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


def resolve_bar_colors(series: dict, default_color: str, default_opacity: float):
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


def resolve_series_visual_color(option: dict, series: dict, index: int) -> str:
    color = series_color(option, series, index)
    if isinstance(color, dict):
        return palette(option)[index % len(palette(option))]
    return color


def resolve_dual_axis_data(option: dict, series: dict, category_axis: dict, horizontal: bool) -> tuple[list, list]:
    if not horizontal:
        return resolve_xy(option, series, category_axis or {})

    if series.get("data") is not None:
        data = series.get("data", [])
        if data and isinstance(data[0], (list, tuple)) and len(data[0]) >= 2:
            return [item[1] for item in data], [item[0] for item in data]
        if data and isinstance(data[0], dict):
            return [item.get("name") for item in data], [item.get("value") for item in data]
        categories = category_axis.get("data") or list(range(len(data)))
        return categories, data

    dataset = option.get("dataset", {})
    source = dataset.get("source")
    if not source:
        return [], []

    encode = series.get("encode", {})
    if isinstance(source, list) and source and isinstance(source[0], dict):
        category_field = first_scalar(encode.get("y")) or first_scalar(list(source[0].keys()))
        value_field = first_scalar(encode.get("x"))
        if value_field is None:
            remaining = [key for key in source[0].keys() if key != category_field]
            value_field = remaining[0] if remaining else category_field
        return [row.get(category_field) for row in source], [row.get(value_field) for row in source]

    if isinstance(source, list) and source and isinstance(source[0], list):
        header_row = source[0]
        has_header_row = all(isinstance(item, str) for item in header_row)
        data_rows = source[1:] if has_header_row else source
        dimensions = header_row if has_header_row else dataset.get("dimensions") or [str(index) for index in range(len(data_rows[0]))]
        category_field = first_scalar(encode.get("y")) or dimensions[0]
        value_field = first_scalar(encode.get("x")) or dimensions[1]
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
        ax.annotate(
            format_label(formatter, category_label, value),
            xy=xy,
            xytext=xytext,
            textcoords="offset points",
            ha=ha,
            va=va,
            fontsize=fontsize,
            color=color,
        )


def render_line_labels(ax, category_positions, values: list[float], label_conf: dict, horizontal: bool = False) -> None:
    if not label_conf.get("show"):
        return

    formatter = label_conf.get("formatter")
    fontsize = label_conf.get("fontSize", 9)
    color = label_conf.get("color")
    for category_pos, value in zip(category_positions, values):
        if value is None:
            continue
        x_value = value if horizontal else category_pos
        y_value = category_pos if horizontal else value
        ax.text(
            x_value,
            y_value,
            format_label(formatter, None, value),
            fontsize=fontsize,
            color=color,
            ha="left" if horizontal else "center",
            va="center" if horizontal else "bottom",
        )


def prepare_line_series_points(category_positions, values: list[float], connect_nulls: bool = False):
    points = [(position, value) for position, value in zip(category_positions, values) if value is not None]
    if connect_nulls:
        if not points:
            return np.asarray([], dtype=float), np.asarray([], dtype=float), []
        x_array = np.asarray([item[0] for item in points], dtype=float)
        y_array = np.asarray([item[1] for item in points], dtype=float)
        return x_array, y_array, points

    x_array = np.asarray(category_positions, dtype=float)
    y_array = np.asarray([np.nan if value is None else float(value) for value in values], dtype=float)
    return x_array, y_array, points


def apply_secondary_y_axis_style(ax, axis_conf: dict) -> None:
    axis_conf = axis_conf or {}
    label_conf = axis_conf.get("axisLabel", {}) or {}
    tick_conf = axis_conf.get("axisTick", {}) or {}
    line_conf = axis_conf.get("axisLine", {}) or {}

    if axis_conf.get("name"):
        ax.set_ylabel(axis_conf["name"], **normalize_font(axis_conf.get("nameTextStyle")))

    tick_params = {"axis": "y", "right": tick_conf.get("show", True)}
    if label_conf.get("show") is False:
        tick_params["labelright"] = False
    if label_conf.get("color") is not None:
        tick_params["colors"] = label_conf.get("color")
    if label_conf.get("fontSize") is not None:
        tick_params["labelsize"] = label_conf.get("fontSize")
    ax.tick_params(**tick_params)

    if line_conf.get("show", True):
        ax.spines["right"].set_color(line_conf.get("lineStyle", {}).get("color", "#6e7079"))
    else:
        ax.spines["right"].set_visible(False)

    formatter = label_conf.get("formatter")
    if isinstance(formatter, str) and "{value}" in formatter:
        ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: formatter.replace("{value}", str(value))))

    if axis_conf.get("min") is not None:
        ax.set_ylim(bottom=axis_conf["min"])
    if axis_conf.get("max") is not None:
        ax.set_ylim(top=axis_conf["max"])


def apply_secondary_x_axis_style(ax, axis_conf: dict) -> None:
    axis_conf = axis_conf or {}
    label_conf = axis_conf.get("axisLabel", {}) or {}
    tick_conf = axis_conf.get("axisTick", {}) or {}
    line_conf = axis_conf.get("axisLine", {}) or {}
    split_conf = axis_conf.get("splitLine", {}) or {}

    ax.xaxis.set_label_position("top")
    ax.xaxis.tick_top()
    if axis_conf.get("name"):
        ax.set_xlabel(axis_conf["name"], **normalize_font(axis_conf.get("nameTextStyle")))

    tick_params = {"axis": "x", "top": tick_conf.get("show", True)}
    if label_conf.get("show") is False:
        tick_params["labeltop"] = False
    if label_conf.get("color") is not None:
        tick_params["colors"] = label_conf.get("color")
    if label_conf.get("fontSize") is not None:
        tick_params["labelsize"] = label_conf.get("fontSize")
    ax.tick_params(**tick_params)

    if line_conf.get("show", True):
        ax.spines["top"].set_color(line_conf.get("lineStyle", {}).get("color", "#6e7079"))
    else:
        ax.spines["top"].set_visible(False)

    if split_conf.get("show"):
        ax.grid(
            axis="x",
            linestyle=resolve_line_style(split_conf.get("lineStyle", {}).get("type"), "--"),
            linewidth=split_conf.get("lineStyle", {}).get("width", 0.8),
            color=split_conf.get("lineStyle", {}).get("color", "#e0e6f1"),
            alpha=split_conf.get("lineStyle", {}).get("opacity", 1.0),
        )

    formatter = label_conf.get("formatter")
    if isinstance(formatter, str) and "{value}" in formatter:
        ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _: formatter.replace("{value}", str(value))))

    if axis_conf.get("min") is not None:
        ax.set_xlim(left=axis_conf["min"])
    if axis_conf.get("max") is not None:
        ax.set_xlim(right=axis_conf["max"])


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
        stop_values.append((float(item.get("offset", 0)), item.get("color", "#5470c6")))
    stop_values.sort(key=lambda item: item[0])
    return LinearSegmentedColormap.from_list("dual-axis-area-gradient", stop_values)


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

    vertical = abs(float(gradient_conf.get("y2", 1)) - float(gradient_conf.get("y", 0))) >= abs(
        float(gradient_conf.get("x2", 0)) - float(gradient_conf.get("x", 0))
    )
    gradient = np.linspace(0, 1, 256).reshape(256, 1) if vertical else np.linspace(0, 1, 256).reshape(1, 256)

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


def render_line_series(
    option: dict,
    axis,
    category_positions: np.ndarray,
    values: list[float],
    series: dict,
    index: int,
    label: str,
    horizontal: bool,
) -> None:
    color = resolve_series_visual_color(option, series, index)
    line_style = series.get("lineStyle", {})
    marker = resolve_series_marker(series)
    line_width = line_style.get("width", 2.2)
    line_type = resolve_line_style(line_style.get("type"))
    smooth = bool(series.get("smooth"))
    connect_nulls = bool(series.get("connectNulls"))
    line_x, line_y, label_points = prepare_line_series_points(category_positions, values, connect_nulls=connect_nulls)
    if len(line_y) == 0:
        return

    if horizontal:
        axis.plot(
            line_y,
            line_x,
            color=color,
            linewidth=line_width,
            linestyle=line_type,
            marker=marker,
            markersize=series.get("symbolSize", 5),
            label=label,
        )
        render_line_labels(axis, line_x, line_y.tolist(), series.get("label", {}), horizontal=True)
        return

    if smooth and not np.isnan(line_y).any():
        line_x, line_y = smooth_curve(line_x, line_y)

    axis.plot(
        line_x,
        line_y,
        color=color,
        linewidth=line_width,
        linestyle=line_type,
        marker=None if smooth else marker,
        markersize=series.get("symbolSize", 5),
        label=label,
    )
    if smooth and marker is not None and label_points:
        axis.plot(
            [item[0] for item in label_points],
            [item[1] for item in label_points],
            linestyle="None",
            marker=marker,
            markersize=series.get("symbolSize", 5),
            color=color,
        )

    area_style = series.get("areaStyle", {})
    if area_style:
        area_color = area_style.get("color", color)
        if isinstance(area_color, dict) and area_color.get("type") == "linear":
            fill_area_gradient(axis, line_x, np.zeros_like(line_y), line_y, area_color, area_style.get("opacity", 0.35))
        else:
            axis.fill_between(
                line_x,
                np.zeros_like(line_y),
                line_y,
                color=to_rgba(area_color, area_style.get("opacity", 0.35)),
            )

    render_line_labels(axis, line_x, line_y.tolist(), series.get("label", {}), horizontal=False)


def main() -> None:
    parser = build_parser("Render a dual-axis chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    x_axes = ensure_axis_list(option.get("xAxis"), {"type": "category"})
    y_axes = ensure_axis_list(option.get("yAxis"), {"type": "value"})
    horizontal = is_horizontal_layout(x_axes, y_axes)

    fig, ax_primary = create_figure(option, args)
    ax_secondary = ax_primary.twiny() if horizontal else ax_primary.twinx()

    primary_value_axis = x_axes[0] if horizontal else y_axes[0]
    secondary_value_axis = (x_axes[1] if len(x_axes) > 1 else {}) if horizontal else (y_axes[1] if len(y_axes) > 1 else {})
    category_axis = y_axes[0] if horizontal else x_axes[0]

    all_series = option.get("series", [])
    if not all_series:
        raise ValueError("No series found in option.series.")

    base_categories, _ = resolve_dual_axis_data(option, all_series[0], category_axis or {}, horizontal)
    category_labels = [str(item) for item in base_categories]
    category_positions = np.arange(len(category_labels), dtype=float)
    handles = []
    labels = []

    if horizontal:
        ax_primary.set_yticks(category_positions)
        ax_primary.set_yticklabels(category_labels, rotation=category_axis.get("axisLabel", {}).get("rotate", 0))
    else:
        if category_axis.get("type") == "value" and all(isinstance(item, (int, float)) for item in base_categories):
            category_positions = np.asarray(prepare_x_axis(ax_primary, base_categories, category_axis or {}), dtype=float)
        else:
            ax_primary.set_xticks(category_positions)
            ax_primary.set_xticklabels(category_labels, rotation=category_axis.get("axisLabel", {}).get("rotate", 0))

    bar_series = [series for series in all_series if series.get("type") == "bar"]
    bar_group_keys = []
    bar_group_lookup = {}
    bar_group_series_map = defaultdict(list)
    for index, series in enumerate(bar_series):
        axis_index = series.get("xAxisIndex", 0) if horizontal else series.get("yAxisIndex", 0)
        stack_key = series.get("stack")
        group_key = f"{axis_index}:{stack_key}" if stack_key else f"{axis_index}:__single__{index}"
        bar_group_lookup[id(series)] = group_key
        if group_key not in bar_group_keys:
            bar_group_keys.append(group_key)
        bar_group_series_map[group_key].append(series)

    group_offsets, group_widths = build_group_offsets(bar_group_keys, bar_group_series_map, option)
    positive_stacks = defaultdict(lambda: np.zeros(len(category_positions), dtype=float))
    negative_stacks = defaultdict(lambda: np.zeros(len(category_positions), dtype=float))

    for index, series in enumerate(all_series):
        _, values = resolve_dual_axis_data(option, series, category_axis or {}, horizontal)
        label = series.get("name", f"series-{index + 1}")
        axis_index = series.get("xAxisIndex", 0) if horizontal else series.get("yAxisIndex", 0)
        target_axis = ax_secondary if axis_index == 1 else ax_primary
        series_type = series.get("type", "line")
        color = resolve_series_visual_color(option, series, index)

        if series_type == "bar":
            item_style = series.get("itemStyle", {})
            opacity = item_style.get("opacity", 0.95)
            group_key = bar_group_lookup[id(series)]
            value_array = np.asarray(values, dtype=float)
            if series.get("stack"):
                positive_base = positive_stacks[group_key]
                negative_base = negative_stacks[group_key]
                bar_base = np.where(value_array >= 0, positive_base, negative_base)
                positive_stacks[group_key] = positive_base + np.where(value_array > 0, value_array, 0.0)
                negative_stacks[group_key] = negative_base + np.where(value_array < 0, value_array, 0.0)
            else:
                bar_base = None

            if horizontal:
                bars = target_axis.barh(
                    category_positions + group_offsets[group_key],
                    values,
                    height=group_widths[group_key],
                    color=resolve_bar_colors(series, color, opacity),
                    edgecolor=item_style.get("borderColor"),
                    linewidth=item_style.get("borderWidth", 0),
                    left=bar_base,
                    label=label,
                )
            else:
                bars = target_axis.bar(
                    category_positions + group_offsets[group_key],
                    values,
                    width=group_widths[group_key],
                    color=resolve_bar_colors(series, color, opacity),
                    edgecolor=item_style.get("borderColor"),
                    linewidth=item_style.get("borderWidth", 0),
                    bottom=bar_base,
                    label=label,
                )

            handles.append(build_legend_proxy(color, is_bar=True))
            labels.append(label)
            render_bar_labels(target_axis, bars, category_labels, values, series.get("label", {}), horizontal=horizontal)
            continue

        render_line_series(option, target_axis, category_positions, values, series, index, label, horizontal)
        handles.append(
            build_legend_proxy(
                color,
                linestyle=resolve_line_style(series.get("lineStyle", {}).get("type")),
                marker=resolve_series_marker(series),
            )
        )
        labels.append(label)

    apply_title(fig, ax_primary, option)
    if horizontal:
        apply_axis_style(ax_primary, primary_value_axis or {}, category_axis or {})
        if primary_value_axis.get("min") is not None:
            ax_primary.set_xlim(left=primary_value_axis["min"])
        if primary_value_axis.get("max") is not None:
            ax_primary.set_xlim(right=primary_value_axis["max"])
        if secondary_value_axis:
            apply_secondary_x_axis_style(ax_secondary, secondary_value_axis)
    else:
        apply_axis_style(ax_primary, category_axis or {}, primary_value_axis or {})
        if primary_value_axis.get("min") is not None:
            ax_primary.set_ylim(bottom=primary_value_axis["min"])
        if primary_value_axis.get("max") is not None:
            ax_primary.set_ylim(top=primary_value_axis["max"])
        if secondary_value_axis:
            apply_secondary_y_axis_style(ax_secondary, secondary_value_axis)

    if option.get("backgroundColor"):
        background = to_rgba(option.get("backgroundColor"))
        ax_primary.set_facecolor(background)
        ax_secondary.set_facecolor(background)

    apply_legend(ax_primary, option, handles=handles, labels=labels)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
