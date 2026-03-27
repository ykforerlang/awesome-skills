#!/usr/bin/env python3
"""Update chart style config files from natural-language instructions or explicit key/value overrides."""

from __future__ import annotations

import argparse
import json
import re
from copy import deepcopy
from pathlib import Path
from typing import Any

CHART_TYPE_TO_CONFIG = {
    "base": "base_style.json",
    "line": "line_style.json",
    "bar": "bar_style.json",
    "pie": "pie_style.json",
    "donut": "pie_style.json",
    "gauge": "gauge_style.json",
    "area": "area_style.json",
    "dual-axis": "dual_axis_style.json",
    "dual_axis": "dual_axis_style.json",
    "combo": "dual_axis_style.json",
    "scatter": "scatter_style.json",
    "radar": "radar_style.json",
    "funnel": "funnel_style.json",
}


PALETTES = {
    "echarts": ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"],
    "warm": ["#d94841", "#f28c28", "#f6c85f", "#d96c75", "#b85c38", "#ffb703"],
    "cool": ["#3a86ff", "#00b4d8", "#4cc9f0", "#2a9d8f", "#4361ee", "#4895ef"],
    "pastel": ["#a8dadc", "#f4a261", "#e9c46a", "#cdb4db", "#bde0fe", "#ffafcc"],
}

