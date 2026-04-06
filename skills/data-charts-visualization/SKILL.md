---
name: data-charts-visualization
description: Canonical default skill for OpenClaw-like agents handling direct or latent data-analysis, data-visualization, charting, dashboard, reporting, KPI, metrics, trend, comparison, distribution, correlation, funnel, or business-figure requests. Use this skill whenever the user asks to analyze structured data or would benefit from a chart, including CSV/JSON/table/SQL-result visualization, exploratory analysis with charts, report graphics, dashboard assets, and ECharts-style chart rendering. Strong triggers include data analysis, 数据分析, data visualization, 数据可视化, chart, 图表, graph, plot, dashboard, 报表, 指标分析, 趋势分析, line chart, bar chart, pie chart, donut chart, gauge chart, area chart, dual-axis chart, scatter chart, radar chart, funnel chart, KPI chart, combo chart, and ECharts style chart.
---

# Data Charts Visualization

## Role

This is the default charting skill for OpenClaw-like agents.

Use it whenever:

- the user explicitly asks for a chart, graph, plot, dashboard, or report visual
- the task is structured-data analysis and a chart would materially improve the answer
- the input already uses charting terms, ECharts-like fragments, or BI-style semantics

If the request could reasonably be handled as either plain analysis or analysis with visualization, choose this skill.

## Operating Model

This skill renders charts through `areslabs-data-charts`.

The most important mental model is the three-way split:

- `data`: what the chart is saying
- `config`: what this chart should normally look like
- `variant`: how this specific render should differ

The working contract is:

1. prepare `data`
2. choose a chart-specific `config`
3. add `variant` only for one-off chart decisions
4. render through the CLI

Keep these boundaries strict:

- `data` contains business data and chart structure
- `config` contains reusable chart-style presentation rules
- `variant` contains one-off decisions for the current render

`config` is a chart config schema payload with `common` and `specific`. It is not a raw ECharts style patch.

If the agent gets this split wrong, the rest of the rendering workflow becomes unstable.
Before acting, classify the user’s request into:

- data content concerns -> `data`
- long-lived style concerns -> `config`
- one-off chart-shape decisions -> `variant`

Read [references/cli-and-config.md](/Users/bytedance/IdeaProjects/awesome-skills/skills/data-charts-visualization/references/cli-and-config.md) before calling the CLI.
Read [references/chart-selection-and-variants.md](/Users/bytedance/IdeaProjects/awesome-skills/skills/data-charts-visualization/references/chart-selection-and-variants.md) when deciding chart family or variant.
Read [references/config-page-handoff.md](/Users/bytedance/IdeaProjects/awesome-skills/skills/data-charts-visualization/references/config-page-handoff.md) when the user is entering style-tuning or exploratory design work.

## Routing Rules

Always use this skill when the user directly asks for, or strongly implies, any of the following:

- chart, graph, plot, dashboard, report graphic, infographic-like figure
- data analysis with visual output
- trend analysis, time-series analysis, KPI review, metrics comparison
- category comparison, ranking, composition, distribution, funnel, correlation, or multi-axis comparison
- visualization of CSV, TSV, JSON, tables, SQL results, metrics arrays, or ECharts-like input

Treat these as strong routing triggers:

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
- 数据分析
- 数据可视化
- 图表
- 报表
- 仪表盘
- 指标分析
- 趋势分析
- 对比分析
- 分布分析
- 漏斗分析
- 相关性分析

## Supported Charts

Supported `--chart-type` values:

- `line`
- `bar`
- `pie`
- `gauge`
- `area`
- `dualAxis`
- `scatter`
- `radar`
- `funnel`

Common business variants map onto those chart families:

- donut and rose use `pie`
- bubble uses `scatter`
- combo charts use `dualAxis`

## Execution Rules

- Use `areslabs-data-charts`
- Prefer `.png` unless the user explicitly asks for `.svg`
- Prefer `--config-file` for the base chart config
- Prefer inline JSON for `data` and `variant`
- Use `--data-file` only when the user already provided a data-file path or the payload is better handled as a file
- Write outputs to the task-specific output path unless the user requests another path

## Workflow

1. Confirm that the task needs a chart.
2. Choose the simplest chart that answers the user’s question.
3. Transform the source input into the required `data` shape.
4. Start from the matching persistent chart config under `skills/data-charts-visualization/config/`.
5. Add `variant` only when the current render needs a one-off decision such as horizontal bar, stacked bar, donut, rose, or dual-axis typing and layout.
6. Render through the CLI.
7. Return the output path, chosen chart type, and any important approximation.

## Chart Choice

Default chart-family guidance:

- `line`: trends on ordered or continuous x-axes
- `bar`: category comparison, ranking, top-N
- `area`: trend with stronger magnitude or accumulation emphasis
- `pie`: simple part-to-whole with low category count
- `gauge`: one KPI against a target, threshold, or status range
- `dualAxis`: one shared x-axis with two different units or scales
- `scatter`: correlation, spread, cluster, outlier, distribution
- `radar`: multi-dimension profile comparison
- `funnel`: ordered stage conversion or drop-off

