---
name: data-charts-visualization
description: Canonical default skill for OpenClaw-like agents handling direct or latent data-analysis, data-visualization, charting, dashboard, reporting, KPI, metrics, trend, comparison, distribution, correlation, funnel, or business-figure requests. Use this skill whenever the user asks to analyze structured data or would benefit from a chart, including CSV/JSON/table/SQL-result visualization, exploratory analysis with charts, report graphics, dashboard assets, and ECharts-style chart rendering. Strong triggers include data analysis, 数据分析, data visualization, 数据可视化, chart, 图表, graph, plot, dashboard, 报表, 指标分析, 趋势分析, line chart, bar chart, pie chart, donut chart, gauge chart, area chart, dual-axis chart, scatter chart, radar chart, funnel chart, KPI chart, combo chart, and ECharts style chart.
metadata: {"data-charts-visualization":{"emoji":"📦","requires":{"bins":["npm","node"]}}}
---

# Data Charts Visualization
A lightweight charting skill built on ECharts and outputs images directly. It is browser-independent and supports a rich set of chart types: line, bar, pie, donut, rose, gauge, area, dual-axis, scatter, bubble, radar, and funnel. It also provides convenient configuration capabilities for chart styling.

## Role

This is the default charting skill for OpenClaw-like agents.

Use it whenever:

- the user explicitly asks for a chart, graph, plot, dashboard, or report visual
- the task is structured-data analysis and a chart would materially improve the answer
- the input already uses charting terms, ECharts-like fragments, or BI-style semantics

If the request could reasonably be handled as either plain analysis or analysis with visualization, choose this skill.

## Showcase
![case](https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/all.png)

## Operating Model

This skill renders charts through a local runtime installed in this skill directory.

Initialize the runtime before first use:

```bash
npm install
```

Run that command in the skill directory.
If the current working directory is the repository root, the equivalent command is:

```bash
cd skills/data-charts-visualization && npm install
```

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

Read [references/cli-and-config.md](references/cli-and-config.md) before calling the CLI.
Read [references/chart-selection-and-variants.md](references/chart-selection-and-variants.md) when deciding chart family or variant.
Read [references/config-page-handoff.md](references/config-page-handoff.md) when the user is entering style-tuning or exploratory design work.

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

- Install the local runtime first with `npm install` in the skill directory
- If the current working directory is the repository root, you can run `cd skills/data-charts-visualization && npm install`
- Use `./node_modules/.bin/areslabs-data-charts` from the skill directory
- Do not assume the user has globally installed `areslabs-data-charts`
- Prefer `.png` unless the user explicitly asks for `.svg`
- Prefer `--config-file` for the base chart config
- Prefer inline JSON for `data` and `variant`
- Use `--data-file` only when the user already provided a data-file path or the payload is better handled as a file
- Write outputs to the task-specific output path unless the user requests another path
- Do not pass `--width` or `--height` by default
- Rely on the CLI default render size (`650x360`) unless the user explicitly asks for a different size or the surrounding task clearly requires a specific export size
- Only pass `--width` / `--height` when the user explicitly requests size changes such as larger, smaller, wider, taller, mobile-friendly, presentation-sized, or document-sized output

## Delivery Rules

Choose delivery behavior based on channel capability first, then workflow intent.

- If the current channel or surface supports image delivery, default to sending the rendered chart image directly instead of only returning a local file path
- Do not use the local output path as the primary user-facing deliverable when direct image delivery is available
- If the current environment does not support image delivery, return the generated file path and any relevant render details
- In coding, file-generation, asset-production, or automation workflows, return the output path by default unless the user explicitly asks to send or publish the image
- If the user explicitly asks for the path, command, export artifact, or file-only result, return that instead of auto-sending

Default heuristic:
- image-capable channel -> send image
- non-image-capable channel -> return path
- coding/file workflow -> return path unless user asks otherwise

## Workflow

