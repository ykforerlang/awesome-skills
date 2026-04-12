# Data Charts Visualization

Turn structured data into polished static charts through one lightweight CLI.

This skill is built for agent workflows that need chart output fast, reliably, and without dragging in a browser stack. It gives you broad chart coverage, an agent-friendly `data / config / variant` contract, and enough styling power to move from "just render it" to "make it production-ready".

## Install

Install this skill from GitHub with the Skills CLI:

```bash
npx skills add ykforerlang/awesome-skills --skill data-charts-visualization
```

For OpenClaw users, install directly into the OpenClaw global skills directory:

```bash
npx skills add ykforerlang/awesome-skills --skill data-charts-visualization -a openclaw -g --copy -y
```

Quick start after install:

1. Ask your agent to generate or refine a chart.
2. Fine-tune the chart style in natural language first, such as palette, layout, typography, legend position, or overall visual tone.
3. For more precise visual tuning, open the config page:
   `https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`
4. After adjusting the style in the config page, copy the generated config and paste it back into the current chat.

## Why This Skill

- Rich chart support: line, bar, pie, donut, rose, gauge, area, dual-axis, scatter, bubble, radar, and funnel.
- Lightweight runtime: render static images without Chromium, Playwright, or browser automation.
- Powerful configuration: per-chart persistent presets, inline config overrides, and one-off variants for shape decisions.
- Agent-friendly contract: keep business data in `data`, reusable style rules in `config`, and one-off render choices in `variant`.
- ECharts-friendly input model: supports familiar structures such as `series`, `xAxis`, `yAxis`, `dataset.source`, and `series.encode`.
- Predictable output: stable CLI behavior, static assets, and test-generated sample images for every major chart family.

## Showcase

<table>
  <tr>
    <td align="center" width="33%">
      <strong>Line</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/line-series-2.png" alt="Two-series line chart" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>Bar</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/bar-series-2.png" alt="Two-series bar chart" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>Area</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/area-series-2.png" alt="Two-series area chart" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Dual-Axis</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/dual-axis-series-2.png" alt="Two-series dual-axis bar-line chart" width="260"/>
    </td>
    <td align="center">
      <strong>Dual-Axis Horizontal Style</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/dual-axis-horizontal-style.png" alt="Two-series horizontal-style dual-axis bar-line chart" width="260"/>
    </td>
    <td align="center">
      <strong>Scatter</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/scatter-series-2.png" alt="Two-series scatter chart" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Pie</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/pie-showcase.png" alt="Pie chart" width="260"/>
    </td>
    <td align="center">
      <strong>Donut</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/donut-showcase.png" alt="Donut chart" width="260"/>
    </td>
    <td align="center">
      <strong>Rose</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/rose-showcase.png" alt="Rose chart" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Gauge</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/gauge-showcase.png" alt="Gauge chart" width="260"/>
    </td>
    <td align="center">
      <strong>Radar</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/radar-showcase.png" alt="Radar chart" width="260"/>
    </td>
    <td align="center">
      <strong>Funnel</strong><br/>
      <img src="https://raw.githubusercontent.com/ykforerlang/awesome-skills/main/static/data-charts-visualization/funnel-showcase.png" alt="Funnel chart" width="260"/>
    </td>
  </tr>
</table>

## Built For Agents

This skill is aimed at OpenClaw-like agents and other automation flows that need deterministic chart rendering instead of interactive BI sessions.

- One CLI for all supported chart families: `npx -y @areslabs/data-charts-visualization@1.0.2`
- No global install required; avoid documenting the bare `areslabs-data-charts` binary as the default entrypoint
- Static image output by default, ideal for reports, dashboards, tickets, and generated assets
- No browser dependency, which keeps environments simpler and cheaper to run
- A small, explicit contract that makes chart generation easier to reason about than passing arbitrary raw styling blocks

## Configuration Power

This is where the skill separates itself from a thin chart wrapper.

- Persistent chart presets: each chart type owns its default config under `config/<chart>_style.json`
- Temporary style overrides: merge one-off changes and pass them inline with `--config`
- Render variants: use `--variant` for choices such as horizontal bar, stacked bar, donut, rose, or dual-axis series typing
- Structured style schema: the config model is built for chart styling, not as a dump of raw browser-only options
- Visual tuning path: when you want hands-on style exploration, use the config page and then bring the generated config back into the render flow

Config page addresses:
- addresses：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`


## Best Fit

Use this skill when you want to:

- render production-friendly static charts from agent-generated data
- keep chart syntax close to ECharts without depending on a browser runtime
- standardize report visuals through persistent chart presets
- support both quick default rendering and deep style customization
- cover most business chart requests with one consistent toolchain

## License
MIT-0