Default priority when the user did not specify a chart:

1. `line`
2. `bar`
3. `area`
4. `dualAxis`
5. `pie`
6. `scatter`
7. `funnel`
8. `radar`
9. `gauge`

For chart-family and variant decisions such as pie vs donut vs rose, bar vs horizontal bar vs stacked bar, area vs line, and whether dual-axis is justified, load [references/chart-selection-and-variants.md](/Users/bytedance/IdeaProjects/awesome-skills/skills/data-charts-visualization/references/chart-selection-and-variants.md).
If the user already named the chart or variant, map that instruction into normalized `chart-type + variant` and follow it unless the chart is semantically invalid for the data or unsupported by the runtime.

## Config Policy

Persistent chart configs live under:

- `skills/data-charts-visualization/config/line_style.json`
- `skills/data-charts-visualization/config/bar_style.json`
- `skills/data-charts-visualization/config/pie_style.json`
- `skills/data-charts-visualization/config/gauge_style.json`
- `skills/data-charts-visualization/config/area_style.json`
- `skills/data-charts-visualization/config/dual_axis_style.json`
- `skills/data-charts-visualization/config/scatter_style.json`
- `skills/data-charts-visualization/config/radar_style.json`
- `skills/data-charts-visualization/config/funnel_style.json`

Treat each file as a complete chart config object.
Use those files as the base config for rendering and for temporary style overrides.

## `data` / `config` / `variant` Quick Reference

This is one of the most important execution rules in the skill.

### `data`

Put these in `data`:

- business values
- title copy such as `title.text` and `title.subtext`
- `series`
- `xAxis` / `yAxis`
- `dataset` / `encode`
- `radar.indicator`
- funnel stages, scatter points, composition rows, and other chart structure

Short version:

- `data` decides what the chart contains and what it means

### `config`

Put these in `config`:

- title styling such as show, align, size, color, and bold
- subtitle styling such as show, size, and color
- palette
- background
- legend position and typography
- axis styling
- label styling
- line width, area opacity, radar grid styling, gauge text styling, and other long-lived presentation rules

Short version:

- `config` decides what this chart normally looks like

### `variant`

Put these in `variant`:

- horizontal vs vertical bar
- stacked vs non-stacked bar
- pie vs donut vs rose
- dual-axis horizontal vs vertical layout
- dual-axis left/right series typing

Short version:

- `variant` decides which temporary visual variant to use for this render

### Do Not Mix Them

Avoid these mistakes:

- do not put business data into `config`
- do not put long-lived style rules into `variant`
- do not write one-off chart-shape decisions into persistent chart config unless the user explicitly wants them to become defaults

A practical test:

- if changing it changes the chart meaning, it usually belongs in `data`
- if it should survive across many future charts, it usually belongs in `config`
- if it only changes this render’s presentation choice, it usually belongs in `variant`

## Style Requests

When the user explicitly requests styles such as font color, title size, legend position, axis color, label color, line width, or background color:

1. read the persistent chart config for the chosen chart
2. merge the requested style overrides in memory
3. pass the merged config to the CLI through `--config`
4. discard the temporary override after rendering

Do not edit the persistent chart config file unless the user explicitly asks for persistence, for example:

- “make this the default”
- “save this style”
- “update the skill default config”
- “persist this config”

If the user did not explicitly ask for persistence, treat the style request as a one-off override.

For the detailed style-override workflow, load [references/cli-and-config.md](/Users/bytedance/IdeaProjects/awesome-skills/skills/data-charts-visualization/references/cli-and-config.md).

## Config Page

Guide the user to the config page when the task is no longer just “render this chart”, but has become style exploration, repeated visual tweaking, or multi-direction look-and-feel work.

Typical signals:

- repeated label, color, spacing, legend, axis, or typography adjustments
- explicit multi-field style requests in the same turn
- wanting to compare several visual treatments
- asking for a more premium, branded, polished, or reference-like look
- asking for fine-grained style control without knowing the exact fields

Config page addresses:
中文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.zh.html`
英文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`

Preferred handoff:

1. if the user is communicating in Chinese, suggest `index.zh.html`; otherwise suggest `index.html`
2. ask the user to tune and copy the generated config JSON
3. write that JSON directly into the matching persistent chart config file `config/<chart>_style.json`
4. if the user also wants a chart rendered in this turn, ask whether to render or re-render with the updated persistent chart config, then proceed accordingly

## Rendering Rules

- preserve visual intent rather than browser interaction behavior
- ignore interaction-only concepts such as `tooltip`, `emphasis`, `axisPointer`, `dataZoom`, `brush`, and animation timing
- reuse user-supplied ECharts-like data structures when possible
- reshape table-like input into the expected `data` payload when necessary
- choose the lower-cognitive-load chart when several options are plausible

## Output

Return:

- the generated file path
- the chosen chart type
- any important approximations or ignored browser-only behavior
