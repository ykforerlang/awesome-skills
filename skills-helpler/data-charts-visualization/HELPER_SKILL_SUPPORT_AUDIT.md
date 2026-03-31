# Helper Skill Support Audit

This audit checks whether the config items currently exposed in the web helper are actually consumed by the chart skill renderers.

Status labels:

- `Supported`: helper output is clearly consumed by renderer code
- `Partial`: helper outputs the field, but renderer behavior is limited or only works in part of the chart modes
- `Scoped`: supported only under a narrower condition than the helper UI may imply

## Overall Conclusion

Most helper config items are now genuinely supported by the skill renderers.

The remaining meaningful mismatch is now very small:

- some axis min/max controls only matter on value axes
- a few fields are technically accepted but have narrower visual effect than the helper wording suggests

## Shared Foundation

- title style: `Supported`
- subtitle style: `Supported`
- background: `Supported`
- palette: `Supported`
- legend show / position / orient / text style: `Supported`
- x/y tick show: `Supported`
- x/y axis label size / color / formatter: `Supported`
- x/y axis line show / color: `Supported`
- horizontal / vertical split line show / color / type / width: `Supported`
- x/y min / max: `Scoped`
  - effective on value axes
  - not meaningful on category axes

## Line

- smooth: `Supported`
- step: `Supported`
- showSymbol: `Supported`
- connectNulls: `Supported`
- label show / size / color: `Supported`
- symbol / symbolSize: `Supported`
- lineStyle width / type: `Supported`

## Bar

- horizontal / stacked: `Supported`
- barWidth / barGap: `Supported`
- label show / position / size / color: `Supported`
- item opacity / borderWidth / borderColor: `Supported`
- borderRadius: `Supported`

## Pie

- pie / donut / rose mode: `Supported`
- chart size follows plot area: `Supported`
- startAngle: `Supported`
- label show / position / size / color / formatter: `Supported`
- item opacity / borderWidth / borderColor: `Supported`
- labelLine show / color / width: `Supported`

## Gauge

- min / max / startAngle / endAngle: `Supported`
- progress show / width / color: `Supported`
- title show / fontSize / color: `Supported`
- detail show / formatter / fontSize / color: `Supported`
- axis width: `Supported`
- 3-band threshold colors: `Supported`
- axisLabel show / fontSize / color: `Supported`
- splitLine show / length / width / color: `Supported`
- axisTick show / length / width / color: `Supported`
- pointer show / width / color: `Supported`
- anchor show / size / color: `Supported`
- chart size follows plot area: `Supported`

## Area

- stacked / smooth / showSymbol / connectNulls: `Supported`
- lineStyle width / type: `Supported`
- symbol / symbolSize: `Supported`
- label show / size / color: `Supported`
- area opacity: `Supported`
- area solid fill color: `Supported`
- area gradient fill: `Supported`

## Dual-Axis

- horizontal / stackedBars / rightArea / smoothLine / showSymbol / connectNulls: `Supported`
- barWidth / barGap / bar opacity: `Supported`
- bar borderRadius: `Supported`
- left/right axis formatter: `Supported`
- left/right axis min / max: `Supported`
- right line style / width: `Supported`
- right symbol / symbolSize: `Supported`
- right label show / size / color: `Supported`

## Scatter

- scatter / bubble mode: `Supported`
- showLabel / label size / color: `Supported`
- symbol / symbolSize: `Supported`
- item opacity / borderWidth / borderColor: `Supported`

## Radar

- shape / splitNumber: `Supported`
- chart size follows plot area: `Supported`
- splitLine color / width / type: `Supported`
- axisLine color / width / type: `Supported`
- splitArea color / opacity: `Supported`
- showSymbol / symbol / symbolSize: `Supported`
- lineStyle width / type: `Supported`
- label show / size / color: `Supported`

## Funnel

- sort / gap / minSize / maxSize: `Supported`
- chart size follows plot area: `Supported`
- showLabel / label position / size / color: `Supported`
- item opacity / borderWidth / borderColor: `Supported`

## Main Follow-Up Items

If we want a completely strict “helper field always has direct visible effect” standard, the top follow-ups are:

1. clarify or conditionally hide axis `min/max` when current axis is categorical
2. continue reducing fields whose effect depends on narrower chart semantics
