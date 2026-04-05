# Config Page Handoff

Use this file when the user is not just asking for a chart, but is implicitly asking for style exploration or hands-on tuning.

## Core Principle

This skill already supports flexible style control through chart config, but agent-only JSON editing is not always the best UX.

When the user has direct visual-adjustment intent, guide them into the config page early instead of waiting for several rounds of trial-and-error.

## Strong Signals For Handoff

Suggest the config page when the user:

- asks for a more premium, business, modern, soft, bold, dark, or branded look
- asks to repeatedly tweak colors, fonts, margins, legend position, label placement, axis formatting, or split lines
- explicitly asks for several style-field changes in the same turn, such as title color, font size, background, legend position, and label color together
- wants to compare several style directions
- has a reference image and mainly cares about appearance rather than only data meaning
- says the chart is “差点感觉”, “不够高级”, “再精致一点”, “更像某个品牌”
- asks for “把样式先调顺眼，再套我自己的数据”

These are weaker but still meaningful signals:

- repeated requests to move labels around
- repeated requests to rotate x-axis labels
- repeated palette changes
- repeated requests to adjust line thickness, point size, opacity, border radius, donut thickness, gauge band style, or radar grid style

## What To Say

Keep the handoff short and practical.

Recommended pattern:

1. confirm that the request is mainly about style tuning
2. explain that this skill has a dedicated config page with preview
3. tell the user to tune there and copy the generated config JSON
4. say that the copied config will be written directly into the persistent chart config file `config/<chart>_style.json`

Example wording:

> This request is already in style-tuning territory. It will be faster and more controllable to adjust it in the config page than to keep hand-editing JSON here. Open `https://ykforerlang.github.io/awesome-skills/skills-helpler/data-charts-visualization/web/index.html`, pick the chart type, tune the title, legend, axes, labels, and chart-specific styles, then send me the copied config JSON. I will write it into the matching persistent chart config file. If you also want a chart rendered with it, I can use the updated config to render or re-render your data.

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
- a default chart with minor safe choices the agent can infer
- pure analytical help without visual iteration

The page is for style exploration, precision tuning, or repeated visual back-and-forth.
