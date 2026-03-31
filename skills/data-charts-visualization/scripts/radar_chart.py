#!/usr/bin/env python3
"""Render radar charts from ECharts-like options."""

from __future__ import annotations

import math

from bootstrap import bootstrap_runtime

bootstrap_runtime()

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
from matplotlib.patches import Circle, Polygon

from common import (
    apply_legend,
    apply_title,
    build_parser,
    create_figure,
    format_label,
    load_option,
    normalize_font,
    parse_percent,
    resolve_line_style,
    resolve_series_marker,
    save_figure,
    series_color,
    to_rgba,
)


def radar_angles(count: int) -> list[float]:
    return [math.pi / 2.0 - 2.0 * math.pi * index / count for index in range(count)]


def radar_point(angle: float, radius: float) -> tuple[float, float]:
    return radius * math.cos(angle), radius * math.sin(angle)


def radar_layout(radar_conf: dict) -> tuple[tuple[float, float], float]:
    center = radar_conf.get("center", ["50%", "50%"])
    if not isinstance(center, list) or len(center) != 2:
        center = ["50%", "50%"]
    center_x = parse_percent(center[0], 2.0, 1.0) - 1.0
    center_y = 1.0 - parse_percent(center[1], 2.0, 1.0)
    radius = parse_percent(radar_conf.get("radius"), 1.0, 1.0)
    return (center_x, center_y), radius


def indicator_bounds(indicators: list[dict]) -> list[tuple[float, float]]:
    return [(float(item.get("min", 0)), float(item.get("max", 100))) for item in indicators]


def normalize_value(value: float, min_value: float, max_value: float) -> float:
    if max_value == min_value:
        return 0.0
    ratio = (float(value) - min_value) / (max_value - min_value)
    return max(0.0, min(1.0, ratio))


def draw_radar_grid(ax, radar_conf: dict, indicators: list[dict], angles: list[float]) -> None:
    shape = radar_conf.get("shape", "polygon")
    split_number = int(radar_conf.get("splitNumber", 5) or 5)
    axis_name = radar_conf.get("axisName", {})
    split_line = radar_conf.get("splitLine", {})
    split_line_style = split_line.get("lineStyle", {})
    split_area = radar_conf.get("splitArea", {})
    axis_line = radar_conf.get("axisLine", {})
    axis_line_style = axis_line.get("lineStyle", {})
    split_area_colors = split_area.get("areaStyle", {}).get("color") or []
    center, radius_scale = radar_layout(radar_conf)

    for level in range(split_number, 0, -1):
        radius = radius_scale * level / split_number
        facecolor = "none"
        if split_area_colors:
            facecolor = to_rgba(split_area_colors[(split_number - level) % len(split_area_colors)], split_area.get("areaStyle", {}).get("opacity", 1.0))
        if shape == "circle":
            patch = Circle(
                center,
                radius,
                facecolor=facecolor,
                edgecolor=split_line_style.get("color", "#d0d7de"),
                linewidth=split_line_style.get("width", 0.8),
                linestyle=resolve_line_style(split_line_style.get("type"), "-"),
            )
        else:
            vertices = [(center[0] + x, center[1] + y) for x, y in [radar_point(angle, radius) for angle in angles]]
            patch = Polygon(
                vertices,
                closed=True,
                facecolor=facecolor,
                edgecolor=split_line_style.get("color", "#d0d7de"),
                linewidth=split_line_style.get("width", 0.8),
                linestyle=resolve_line_style(split_line_style.get("type"), "-"),
            )
        ax.add_patch(patch)

    for angle, indicator in zip(angles, indicators):
        x_value, y_value = radar_point(angle, radius_scale)
        ax.plot(
            [center[0], center[0] + x_value],
            [center[1], center[1] + y_value],
            color=axis_line_style.get("color", "#94a3b8"),
            linewidth=axis_line_style.get("width", 1.0),
            linestyle=resolve_line_style(axis_line_style.get("type"), "-"),
        )
        label_x, label_y = radar_point(angle, radius_scale * 1.12)
        ax.text(
            center[0] + label_x,
            center[1] + label_y,
            indicator.get("name", ""),
            ha="center",
            va="center",
            **normalize_font(axis_name),
        )


def resolve_radar_data(series: dict) -> list[dict]:
    result = []
    for item in series.get("data", []):
        if isinstance(item, dict):
            result.append(item)
        elif isinstance(item, (list, tuple)):
            result.append({"name": series.get("name"), "value": list(item)})
    return result


def legend_handle(color: str, linestyle: str, marker: str | None) -> Line2D:
    return Line2D([0], [0], color=color, linestyle=linestyle, marker=marker)


def main() -> None:
    parser = build_parser("Render a radar chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    ax.set_aspect("equal")
    ax.axis("off")

    radar_conf = option.get("radar", {}) or {}
    indicators = radar_conf.get("indicator") or []
    if not indicators:
        raise ValueError("No radar.indicator configured.")

    angles = radar_angles(len(indicators))
    bounds = indicator_bounds(indicators)
    draw_radar_grid(ax, radar_conf, indicators, angles)

    handles = []
    labels = []
    series_counter = 0
    for series in option.get("series", []):
        if series.get("type") != "radar":
            continue
        marker = resolve_series_marker(series)
        line_style = series.get("lineStyle", {})
        area_style = series.get("areaStyle", {})
        label_conf = series.get("label", {})
        for item in resolve_radar_data(series):
            values = item.get("value", [])
            if len(values) != len(indicators):
                continue
            color = series_color(option, series, series_counter)
            radius_values = [normalize_value(value, min_value, max_value) for value, (min_value, max_value) in zip(values, bounds)]
            center, radius_scale = radar_layout(radar_conf)
            vertices = [
                (center[0] + x, center[1] + y)
                for x, y in [radar_point(angle, radius_scale * radius) for angle, radius in zip(angles, radius_values)]
            ]
            closed_vertices = vertices + [vertices[0]]
            x_values = [point[0] for point in closed_vertices]
            y_values = [point[1] for point in closed_vertices]

            ax.plot(
                x_values,
                y_values,
                color=color,
                linewidth=line_style.get("width", 2.2),
                linestyle=resolve_line_style(line_style.get("type")),
            )
            if area_style:
                ax.fill(
                    x_values,
                    y_values,
                    color=to_rgba(area_style.get("color", color), area_style.get("opacity", 0.22)),
                )
            if marker is not None:
                ax.scatter(
                    [point[0] for point in vertices],
                    [point[1] for point in vertices],
                    marker=marker,
                    s=float(series.get("symbolSize", 30) or 30),
                    color=color,
                )
            if label_conf.get("show"):
                formatter = label_conf.get("formatter")
                for indicator, point, raw_value in zip(indicators, vertices, values):
                    ax.text(
                        point[0],
                        point[1],
                        format_label(formatter, indicator.get("name"), raw_value, series_name=item.get("name", series.get("name"))),
                        fontsize=label_conf.get("fontSize", 9),
                        color=label_conf.get("color"),
                        ha="center",
                        va="bottom",
                    )
            handles.append(legend_handle(color, resolve_line_style(line_style.get("type")), marker))
            labels.append(item.get("name", series.get("name", f"series-{series_counter + 1}")))
            series_counter += 1

    ax.set_xlim(-1.25, 1.25)
    ax.set_ylim(-1.2, 1.2)
    if option.get("backgroundColor"):
        ax.set_facecolor(to_rgba(option.get("backgroundColor")))
        fig.patch.set_facecolor(to_rgba(option.get("backgroundColor")))

    apply_title(fig, ax, option)
    apply_legend(ax, option, handles=handles, labels=labels)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
