#!/usr/bin/env python3
"""Render gauge charts from ECharts-like options."""

from __future__ import annotations

from bootstrap import bootstrap_runtime

bootstrap_runtime()

from common import (
    apply_title,
    build_parser,
    create_figure,
    gauge_center,
    gauge_formatter,
    gauge_radius,
    load_option,
    parse_percent,
    render_gauge_axis,
    save_figure,
)


def resolve_offset_center(config: dict, default_y: float) -> tuple[float, float]:
    offset = config.get("offsetCenter", [0, default_y])
    if not isinstance(offset, list) or len(offset) != 2:
        return 0.0, default_y
    x = parse_percent(offset[0], 2.0, 0.0)
    y = parse_percent(offset[1], 2.0, default_y)
    return x, y


def resolve_text_position(series: dict, config: dict, default_y: float) -> tuple[float, float]:
    center_x, center_y = gauge_center(series)
    radius = gauge_radius(series)
    offset_x, offset_y = resolve_offset_center(config, default_y)
    return center_x + offset_x * radius, center_y + offset_y * radius


def main() -> None:
    parser = build_parser("Render a gauge chart from an ECharts-compatible option.")
    args = parser.parse_args()
    option = load_option(args)

    fig, ax = create_figure(option, args)
    series = next((item for item in option.get("series", []) if item.get("type", "gauge") == "gauge"), None)
    if not series:
        raise ValueError("No gauge series found in option.series.")

    datum = (series.get("data") or [{}])[0]
    value = float(datum.get("value", 0))
    min_value = float(series.get("min", 0))
    max_value = float(series.get("max", 100))

    ax.set_xlim(-1.2, 1.2)
    ax.set_ylim(-1.1, 1.2)
    ax.set_aspect("equal")
    ax.axis("off")

    render_gauge_axis(ax, series, value, min_value, max_value)

    title_conf = series.get("title", {})
    if title_conf.get("show", True):
        title_x, title_y = resolve_text_position(series, title_conf, -0.22)
        ax.text(
            title_x,
            title_y,
            datum.get("name", ""),
            ha="center",
            va="center",
            fontsize=title_conf.get("fontSize", 12),
            color=title_conf.get("color", "#6e7079"),
        )

    detail_conf = series.get("detail", {})
    if detail_conf.get("show", True):
        detail_x, detail_y = resolve_text_position(series, detail_conf, -0.42)
        ax.text(
            detail_x,
            detail_y,
            gauge_formatter(detail_conf.get("formatter", "{value}"), value),
            ha="center",
            va="center",
            fontsize=detail_conf.get("fontSize", 22),
            color=detail_conf.get("color", "#464646"),
            fontweight=detail_conf.get("fontWeight", "bold"),
        )

    apply_title(fig, ax, option)
    save_figure(fig, args.output, args.transparent)


if __name__ == "__main__":
    main()