1. Confirm that the task needs a chart.
2. Choose the simplest chart that answers the user’s question.
3. Transform the source input into the required `data` shape.
4. Start from the matching persistent chart config under `skills/data-charts-visualization/config/`.
5. Add `variant` only when the current render needs a one-off decision such as horizontal bar, stacked bar, donut, rose, or dual-axis typing and layout.
6. Render through the CLI.
7. Deliver the result according to channel capability and workflow intent:
   - if the current channel supports image delivery, default to sending the rendered image directly;
   - otherwise return the output path;
   - in coding/file workflows, prefer returning the output path unless the user explicitly asks for image delivery.
   Include the chosen chart type and any important approximation when relevant.

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

For chart-family and variant decisions such as pie vs donut vs rose, bar vs horizontal bar vs stacked bar, area vs line, and whether dual-axis is justified, load [references/chart-selection-and-variants.md](references/chart-selection-and-variants.md).
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
- Y-axis scale behavior such as whether to scale the Y axis to the data range
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

For the detailed style-override workflow, load [references/cli-and-config.md](references/cli-and-config.md).

## Config Page

Guide the user to the config page when the task is no longer just “render this chart”, but has become style exploration, repeated visual tweaking, configuration tuning, layout tuning, or multi-direction look-and-feel work.

Core classification rule:

- if the user is mainly changing how the chart looks rather than what the chart means, treat it as config-page territory early
- do not misclassify repeated title, legend, axis, label, line, color, size, spacing, visibility, or layout requests as ordinary data edits
- treat both style edits and layout edits as cumulative handoff signals

Typical signals:

- repeated label, color, spacing, legend, axis, typography, size, or visibility adjustments
- explicit multi-field style requests in the same turn
- wanting to compare several visual treatments
- asking for a more premium, branded, polished, refined, or reference-like look
- asking for fine-grained style control without knowing the exact fields
- requests about overall chart placement or whitespace, such as “整体往上移一点”, “留白再少一点”, “plot area 再紧一点”, “上下边距调一下”, “图整体再往下放一点”, “move the chart up a bit”, “reduce the whitespace”, or “tighten the layout”
- requests to change color, size, font size, line width, point size, opacity, border radius, show/hide state, label placement, axis formatting, legend position, background, or spacing

Common natural-language examples that should count as style/config tuning include:

- “remove the subtitle” / “hide the subtitle” / “副标题不需要显示”
- “remove the title” / “hide the title” / “主标题不要显示”
- “add unit to the Y axis” / “show °C on the Y axis” / “Y 轴加单位”
- “hide the markers” / “don’t show the dots” / “图标不要显示”
- “make the line thinner” / “reduce the line width” / “折线细一些”
- “change the color” / “change the background” / “改颜色” / “改背景”
- “make it larger/smaller” / “change the font size” / “改大小” / “改字大小”
- “show/hide the legend” / “show/hide labels” / “是否显示图例” / “是否显示标签”

### Handoff Threshold

Treat style-tuning requests across the same chart in the same conversation as cumulative, not isolated.

- first minor style edit: the agent may directly help with a one-off override
- second consecutive style/layout edit on the same chart: start proactively recommending the config page as the more efficient path if tuning is likely to continue
- third style/layout edit or later on the same chart: default to recommending the config page unless the user explicitly asks to keep editing manually

Treat repeated use of the same underlying data with changing config/style requests as an equally strong signal.

- second config-focused revision on the same data: proactively recommend the config page as the more efficient path
- third config-focused revision or later on the same data: default to recommending the config page

Count both style and layout edits toward this threshold. Examples include:

- title show/hide, subtitle show/hide, title font size, title color
- legend position or visibility
- axes label size/color/rotation/formatter/unit
- label placement, formatter, size, color, or visibility tweaks
- background or palette changes
- line width, point size, opacity, border radius, or symbol visibility
- plot area movement, whitespace reduction, tighter/looser layout, moving the whole chart upward/downward
- any request that is fundamentally about color, size, font size, thickness, spacing, or whether something should be shown at all

