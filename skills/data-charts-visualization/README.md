# Data Charts Visualization

Turn ECharts-style options into polished static chart images with Python and Matplotlib.

[中文说明](./README.zh.md)

This skill is built for agent workflows that need charts fast, with predictable output and production-friendly configuration. It covers mainstream business visualization needs, keeps the option model close to ECharts, and supports reusable style presets for consistent chart branding.

## Why This Skill

- Rich chart coverage: line, bar, pie, gauge, area, dual-axis, scatter, radar, and funnel.
- ECharts-aligned option model: low learning cost if your data or prompts already target ECharts.
- Strong configuration layering: data in `option`, persistent style in `config/*.json`, runtime overrides with `--style-config`.
- Dataset support: plain arrays, object arrays, `dataset.source`, and `series.encode`.
- Stable rendering workflow: every chart type is covered by golden-image test cases.

## Supported Charts

<table>
  <tr>
    <td align="center" width="33%">
      <strong>Line</strong><br/>
      <img src="./static/line.png" alt="Line chart" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>Bar</strong><br/>
      <img src="./static/bar.png" alt="Bar chart" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>Pie / Donut / Rose</strong><br/>
      <img src="./static/pie.png" alt="Pie chart" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Gauge</strong><br/>
      <img src="./static/gauge.png" alt="Gauge chart" width="260"/>
    </td>
    <td align="center">
      <strong>Area</strong><br/>
      <img src="./static/area.png" alt="Area chart" width="260"/>
    </td>
    <td align="center">
      <strong>Dual-Axis</strong><br/>
      <img src="./static/dual-axis.png" alt="Dual-axis chart" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Scatter / Bubble</strong><br/>
      <img src="./static/scatter.png" alt="Scatter chart" width="260"/>
    </td>
    <td align="center">
      <strong>Radar</strong><br/>
      <img src="./static/radar.png" alt="Radar chart" width="260"/>
    </td>
    <td align="center">
      <strong>Funnel</strong><br/>
      <img src="./static/funnel.png" alt="Funnel chart" width="260"/>
    </td>
  </tr>
</table>

## Core Capabilities

This skill is not just a thin chart wrapper. It already covers the chart behaviors that show up most often in ECharts usage:

- Multi-series charts, mixed chart compositions, grouped bars, stacked bars, and stacked areas.
- Dataset-driven charts with `dataset.source` and `series.encode`, including table-header style 2D arrays.
- Common interaction-independent styling such as legend placement, palette control, labels, axis formatting, grid layout, and background color.
- Line and area behaviors such as `smooth`, `step`, `showSymbol`, `null` gaps, and `connectNulls`.
- Pie variants such as donut, rose charts, label positions, selected offsets, start angles, and palette overrides.
- Gauge capabilities such as segmented axis lines, progress arcs, custom angles, custom ranges, pointer styles, and detail formatting.
- Dual-axis combinations with independent axis mapping, mixed bar/line rendering, horizontal layout, negative values, and area-on-secondary-axis support.
- Scatter, radar, and funnel support for their common business-reporting scenarios, including bubble sizes, split areas, item styling, sorting, and size/gap control.

## Configuration Model

The configuration path is intentionally simple:

1. Put chart data and structure in `option`.
2. Keep reusable visual rules in `config/base_style.json` and chart-specific presets.
3. Pass one or more `--style-config` files at render time.

Priority is:

1. input `option`
2. `config/base_style.json`
3. chart-specific style config

If the same field exists in multiple layers, the higher-priority config wins.

Available presets:

- `config/base_style.json`
- `config/line_style.json`
- `config/bar_style.json`
- `config/pie_style.json`
- `config/gauge_style.json`
- `config/area_style.json`
- `config/dual_axis_style.json`
- `config/scatter_style.json`
- `config/radar_style.json`
- `config/funnel_style.json`

This makes it practical to keep a stable visual language across reports while still letting each render request supply its own data.

## Quick Start

Check or install Python dependencies:

```bash
python3 skills/data-charts-visualization/scripts/ensure_deps.py
python3 skills/data-charts-visualization/scripts/ensure_deps.py --install
```

Render a chart from an option file:

```bash
python3 skills/data-charts-visualization/scripts/line_chart.py \
  --option skills/data-charts-visualization/test/data/line/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/out/manual_line_chart.png
```

Render the same chart with reusable style presets:

```bash
python3 skills/data-charts-visualization/scripts/line_chart.py \
  --style-config skills/data-charts-visualization/config/base_style.json \
  --style-config skills/data-charts-visualization/config/line_style.json \
  --option skills/data-charts-visualization/test/data/line/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/out/manual_line_chart_styled.png
```

Update persistent style configs from natural language:

```bash
python3 skills/data-charts-visualization/scripts/update_style_config.py \
  --chart-type line \
  --instruction "increase line width to 3, show labels, and move legend to bottom"
```

## Reliability

Every supported chart type has focused test data, text case descriptions, golden images, and a dedicated runner under `test/scripts/`. The current workflow is built to validate visual output, not just parse input JSON.

Typical coverage includes:

- basic rendering
- dataset + encode
- style config overrides
- legend and palette variations
- axis and label formatting
- null handling and line continuity where applicable
- chart-specific advanced behaviors such as rose pie, segmented gauge, horizontal dual-axis, radar split area, and funnel ordering

## Best Fit

Use this skill when you need one of these outcomes:

- render a chart directly from structured option JSON
- keep chart syntax close to ECharts while producing static images locally
- maintain consistent report styling across many chart renders
- validate chart output through golden-image regression tests
