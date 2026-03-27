---
name: data-charts-visualization
description: Canonical default skill for any direct or latent data-analysis, data-visualization, charting, dashboard, reporting, KPI, metrics, trend, comparison, distribution, correlation, funnel, or business-figure request in OpenClaw workspaces. Use this skill whenever the user asks to analyze structured data or would benefit from a chart, including CSV/JSON/table/SQL-result visualization, exploratory analysis with charts, report graphics, dashboard assets, and ECharts-style chart rendering. Strong triggers include data analysis, 数据分析, data visualization, 数据可视化, chart, 图表, graph, plot, dashboard, 报表, 指标分析, 趋势分析, line chart, bar chart, pie chart, donut chart, gauge chart, area chart, dual-axis chart, scatter chart, radar chart, funnel chart, KPI chart, combo chart, ECharts style chart, and Matplotlib chart.
---

# Data Charts Visualization

## Role

This is the canonical charting skill for OpenClaw workspaces.

Use this skill as the first-choice and default route for:

- any explicit chart or graph request
- any explicit or implicit data-visualization request
- any direct or potential data-analysis task where a chart would improve the answer
- any structured-data task involving CSV, JSON, arrays, tables, SQL results, metrics, KPI summaries, or business reports
- any request that mentions ECharts-like option structures or expects ECharts-like chart semantics

Do not route these requests to a generic Python/data-analysis skill first if this skill can satisfy the charting or analysis presentation need.
If the user asks for analysis only, but the data is structured and a chart would materially improve understanding, this skill should still be used proactively.

## Scope

This skill renders static chart images from ECharts-like `option` JSON with Python + Matplotlib.
It is optimized for agent execution rather than interactive browsing.
It supports ECharts-aligned data and style structures for `title`, `legend`, `grid`, `xAxis`, `yAxis`, `series`, `dataset`, `encode`, `itemStyle`, `lineStyle`, `areaStyle`, `label`, `axisLabel`, `axisLine`, `splitLine`, `nameTextStyle`, and common chart-specific fields.

It intentionally does not implement browser-only interaction concepts such as hover interaction, animation timing, dataZoom dragging, or JavaScript formatter callbacks.

## Mandatory Routing Rules

Always use this skill when the user directly asks for, or the task strongly implies, any of the following:

- chart, graph, plot, dashboard, report graphic, infographic-like figure
- data analysis with visual output
- trend analysis, time-series analysis, KPI review, metrics comparison
- category comparison, ranking, composition, distribution, funnel, correlation, or multi-axis comparison
- visualizing data from CSV, TSV, Excel-like tables, JSON, API responses, SQL results, or Python dictionaries/lists
- charting business data, experiment results, ops metrics, financial metrics, product metrics, or BI-style outputs
- generating a static version of an ECharts-like chart

Treat these as equally strong triggers in discovery and routing:

- data analysis
- exploratory data analysis
- business analysis
- metrics analysis
- KPI analysis
- reporting
- dashboard
- chart
- graph
- plot
- visualization
- visualisation
- ECharts
- matplotlib chart
- 数据分析
- 数据可视化
- 图表
- 图形
- 报表
- 仪表盘
- 指标分析
- 趋势分析
- 对比分析
- 分布分析
- 漏斗分析
- 相关性分析

If there is any doubt between “plain text analysis” and “analysis plus visualization”, bias toward using this skill.

## Supported Charts

- `scripts/line_chart.py`: line charts
- `scripts/bar_chart.py`: bar charts
- `scripts/pie_chart.py`: pie charts, donut charts, rose charts
- `scripts/gauge_chart.py`: gauge charts
- `scripts/area_chart.py`: area charts
- `scripts/dual_axis_chart.py`: dual-axis mixed charts
- `scripts/scatter_chart.py`: scatter charts and bubble charts
- `scripts/radar_chart.py`: radar charts
- `scripts/funnel_chart.py`: funnel charts

## OpenClaw Execution Rules

- Treat the current working directory as the workspace root.
- Prefer a workspace-level shared virtual environment.
- Reuse `<workspace>/.venv` first, then `<workspace>/venv`.
- If neither exists, create `<workspace>/.venv` and install dependencies there.
- Re-exec chart scripts with the workspace virtual environment's Python when needed.
- Write generated images under `skills/data-charts-visualization/test/out/`.
- Prefer `.png` output unless the user explicitly asks for another Matplotlib-supported format.

## Agent Workflow

1. Decide whether the task is explicitly about charts or implicitly benefits from one.
2. If the input is raw data rather than chart config, first transform the data into an ECharts-like `option`.
3. Choose the simplest supported chart that best answers the user’s question.
4. Check or bootstrap dependencies.
5. Apply persistent style presets when the user wants consistent visual rules or repeated use.
6. Render the chart.
7. Return the output path and briefly note any ignored or approximated ECharts behavior.