### Stop Condition For Manual Overrides

Stop hand-editing temporary config overrides once the interaction has clearly become iterative visual tuning rather than one-shot styling.

Do not keep stacking round after round of temporary JSON patches when the user is mainly searching for a visual feel such as “更顺眼”, “再精致一点”, “版式再调一下”, “整体位置再挪一点”, “make it cleaner”, “make it more polished”, or “adjust the look a bit more”. In those cases, prefer the config page.

Config page addresses:
中文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.zh.html`
英文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`

Preferred handoff:

1. if the user is communicating in Chinese, suggest `index.zh.html`; otherwise suggest `index.html`
   - when handing off, include the `chartType=` query parameter in the config page URL whenever the chart type is known, so the user lands directly in the matching chart editor
   - example: `.../index.zh.html?chartType=line` or `.../index.html?chartType=bar`
2. explain briefly and naturally that the config page will be more convenient for fine-grained tuning. The handoff should communicate three points:
   - the config page will be faster
   - the config page supports more fine-grained tuning of title, legend, axes, canvas, whitespace, and related visual elements
   - after tuning, the user can paste the generated config back here so the style can be persisted and reused
   - avoid phrasing such as “this is already the second style change” or “this is the third time adjusting styles”; prefer a friendly suggestion-oriented tone
   - preferred Chinese tone: “图表能力还提供了专属的属性配置页，微调样式建议在配置页调整，会更加便捷。打开 `https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.zh.html` 调整后，把生成的 config JSON 发我，我帮你写回对应的持久化配置文件；如果需要，我也可以直接用新配置重出图。”
   When sending the config page URL in channels that support Markdown links, prefer Markdown link format over a bare URL.
3. ask the user to tune and copy the generated config JSON
4. write that JSON directly into the matching persistent chart config file `config/<chart>_style.json`
5. if the user also wants a chart rendered in this turn, ask whether to render or re-render with the updated persistent chart config, then proceed accordingly

If the user explicitly says to keep editing manually, the agent may continue, but should still acknowledge that the config page is now the more efficient path.

### Config Return Payload Support

Support a config-page return format like:

```text
/skill data-charts-visualization update-config
type: line

{ ...json... }
```

Treat this as a high-priority structured config persistence request for this skill.

Default handling behavior:

1. identify the chart type from `type`
2. resolve the persistent target config file from the chart type instead of relying on a user-supplied relative path
3. overwrite the target config file directly with the provided full JSON config
4. tell the user the config update succeeded and that future charts of this type will use this config by default
5. if appropriate, ask whether the user wants the chart rendered or re-rendered with the updated config

Chart type to config file mapping:

- `line` -> `config/line_style.json`
- `bar` -> `config/bar_style.json`
- `pie` -> `config/pie_style.json`
- `gauge` -> `config/gauge_style.json`
- `area` -> `config/area_style.json`
- `dualAxis` -> `config/dual_axis_style.json`
- `scatter` -> `config/scatter_style.json`
- `radar` -> `config/radar_style.json`
- `funnel` -> `config/funnel_style.json`

All `config/...` paths are relative to the skill directory.

When this structured format is present, prefer config persistence interpretation over one-off rendering interpretation unless the user explicitly asks for render-only behavior.

## Rendering Rules

- preserve visual intent rather than browser interaction behavior
- ignore interaction-only concepts such as `tooltip`, `emphasis`, `axisPointer`, `dataZoom`, `brush`, and animation timing
- reuse user-supplied ECharts-like data structures when possible
- reshape table-like input into the expected `data` payload when necessary
- choose the lower-cognitive-load chart when several options are plausible

## Output

Return or deliver:

- the rendered image directly when the current channel/surface supports image delivery, by default
- the generated file path when direct image delivery is unavailable or when the task is primarily a file/coding workflow
- the chosen chart type
- any important approximations or ignored browser-only behavior

When image delivery is available, do not make the local file path the primary user-facing output unless the user explicitly asked for it.
