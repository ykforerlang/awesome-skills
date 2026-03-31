#!/usr/bin/env python3
"""Shared utilities for rendering ECharts-like options with Matplotlib."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any, Iterable, Sequence

from runtime_env import setup_runtime_env

RUNTIME_ENV = setup_runtime_env()

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib import colors as mcolors
from matplotlib import font_manager
from matplotlib.lines import Line2D
from matplotlib.patches import Wedge
from matplotlib.ticker import FuncFormatter


DEFAULT_COLORS = [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
]

PREFERRED_FONT_FAMILY = [
    "Noto Sans CJK SC",
    "Microsoft YaHei",
    "PingFang SC",
    "Arial Unicode MS",
    "DejaVu Sans",
]

INSTALLED_FONTS = {font.name for font in font_manager.fontManager.ttflist}
DEFAULT_FONT_FAMILY = [font for font in PREFERRED_FONT_FAMILY if font in INSTALLED_FONTS] or ["DejaVu Sans"]

LINE_STYLE_MAP = {
    None: "-",
    "": "-",
    "solid": "-",
    "dashed": "--",
    "dotted": ":",
    "dashdot": "-.",
    "-": "-",
    "--": "--",
    ":": ":",
    "-.": "-.",
}


def build_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--option", help="Path to an ECharts-compatible option JSON file.")
    parser.add_argument("--option-json", help="Inline ECharts-compatible option JSON string.")
    parser.add_argument(
        "--style-config",
        action="append",
        default=[],
        help="Path to a persistent ECharts-aligned style config JSON file. Repeat to layer multiple configs.",
    )
    parser.add_argument("--output", required=True, help="Output image path, for example chart.png.")
    parser.add_argument("--width", type=float, default=12.0, help="Figure width in inches.")
    parser.add_argument("--height", type=float, default=7.0, help="Figure height in inches.")
    parser.add_argument("--dpi", type=int, default=160, help="Output image DPI.")
    parser.add_argument("--transparent", action="store_true", help="Export with transparent background.")
    return parser


def load_option(args: argparse.Namespace) -> dict[str, Any]:
    option = None
    if args.option_json:
        option = json.loads(args.option_json)
    elif args.option:
        option = json.loads(Path(args.option).read_text(encoding="utf-8"))
    if option is None:
        raise ValueError("Either --option or --option-json is required.")

    resolved_option = option
    for style_config_path in args.style_config:
        style_config = json.loads(Path(style_config_path).read_text(encoding="utf-8"))
        resolved_option = apply_style_config(resolved_option, style_config, ())
    return resolved_option


def apply_style_config(option_value: Any, style_value: Any, path: tuple[str, ...]) -> Any:
    if style_value is None:
        return option_value
    if option_value is None:
        return style_value

    if isinstance(option_value, dict) and isinstance(style_value, dict):
        merged: dict[str, Any] = {}
        for key in option_value.keys() | style_value.keys():
            merged[key] = apply_style_config(option_value.get(key), style_value.get(key), path + (key,))
        return merged

    if isinstance(option_value, list) and isinstance(style_value, list):
        current_key = path[-1] if path else ""
        if current_key == "series":
            return apply_series_style(option_value, style_value, path)
        if all(isinstance(item, dict) for item in option_value + style_value):
            merged_items = []
            for index in range(max(len(option_value), len(style_value))):
                option_item = option_value[index] if index < len(option_value) else None
                style_item = style_value[index] if index < len(style_value) else None
                merged_items.append(apply_style_config(option_item, style_item, path + (str(index),)))
            return merged_items
        return style_value if style_value else option_value

    return style_value


def apply_series_style(option_series: list[Any], style_series: list[Any], path: tuple[str, ...]) -> list[Any]:
    if not style_series:
        return option_series
    if not option_series:
        return style_series

    if len(style_series) == 1 and isinstance(style_series[0], dict):
        style_template = style_series[0]
        merged = []
        for index, series in enumerate(option_series):
            if not isinstance(series, dict):
                merged.append(series)
                continue
            option_type = series.get("type")
            style_type = style_template.get("type")
            if option_type and style_type and option_type != style_type:
                merged.append(series)
                continue
            merged.append(apply_style_config(series, style_template, path + (str(index),)))
        return merged

    merged = []
    for index in range(max(len(option_series), len(style_series))):
        option_item = option_series[index] if index < len(option_series) else None
        style_item = style_series[index] if index < len(style_series) else None
        if isinstance(option_item, dict) and isinstance(style_item, dict):
            option_type = option_item.get("type")
            style_type = style_item.get("type")
            if option_type and style_type and option_type != style_type:
                merged.append(option_item)
            else:
                merged.append(apply_style_config(option_item, style_item, path + (str(index),)))
        else:
            merged.append(style_item if style_item is not None else option_item)
    return merged


def ensure_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def first_item(value: Any, default: Any = None) -> Any:
    items = ensure_list(value)
    return items[0] if items else default


def palette(option: dict[str, Any]) -> list[str]:
    return option.get("color") or DEFAULT_COLORS


def series_color(option: dict[str, Any], series: dict[str, Any], index: int) -> str:
    item_style = series.get("itemStyle", {})
    line_style = series.get("lineStyle", {})
    area_style = series.get("areaStyle", {})
    return (
        item_style.get("color")
        or line_style.get("color")
        or area_style.get("color")
        or palette(option)[index % len(palette(option))]
    )


def resolve_line_style(value: Any, default: str = "-") -> str:
    if value in LINE_STYLE_MAP:
        return LINE_STYLE_MAP[value]
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in LINE_STYLE_MAP:
            return LINE_STYLE_MAP[normalized]
    return default


def to_rgba(color: Any, alpha: float | None = None, default: str = "#5470c6") -> tuple[float, float, float, float]:
    if color in (None, "", "transparent"):
        color = default
    rgba = mcolors.to_rgba(color)
    if alpha is None:
        return rgba
    return (rgba[0], rgba[1], rgba[2], alpha)


def parse_percent(value: Any, total: float, default: float) -> float:
    if value is None:
        return default
    if isinstance(value, str) and value.endswith("%"):
        return float(value[:-1]) / 100.0 * total
    return float(value)


def normalize_font(style: dict[str, Any] | None) -> dict[str, Any]:
    style = style or {}
    font = {"fontfamily": DEFAULT_FONT_FAMILY}
    if "fontSize" in style:
        font["fontsize"] = style["fontSize"]
    if "fontWeight" in style:
        font["fontweight"] = style["fontWeight"]
    if "fontStyle" in style:
        font["fontstyle"] = style["fontStyle"]
    if "color" in style:
        font["color"] = style["color"]
    return font


def normalize_margin(value: Any, total_px: float, fallback: float) -> float:
    if value is None:
        return fallback
    if isinstance(value, str) and value.endswith("%"):
        return float(value[:-1]) / 100.0
    try:
        return float(value) / total_px
    except (TypeError, ValueError):
        return fallback


def create_figure(option: dict[str, Any], args: argparse.Namespace, polar: bool = False) -> tuple[Any, Any]:
    plt.rcParams["font.family"] = "sans-serif"
    plt.rcParams["font.sans-serif"] = DEFAULT_FONT_FAMILY
    plt.rcParams["axes.unicode_minus"] = False

    facecolor = option.get("backgroundColor") or ("none" if args.transparent else "white")
    subplot_kw = {"projection": "polar"} if polar else None
    fig, ax = plt.subplots(
        figsize=(args.width, args.height),
        dpi=args.dpi,
        facecolor=facecolor,
        subplot_kw=subplot_kw,
    )
    if not polar:
        fig.patch.set_facecolor(facecolor)
        apply_grid_layout(fig, option, args)
    return fig, ax


def apply_grid_layout(fig: Any, option: dict[str, Any], args: argparse.Namespace) -> None:
    grid = first_item(option.get("grid"), {})
    width_px = args.width * args.dpi
    height_px = args.height * args.dpi
    fig.subplots_adjust(
        left=normalize_margin(grid.get("left"), width_px, 0.10),
        right=1.0 - normalize_margin(grid.get("right"), width_px, 0.08),
        top=1.0 - normalize_margin(grid.get("top"), height_px, 0.12),
        bottom=normalize_margin(grid.get("bottom"), height_px, 0.12),
    )


def apply_title(fig: Any, ax: Any, option: dict[str, Any]) -> None:
    title = first_item(option.get("title"), {})
    if not title:
        return
    title_style = normalize_font(title.get("textStyle"))
    sub_style = normalize_font(title.get("subtextStyle"))
    loc = alignment_to_loc(title.get("left"))
    ax.set_title(
        title.get("text", ""),
        loc=loc,
        pad=16,
        **title_style,
    )
    if title.get("subtext"):
        x = {"left": 0.0, "center": 0.5, "right": 1.0}.get(loc, 0.0)
        y = 0.96 if title.get("text") else 0.98
        fig.text(x, y, title["subtext"], ha=loc, va="top", **sub_style)


def alignment_to_loc(value: Any) -> str:
    if value in ("center", "middle"):
        return "center"
    if value == "right":
        return "right"
    return "left"


def apply_axis_style(ax: Any, x_axis: dict[str, Any], y_axis: dict[str, Any]) -> None:
    for axis_name, axis_conf in (("x", x_axis or {}), ("y", y_axis or {})):
        label_conf = axis_conf.get("axisLabel", {})
        tick_conf = axis_conf.get("axisTick", {})
        line_conf = axis_conf.get("axisLine", {})
        split_conf = axis_conf.get("splitLine", {})
        name = axis_conf.get("name")
        if axis_name == "x":
            if name:
                ax.set_xlabel(name, **normalize_font(axis_conf.get("nameTextStyle")))
            tick_params = {"axis": "x", "bottom": tick_conf.get("show", True)}
            if label_conf.get("color") is not None:
                tick_params["colors"] = label_conf.get("color")
            if label_conf.get("fontSize") is not None:
                tick_params["labelsize"] = label_conf.get("fontSize")
            ax.tick_params(**tick_params)
            if line_conf.get("show", True):
                ax.spines["bottom"].set_color(line_conf.get("lineStyle", {}).get("color", "#6e7079"))
            else:
                ax.spines["bottom"].set_visible(False)
            if split_conf.get("show"):
                ax.grid(
                    axis="x",
                    linestyle=resolve_line_style(split_conf.get("lineStyle", {}).get("type"), "--"),
                    linewidth=split_conf.get("lineStyle", {}).get("width", 0.8),
                    color=split_conf.get("lineStyle", {}).get("color", "#e0e6f1"),
                )
            if axis_conf.get("type") == "value":
                if axis_conf.get("min") is not None:
                    ax.set_xlim(left=axis_conf["min"])
                if axis_conf.get("max") is not None:
                    ax.set_xlim(right=axis_conf["max"])
        else:
            if name:
                ax.set_ylabel(name, **normalize_font(axis_conf.get("nameTextStyle")))
            tick_params = {"axis": "y", "left": tick_conf.get("show", True)}
            if label_conf.get("color") is not None:
                tick_params["colors"] = label_conf.get("color")
            if label_conf.get("fontSize") is not None:
                tick_params["labelsize"] = label_conf.get("fontSize")
            ax.tick_params(**tick_params)
            if line_conf.get("show", True):
                ax.spines["left"].set_color(line_conf.get("lineStyle", {}).get("color", "#6e7079"))
            else:
                ax.spines["left"].set_visible(False)
            if split_conf.get("show", True):
                ax.grid(
                    axis="y",
                    linestyle=resolve_line_style(split_conf.get("lineStyle", {}).get("type"), "--"),
                    linewidth=split_conf.get("lineStyle", {}).get("width", 0.8),
                    color=split_conf.get("lineStyle", {}).get("color", "#e0e6f1"),
                    alpha=split_conf.get("lineStyle", {}).get("opacity", 1.0),
                )
            if axis_conf.get("type") != "category":
                if axis_conf.get("min") is not None:
                    ax.set_ylim(bottom=axis_conf["min"])
                if axis_conf.get("max") is not None:
                    ax.set_ylim(top=axis_conf["max"])
    axis_label = (x_axis or {}).get("axisLabel", {})
    formatter = axis_label.get("formatter")
    if isinstance(formatter, str) and "{value}" in formatter:
        ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _: formatter.replace("{value}", str(value))))
    y_label = (y_axis or {}).get("axisLabel", {})
    y_formatter = y_label.get("formatter")
    if isinstance(y_formatter, str) and "{value}" in y_formatter:
        ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: y_formatter.replace("{value}", str(value))))


def resolve_dataset_series(option: dict[str, Any], series: dict[str, Any]) -> tuple[list[Any], list[Any]]:
    if series.get("data") is not None:
        data = series.get("data", [])
        if data and isinstance(data[0], dict):
            return [item.get("name") for item in data], [item.get("value") for item in data]
        return list(range(len(data))), data

    dataset = option.get("dataset", {})
    source = dataset.get("source")
    if not source:
        return [], []

    encode = series.get("encode", {})
    if isinstance(source, list) and source and isinstance(source[0], dict):
        x_field = first_scalar(encode.get("x")) or first_scalar(dataset.get("dimensions")) or first_scalar(list(source[0].keys()))
        y_field = first_scalar(encode.get("y"))
        if y_field is None:
            remaining = [key for key in source[0].keys() if key != x_field]
            y_field = remaining[0] if remaining else x_field
        return [row.get(x_field) for row in source], [row.get(y_field) for row in source]

    if isinstance(source, list) and source and isinstance(source[0], list):
        header_row = source[0]
        has_header_row = all(isinstance(item, str) for item in header_row)
        data_rows = source[1:] if has_header_row else source
        dimensions = header_row if has_header_row else dataset.get("dimensions") or [str(index) for index in range(len(data_rows[0]))]
        x_field = first_scalar(encode.get("x")) or dimensions[0]
        y_field = first_scalar(encode.get("y")) or dimensions[1]
        x_index = dimensions.index(x_field)
        y_index = dimensions.index(y_field)
        return [row[x_index] for row in data_rows], [row[y_index] for row in data_rows]

    return [], []


def resolve_xy(option: dict[str, Any], series: dict[str, Any], x_axis: dict[str, Any]) -> tuple[list[Any], list[Any]]:
    if series.get("data") is None:
        x_values, y_values = resolve_dataset_series(option, series)
        if x_values or y_values:
            return x_values, y_values

    data = series.get("data", [])
    if data and isinstance(data[0], (list, tuple)) and len(data[0]) >= 2:
        return [item[0] for item in data], [item[1] for item in data]
    if data and isinstance(data[0], dict):
        return [item.get("name") for item in data], [item.get("value") for item in data]
    categories = x_axis.get("data") or list(range(len(data)))
    return categories, data


def prepare_x_axis(ax: Any, x_values: Sequence[Any], x_axis: dict[str, Any]) -> list[float] | list[Any]:
    if x_axis.get("type") == "value" and all(is_number(value) for value in x_values):
        return [float(value) for value in x_values]
    if x_values and all(is_number(value) for value in x_values):
        return [float(value) for value in x_values]
    labels = [str(item) for item in x_values]
    positions = list(range(len(labels)))
    ax.set_xticks(positions)
    ax.set_xticklabels(labels, rotation=x_axis.get("axisLabel", {}).get("rotate", 0))
    return positions


def is_number(value: Any) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def first_scalar(value: Any) -> Any:
    if isinstance(value, list):
        return value[0] if value else None
    return value


def resolve_marker(symbol: Any) -> str | None:
    mapping = {
        "circle": "o",
        "rect": "s",
        "roundRect": "s",
        "triangle": "^",
        "diamond": "D",
        "pin": "v",
        "arrow": ">",
        "none": None,
    }
    return mapping.get(symbol, "o")


def resolve_series_marker(series: dict[str, Any]) -> str | None:
    if series.get("showSymbol") is False:
        return None
    return resolve_marker(series.get("symbol"))


def apply_legend(ax: Any, option: dict[str, Any], handles: Sequence[Any] | None = None, labels: Sequence[str] | None = None) -> None:
    legend = first_item(option.get("legend"), {})
    if legend.get("show", True) is False:
        return
    legend_labels = labels
    legend_handles = handles
    if legend_labels is None or legend_handles is None:
        legend_handles, legend_labels = ax.get_legend_handles_labels()
    if not legend_labels:
        return
    loc, bbox = legend_loc(legend)
    ax.legend(
        legend_handles,
        legend_labels,
        loc=loc,
        bbox_to_anchor=bbox,
        ncol=len(legend_labels) if legend.get("orient") == "horizontal" else 1,
        frameon=False,
        fontsize=legend.get("textStyle", {}).get("fontSize"),
        labelcolor=legend.get("textStyle", {}).get("color"),
    )


def legend_loc(legend: dict[str, Any]) -> tuple[str, tuple[float, float]]:
    top = legend.get("top")
    left = legend.get("left")
    vertical_map = {
        "top": ("upper", 1.0),
        "middle": ("center", 0.5),
        "center": ("center", 0.5),
        "bottom": ("lower", 0.0),
    }
    horizontal_map = {
        "left": ("left", 0.0),
        "center": ("center", 0.5),
        "right": ("right", 1.0),
    }
    vertical_word, y = vertical_map.get(top, ("upper", 1.0))
    horizontal_word, x = horizontal_map.get(left, ("left", 0.0))
    return f"{vertical_word} {horizontal_word}", (x, y)


def save_figure(fig: Any, output: str, transparent: bool = False) -> None:
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, bbox_inches="tight", transparent=transparent)
    plt.close(fig)


def format_label(
    formatter: Any,
    name: Any,
    value: Any,
    percent: float | None = None,
    series_name: Any = None,
) -> str:
    if not formatter:
        return f"{name}: {value}" if name not in (None, "") else str(value)
    if isinstance(formatter, str):
        text = formatter.replace("{a}", "" if series_name is None else str(series_name))
        text = text.replace("{b}", "" if name is None else str(name))
        text = text.replace("{c}", "" if value is None else str(value))
        if percent is not None:
            text = text.replace("{d}", f"{percent:.0f}")
        return text
    return f"{name}: {value}" if name not in (None, "") else str(value)


def pie_radius(radius: Any) -> tuple[float, float]:
    if radius is None:
        return 0.0, 1.0
    if isinstance(radius, list) and len(radius) == 2:
        inner = parse_percent(radius[0], 1.0, 0.0)
        outer = parse_percent(radius[1], 1.0, 1.0)
        return inner, outer
    return 0.0, parse_percent(radius, 1.0, 1.0)


def gauge_angles(series: dict[str, Any]) -> tuple[float, float]:
    start = float(series.get("startAngle", 225))
    end = float(series.get("endAngle", -45))
    return start, end


def gauge_sweep(start: float, end: float) -> float:
    sweep = end - start
    if sweep == 0:
        return -360.0
    if abs(sweep) > 360:
        normalized = abs(sweep) % 360
        sweep = math.copysign(normalized or 360.0, sweep)
    return sweep


def gauge_value_to_angle(value: float, min_value: float, max_value: float, start: float, end: float) -> float:
    sweep = gauge_sweep(start, end)
    ratio = 0.0 if max_value == min_value else (value - min_value) / (max_value - min_value)
    ratio = max(0.0, min(1.0, ratio))
    return start + sweep * ratio


def gauge_point(angle_deg: float, radius: float) -> tuple[float, float]:
    radians = math.radians(angle_deg)
    return radius * math.cos(radians), radius * math.sin(radians)


def gauge_formatter(formatter: Any, value: float) -> str:
    if not formatter:
        return str(round(value, 2))
    if isinstance(formatter, str):
        rounded = str(round(value, 2))
        return formatter.replace("{value}", rounded).replace("{c}", rounded)
    return str(round(value, 2))


def gauge_center(series: dict[str, Any]) -> tuple[float, float]:
    center = series.get("center", ["50%", "50%"])
    if not isinstance(center, list) or len(center) != 2:
        center = ["50%", "50%"]
    x = parse_percent(center[0], 2.0, 1.0) - 1.0
    y = 1.0 - parse_percent(center[1], 2.0, 1.0)
    return x, y


def gauge_radius(series: dict[str, Any]) -> float:
    return parse_percent(series.get("radius"), 1.0, 1.0)


def add_gauge_wedge(
    ax: Any,
    center_x: float,
    center_y: float,
    radius: float,
    start_angle: float,
    end_angle: float,
    width: float,
    color: Any,
) -> None:
    sweep = end_angle - start_angle
    if sweep >= 0:
        theta1 = start_angle
        theta2 = start_angle + sweep
    else:
        theta1 = start_angle + sweep
        theta2 = start_angle
    patch = Wedge(
        (center_x, center_y),
        radius,
        theta1=theta1,
        theta2=theta2,
        width=width / 100.0,
        facecolor=color,
        edgecolor="none",
    )
    ax.add_patch(patch)


def render_gauge_axis(ax: Any, series: dict[str, Any], value: float, min_value: float, max_value: float) -> None:
    start, end = gauge_angles(series)
    sweep = gauge_sweep(start, end)
    line_style = series.get("axisLine", {}).get("lineStyle", {})
    width = line_style.get("width", 18)
    segments = line_style.get("color") or [[1, "#5470c6"]]
    center_x, center_y = gauge_center(series)
    radius = gauge_radius(series)

    current = start
    for threshold, color in segments:
        segment_end = start + sweep * float(threshold)
        add_gauge_wedge(ax, center_x, center_y, radius, current, segment_end, width, color)
        current = segment_end

    angle = gauge_value_to_angle(value, min_value, max_value, start, end)
    progress_conf = series.get("progress", {})
    if progress_conf.get("show"):
        progress_width = progress_conf.get("width", width)
        progress_color = progress_conf.get("itemStyle", {}).get("color", series.get("pointer", {}).get("itemStyle", {}).get("color", "#5470c6"))
        add_gauge_wedge(ax, center_x, center_y, radius, start, angle, progress_width, progress_color)

    split_number = int(series.get("splitNumber", 10) or 10)
    split_line = series.get("splitLine", {})
    split_line_style = split_line.get("lineStyle", {})
    if split_line.get("show"):
        split_length = float(split_line.get("length", 12))
        split_distance = float(split_line.get("distance", 0))
        split_outer = radius + split_distance / 100.0
        split_inner = split_outer - split_length / 100.0
        for index in range(split_number + 1):
            tick_angle = start + sweep * index / split_number
            x1, y1 = gauge_point(tick_angle, split_outer)
            x2, y2 = gauge_point(tick_angle, split_inner)
            ax.plot(
                [center_x + x1, center_x + x2],
                [center_y + y1, center_y + y2],
                color=split_line_style.get("color", "#6e7079"),
                linewidth=split_line_style.get("width", 2),
            )

    axis_tick = series.get("axisTick", {})
    axis_tick_style = axis_tick.get("lineStyle", {})
    if axis_tick.get("show"):
        tick_length = float(axis_tick.get("length", 6))
        tick_distance = float(axis_tick.get("distance", 0))
        tick_outer = radius + tick_distance / 100.0
        tick_inner = tick_outer - tick_length / 100.0
        subdivisions = int(axis_tick.get("splitNumber", 5) or 5)
        total_ticks = split_number * subdivisions
        for index in range(total_ticks + 1):
            tick_angle = start + sweep * index / total_ticks
            x1, y1 = gauge_point(tick_angle, tick_outer)
            x2, y2 = gauge_point(tick_angle, tick_inner)
            ax.plot(
                [center_x + x1, center_x + x2],
                [center_y + y1, center_y + y2],
                color=axis_tick_style.get("color", "#999999"),
                linewidth=axis_tick_style.get("width", 1),
            )

    axis_label = series.get("axisLabel", {})
    if axis_label.get("show"):
        label_distance = float(axis_label.get("distance", 12))
        label_radius = radius + label_distance / 100.0
        formatter = axis_label.get("formatter")
        for index in range(split_number + 1):
            tick_angle = start + sweep * index / split_number
            axis_value = min_value + (max_value - min_value) * index / split_number
            x, y = gauge_point(tick_angle, label_radius)
            ax.text(
                center_x + x,
                center_y + y,
                gauge_formatter(formatter, axis_value),
                ha="center",
                va="center",
                fontsize=axis_label.get("fontSize", 10),
                color=axis_label.get("color", "#6e7079"),
            )

    pointer = series.get("pointer", {})
    if pointer.get("show", True):
        pointer_length = parse_percent(pointer.get("length"), radius, 0.82 * radius)
        radians = math.radians(angle)
        ax.plot(
            [center_x, center_x + pointer_length * math.cos(radians)],
            [center_y, center_y + pointer_length * math.sin(radians)],
            color=pointer.get("itemStyle", {}).get("color", "#2f4554"),
            linewidth=pointer.get("width", 3),
            solid_capstyle="round",
        )
    if series.get("anchor", {}).get("show", True):
        ax.scatter(
            [center_x],
            [center_y],
            s=series.get("anchor", {}).get("size", 60),
            color=series.get("anchor", {}).get("itemStyle", {}).get("color", "#2f4554"),
        )


def build_legend_proxy(color: str, linestyle: str = "-", marker: str | None = None, is_bar: bool = False) -> Any:
    if is_bar:
        return plt.Rectangle((0, 0), 1, 1, color=color)
    return Line2D([0], [0], color=color, linestyle=resolve_line_style(linestyle), marker=marker)


def flatten(values: Iterable[Iterable[Any]]) -> list[Any]:
    return [item for group in values for item in group]