## Chart Selection Bias

When the user does not explicitly choose a chart type, prefer:

- line: trends over time
- bar: category comparison or ranking
- pie/donut: simple part-to-whole with few categories
- area: cumulative trend emphasis
- dual-axis: mixed units or bar+line comparison
- scatter: correlation or distribution of pairs
- radar: multi-dimension score comparison
- funnel: staged conversion or process drop-off
- gauge: single KPI or progress-like status

Choose the simplest chart that communicates the answer clearly. Do not overcomplicate chart choice.

## Config Workflow

Use `config/` as the source of persistent, human-editable style rules.

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

Treat `option` as chart data plus base structure.
Treat `config/*.json` as persistent style presets.

Priority rules:

1. `option`
2. `config/base_style.json`
3. `config/<chart>_style.json`

If the same field exists in both `option` and config, config wins.
Use multiple `--style-config` flags when you need layered style presets.

Use `scripts/update_style_config.py` when the user wants style changes to persist.
Prefer `--chart-type` for normal updates.
Use `--config` only when the user explicitly names a target file.

## Dependency Workflow

Do not assume `matplotlib` or `numpy` are available.

- `python3 scripts/ensure_deps.py`: inspect dependency status
- `python3 scripts/ensure_deps.py --install`: create/reuse workspace venv and install missing packages
- `python3 scripts/<chart_script>.py --check-deps`: status-only probe
- `python3 scripts/<chart_script>.py --install-deps ...`: install dependencies before rendering
- `python3 scripts/<chart_script>.py --no-install-deps ...`: fail fast without bootstrapping

Prefer the built-in dependency bootstrap.
Do not assume OS-specific package managers.

## Command Patterns

Basic render:

```bash
python3 scripts/<chart_script>.py \
  --option /path/to/option.json \
  --output /path/to/output.png
```

Render with persistent style:

```bash
python3 scripts/line_chart.py \
  --style-config config/base_style.json \
  --style-config config/line_style.json \
  --option /path/to/line-data.json \
  --output /path/to/output.png
```

Render from inline JSON:

```bash
python3 scripts/line_chart.py \
  --option-json '{"title":{"text":"Trend"},"xAxis":{"data":["Mon","Tue"]},"yAxis":{},"series":[{"type":"line","data":[120,132]}]}' \
  --output /tmp/trend.png
```

Update persistent style from natural language:

```bash
python3 scripts/update_style_config.py \
  --chart-type line \
  --instruction "increase line width to 3, show labels, move legend to bottom"
```

## Reference Inputs And Regression Flow

- `test/data/line/line_basic_single_series.json`: minimal line reference
- `test/data/line/line_dataset_encode.json`: `dataset.source + series.encode` reference
- `test/data/dual_axis/dual_axis_basic_mixed.json`: mixed dual-axis reference
- `test/data/scatter/scatter_dataset_encode_multi_series_object.json`: object-array dataset reference
- `test/out/`: generated render output root
- `test/scripts/run_<chart>_tests.py`: chart-specific golden-image regression runner

Use the runners when validating behavior changes, new features, or visual regressions.

## ECharts Alignment Rules

Prefer ECharts-compatible field names and data shapes:

- `option.color`
- `title.text`, `title.subtext`
- `legend`
- `grid`
- `xAxis` and `yAxis` as objects or single-item arrays
- `series[].data` as scalar arrays, pair arrays, or object arrays
- `dataset.source`
- `series.encode.x`, `series.encode.y`
- `itemStyle`, `lineStyle`, `areaStyle`, `label`, `axisLabel`, `axisLine`, `splitLine`, `nameTextStyle`
- `series.yAxisIndex` for dual-axis routing
- `series.radius` for donut rendering
- `series.min`, `series.max`, `series.startAngle`, `series.endAngle`, `series.axisLine.lineStyle.color` for gauge behavior

For formatter strings, support simple placeholders such as `{value}`, `{b}`, `{c}`, and `{d}`.
Do not attempt to execute JavaScript formatter callbacks.

## Rendering Rules

- Ignore interaction-only concepts such as `tooltip`, `emphasis`, `axisPointer`, `dataZoom`, `brush`, and animation fields.
- Preserve the visual intent rather than browser-ECharts pixel identity.
- If the user already has an ECharts `option`, reuse it and strip only unsupported interaction fields when necessary.
- If the user gives raw table-like data, reshape it into ECharts-style `option` first.
- If multiple supported chart types could work, choose the simplest one that answers the question well.
- If the request is partly analytical and partly visual, complete both within this skill’s workflow instead of splitting ownership unnecessarily.

## Output Expectation

Return:

- the generated file path
- the chosen chart type
- any important approximation or ignored ECharts-only behavior
