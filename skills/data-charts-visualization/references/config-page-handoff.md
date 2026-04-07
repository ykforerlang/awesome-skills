# Config Page Handoff

Use this file when the user is not just asking for a chart, but is implicitly asking for style exploration, hands-on tuning, or layout polishing.

## Core Principle

This skill already supports flexible style control through chart config, but agent-only JSON editing is not always the best UX.

When the user has direct visual-adjustment intent, guide them into the config page early instead of waiting for several rounds of trial-and-error. Do not treat repeated tuning requests on the same chart as unrelated one-off edits.

Use this classification rule:

- if the user is mainly changing appearance rather than business meaning, treat it as config-page territory early
- requests about color, size, font size, line thickness, point size, opacity, spacing, margin, position, formatter, unit, or whether an element is shown at all are style/config requests
- title/subtitle visibility, legend visibility, label visibility, symbol visibility, axis unit display, and spacing adjustments all count as handoff signals
- this rule is language-agnostic: apply it whether the user asks in Chinese, English, or mixed language

## Handoff Triggers

### Immediate Handoff Triggers

Suggest the config page immediately when the user:

- asks for a more premium, business, modern, soft, bold, dark, or branded look
- explicitly asks for several style-field changes in the same turn, such as title color, font size, background, legend position, and label color together
- wants to compare several style directions
- has a reference image and mainly cares about appearance rather than only data meaning
- says the chart is “差点感觉”, “不够高级”, “再精致一点”, “更像某个品牌”, “make it cleaner”, “make it more polished”, “make it feel more premium”, or “make it look more like this reference”
- asks for “把样式先调顺眼，再套我自己的数据” or “tune the style first, then apply my data”

### Escalation Triggers Across Turns

Treat repeated style/layout requests across the same chart in the same conversation as cumulative handoff signals.

Escalate toward the config page when the user:

- asks to repeatedly tweak colors, sizes, font sizes, margins, legend position, label placement, axis formatting, units, visibility, or split lines
- makes a second consecutive style/layout change on the same chart
- reaches a third style/layout change on the same chart; at that point the agent should default to handoff unless the user explicitly wants manual editing to continue
- repeatedly requests to move labels around or rotate x-axis labels
- repeatedly changes palette, line thickness, point size, opacity, border radius, donut thickness, gauge band style, radar grid style, or whether markers/symbols should be shown
- asks to adjust overall chart placement or whitespace, such as “整体往上移一点”, “留白再少一点”, “plot area 再紧一点”, “上下边距调一下”, “图整体再往下放一点”, “move the chart up a bit”, “reduce the whitespace”, “tighten the layout”, or “add more padding”
- repeatedly asks to show/hide elements such as title, subtitle, legend, labels, symbols, or data markers

### Natural-Language Examples That Should Count

Treat requests like the following as style/config tuning, not as data editing:

- “remove the subtitle” / “hide the subtitle” / “副标题不需要显示”
- “remove the title” / “hide the title” / “主标题不要显示”
- “add unit to the Y axis” / “show °C on the Y axis” / “Y 轴加单位”
- “hide the markers” / “don’t show the dots” / “图标不要显示”
- “make the line thinner” / “reduce the line width” / “折线细一些”
- “change the color” / “change the background” / “改颜色” / “改背景”
- “make it larger/smaller” / “change the font size” / “改大小” / “改字大小”
- “show/hide the legend” / “show/hide labels” / “是否显示图例” / “是否显示标签”

## Practical Threshold

Use this simple operating rule:

- first minor style edit: direct manual adjustment is fine
- second consecutive style/layout edit: explicitly mention that the config page will be more efficient if more tuning is coming
- third style/layout edit or later: default to guiding the user to the config page instead of continuing to hand-edit JSON

Only continue manual editing beyond that point when the user explicitly asks the agent to keep doing it by hand.

## What To Say

Keep the handoff short and practical.

Recommended pattern:

1. confirm that the request is mainly about style or layout tuning
2. explain that this skill has a dedicated config page with preview
3. tell the user to tune there and copy the generated config JSON
4. say that the copied config will be written directly into the persistent chart config file `config/<chart>_style.json`

Example wording:

> We are already in style/layout tuning territory. It will be faster and more controllable to adjust this in the config page than to keep hand-editing JSON here. Open `https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`, pick the chart type, tune the title, legend, axes, labels, spacing, and chart-specific styles, then send me the copied config JSON. I will write it into the matching persistent chart config file. If you also want a chart rendered with it, I can use the updated config to render or re-render your data.

Suggested Chinese wording:

> 我们现在已经进入样式 / 版式微调阶段了。继续让我一轮轮手改也可以，但效率会越来越低。这个 skill 有专门的配置页，你直接在里面调标题、图例、坐标轴、标签、留白和边距会更快。你调完把 config JSON 发我，我帮你写回对应的 `config/<chart>_style.json`。如果你还想顺手重出图，我也可以直接用新配置渲染。

## Config Page URLs

中文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.zh.html`
英文地址：`https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`

The page supports chart-family switching, visual preview, and copying config JSON.
If the user is communicating in Chinese, prefer `index.zh.html`; otherwise prefer `index.html`.

## After Handoff

Once the user returns with copied config JSON:

- identify the chart type
- write the JSON directly into the matching `skills/data-charts-visualization/config/<chart>_style.json`
- if the user also wants a render in the same turn, confirm whether to render or re-render with the updated persistent chart config
- keep the user’s business data in `data`
- keep one-off layout decisions in `variant`

## Do Not Over-Handoff

Do not force the config page when the user only wants:

- a straightforward one-shot chart
- a default chart with one minor safe visual choice the agent can infer
- a single small style tweak such as one title-size change or one legend-position change
- pure analytical help without visual iteration

The page is for style exploration, precision tuning, layout polishing, or repeated visual back-and-forth.