NAMED_COLORS = {
    "white": "#ffffff",
    "black": "#111827",
    "gray": "#6b7280",
    "grey": "#6b7280",
    "red": "#dc2626",
    "orange": "#ea580c",
    "yellow": "#ca8a04",
    "green": "#16a34a",
    "blue": "#2563eb",
    "purple": "#7c3aed",
    "pink": "#db2777",
    "暖色": "warm",
    "冷色": "cool",
    "柔和": "pastel",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Update an ECharts-aligned style config file.")
    parser.add_argument("--config", help="Target style config JSON file. Overrides --chart-type when both are provided.")
    parser.add_argument(
        "--chart-type",
        choices=sorted(CHART_TYPE_TO_CONFIG.keys()),
        help="Chart type shortcut that maps to the corresponding config file under config/.",
    )
    parser.add_argument(
        "--instruction",
        action="append",
        default=[],
        help="Natural-language style instruction. Repeat for multiple instructions.",
    )
    parser.add_argument(
        "--set",
        action="append",
        default=[],
        help="Explicit override in dotted.path=value form. Repeat for multiple overrides.",
    )
    parser.add_argument("--stdin", action="store_true", help="Read one extra natural-language instruction block from stdin.")
    parser.add_argument("--dry-run", action="store_true", help="Print the updated config without writing it.")
    args = parser.parse_args()
    if not args.config and not args.chart_type:
        parser.error("one of --config or --chart-type is required")
    return args


def resolve_config_path(config: str | None, chart_type: str | None) -> Path:
    if config:
        return Path(config).resolve()
    script_dir = Path(__file__).resolve().parent
    config_dir = script_dir.parent / "config"
    return (config_dir / CHART_TYPE_TO_CONFIG[chart_type]).resolve()


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    content = path.read_text(encoding="utf-8").strip()
    return json.loads(content) if content else {}


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ensure_path(obj: dict[str, Any], path: list[str], leaf_default: Any = None) -> Any:
    current = obj
    for key in path[:-1]:
        current = current.setdefault(key, {})
    if path[-1] not in current and leaf_default is not None:
        current[path[-1]] = deepcopy(leaf_default)
    return current


def set_nested(obj: dict[str, Any], path: list[str], value: Any) -> None:
    parent = ensure_path(obj, path)
    parent[path[-1]] = value


def set_series_template_field(obj: dict[str, Any], chart_type: str, field_path: list[str], value: Any) -> None:
    series = obj.setdefault("series", [])
    target = None
    for item in series:
        if isinstance(item, dict) and item.get("type") == chart_type:
            target = item
            break
    if target is None:
        target = {"type": chart_type}
        series.append(target)
    set_nested(target, field_path, value)


def parse_scalar(raw: str) -> Any:
    raw = raw.strip()
    if raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    if raw.lower() == "null":
        return None
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    if re.fullmatch(r"-?\d+\.\d+", raw):
        return float(raw)
    if (raw.startswith("[") and raw.endswith("]")) or (raw.startswith("{") and raw.endswith("}")):
        return json.loads(raw)
    return raw


def apply_explicit_override(obj: dict[str, Any], override: str, changes: list[str]) -> None:
    if "=" not in override:
        raise ValueError(f"Invalid --set value: {override}")
    path, raw_value = override.split("=", 1)
    value = parse_scalar(raw_value)
    set_nested(obj, path.split("."), value)
    changes.append(f"set {path} = {value!r}")


def extract_size(text: str, patterns: list[str]) -> int | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def extract_float(text: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return float(match.group(1))
    return None


def extract_color(text: str) -> str | None:
    hex_match = re.search(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})", text)
    if hex_match:
        return hex_match.group(0)
    lowered = text.lower()
    for name, value in NAMED_COLORS.items():
        if name in text or name in lowered:
            if value in PALETTES:
                continue
            return value
    return None


def detect_palette(text: str) -> list[str] | None:
    lowered = text.lower()
    if "echarts" in lowered or "默认配色" in text:
        return PALETTES["echarts"]
    if "warm" in lowered or "暖色" in text:
        return PALETTES["warm"]
    if "cool" in lowered or "冷色" in text:
        return PALETTES["cool"]
    if "pastel" in lowered or "柔和" in text or "马卡龙" in text:
        return PALETTES["pastel"]
    return None


def apply_natural_language_instruction(obj: dict[str, Any], instruction: str, changes: list[str]) -> None:
    text = instruction.strip()
    lowered = text.lower()

    palette = detect_palette(text)
    if palette:
        obj["color"] = palette
        changes.append("updated color palette")

    if "background" in lowered or "背景" in text:
        color = extract_color(text)
        if color:
            obj["backgroundColor"] = color
            changes.append(f"set backgroundColor to {color}")

    if "标题" in text or "title" in lowered:
        title_size = extract_size(
            text,
            [
                r"标题(?:字号|大小)?\s*(\d+)",
                r"title(?: size| fontsize| font size)?\s*(\d+)",
            ],
        )
        if title_size is not None:
            set_nested(obj, ["title", "textStyle", "fontSize"], title_size)
            changes.append(f"set title.textStyle.fontSize to {title_size}")
        color = extract_color(text)
        if color:
            set_nested(obj, ["title", "textStyle", "color"], color)
            changes.append(f"set title.textStyle.color to {color}")

    if "legend" in lowered or "图例" in text:
        if any(word in lowered or word in text for word in ["bottom", "底部", "下方"]):
            set_nested(obj, ["legend", "top"], "bottom")
            changes.append("set legend.top to bottom")
        elif any(word in lowered or word in text for word in ["top", "顶部", "上方"]):
            set_nested(obj, ["legend", "top"], "top")
            changes.append("set legend.top to top")
        if any(word in lowered or word in text for word in ["right", "右侧"]):
            set_nested(obj, ["legend", "left"], "right")
            changes.append("set legend.left to right")
        elif any(word in lowered or word in text for word in ["left", "左侧"]):
            set_nested(obj, ["legend", "left"], "left")
            changes.append("set legend.left to left")
        elif "居中" in text or "center" in lowered:
            set_nested(obj, ["legend", "left"], "center")
            changes.append("set legend.left to center")
        if any(word in lowered or word in text for word in ["vertical", "竖", "纵向"]):
            set_nested(obj, ["legend", "orient"], "vertical")
            changes.append("set legend.orient to vertical")
        elif any(word in lowered or word in text for word in ["horizontal", "横", "横向"]):
            set_nested(obj, ["legend", "orient"], "horizontal")
            changes.append("set legend.orient to horizontal")

    if "grid" in lowered or "边距" in text or "留白" in text:
        if any(word in lowered or word in text for word in ["紧凑", "更紧", "smaller", "tighter", "compact"]):
            obj["grid"] = {"left": 56, "right": 40, "top": 72, "bottom": 52}
            changes.append("set compact grid spacing")
        elif any(word in lowered or word in text for word in ["宽松", "更大", "looser", "spacious"]):
            obj["grid"] = {"left": 96, "right": 72, "top": 104, "bottom": 84}
            changes.append("set spacious grid spacing")

    if "x轴" in text or "x axis" in lowered or "x-axis" in lowered:
        rotate = extract_size(text, [r"x(?:[- ]axis)?(?: label)?(?: rotate)?\s*(\d+)", r"x轴.*?(\d+)\s*度", r"旋转\s*(\d+)\s*度"])
        if rotate is not None:
            set_nested(obj, ["xAxis", "axisLabel", "rotate"], rotate)
            changes.append(f"set xAxis.axisLabel.rotate to {rotate}")

    if "y轴" in text or "y axis" in lowered or "y-axis" in lowered:
        color = extract_color(text)
        if color:
            set_nested(obj, ["yAxis", "axisLabel", "color"], color)
            changes.append(f"set yAxis.axisLabel.color to {color}")

    if any(word in lowered or word in text for word in ["line", "折线", "线条"]):
        width = extract_float(
            text,
            [
                r"line(?: width)?\s*(\d+(?:\.\d+)?)",
                r"(?:线宽|线条宽度|折线宽度|折线图线宽)\s*(\d+(?:\.\d+)?)",
            ],
        )
        if width is not None:
            set_series_template_field(obj, "line", ["lineStyle", "width"], width)
            changes.append(f"set line series lineStyle.width to {width}")

    if any(word in lowered or word in text for word in ["bar", "柱状", "柱子"]):
        opacity = extract_float(text, [r"bar opacity\s*(0(?:\.\d+)?|1(?:\.0+)?)", r"(?:柱状图透明度|柱子透明度)\s*(0(?:\.\d+)?|1(?:\.0+)?)"])
        if opacity is not None:
            set_series_template_field(obj, "bar", ["itemStyle", "opacity"], opacity)
            changes.append(f"set bar series itemStyle.opacity to {opacity}")

    if any(word in lowered or word in text for word in ["area", "面积"]):
        opacity = extract_float(text, [r"area opacity\s*(0(?:\.\d+)?|1(?:\.0+)?)", r"(?:面积图透明度|面积透明度)\s*(0(?:\.\d+)?|1(?:\.0+)?)"])
        if opacity is not None:
            set_series_template_field(obj, "line", ["areaStyle", "opacity"], opacity)
            changes.append(f"set areaStyle.opacity to {opacity}")

    if any(word in lowered or word in text for word in ["pie", "donut", "饼图", "环形"]):
        match = re.search(r"(?:内径|inner radius)\s*(\d+)%", text, flags=re.IGNORECASE)
        if match:
            radius = ensure_pie_radius(obj)
            radius[0] = f"{match.group(1)}%"
            changes.append(f"set pie inner radius to {radius[0]}")
        match = re.search(r"(?:外径|outer radius|radius)\s*(\d+)%", text, flags=re.IGNORECASE)
        if match:
            radius = ensure_pie_radius(obj)
            radius[1] = f"{match.group(1)}%"
            changes.append(f"set pie outer radius to {radius[1]}")

    if any(word in lowered or word in text for word in ["gauge", "仪表盘"]):
        if "暖色" in text or "warm" in lowered:
            set_series_template_field(
                obj,
                "gauge",
                ["axisLine", "lineStyle", "color"],
                [[0.4, "#ee6666"], [0.75, "#fac858"], [1.0, "#f28c28"]],
            )
            changes.append("set gauge warm color bands")
        elif "冷色" in text or "cool" in lowered:
            set_series_template_field(
                obj,
                "gauge",
                ["axisLine", "lineStyle", "color"],
                [[0.4, "#4cc9f0"], [0.75, "#4895ef"], [1.0, "#4361ee"]],
            )
            changes.append("set gauge cool color bands")

    if any(word in lowered or word in text for word in ["label", "标签"]):
        if any(word in lowered or word in text for word in ["show", "显示"]):
            set_series_template_field(obj, "line", ["label", "show"], True)
            changes.append("set line label.show to true")
        elif any(word in lowered or word in text for word in ["hide", "隐藏"]):
            set_series_template_field(obj, "line", ["label", "show"], False)
            changes.append("set line label.show to false")


def ensure_pie_radius(obj: dict[str, Any]) -> list[Any]:
    series = obj.setdefault("series", [])
    target = None
    for item in series:
        if isinstance(item, dict) and item.get("type") == "pie":
            target = item
            break
    if target is None:
        target = {"type": "pie"}
        series.append(target)
    radius = target.setdefault("radius", ["42%", "70%"])
    if not isinstance(radius, list) or len(radius) != 2:
        radius = ["42%", "70%"]
        target["radius"] = radius
    return radius


def main() -> None:
    args = parse_args()
    config_path = resolve_config_path(args.config, args.chart_type)
    config = load_json(config_path)
    changes: list[str] = []

    instructions = list(args.instruction)
    if args.stdin:
        stdin_text = input().strip()
        if stdin_text:
            instructions.append(stdin_text)

    for override in args.set:
        apply_explicit_override(config, override, changes)
    for instruction in instructions:
        apply_natural_language_instruction(config, instruction, changes)

    if args.dry_run:
        print(json.dumps(config, ensure_ascii=False, indent=2))
    else:
        save_json(config_path, config)
        print(f"[OK] Updated style config: {config_path}")
    if changes:
        for item in changes:
            print(f"- {item}")
    else:
        print("- no recognized changes")


if __name__ == "__main__":
    main()
