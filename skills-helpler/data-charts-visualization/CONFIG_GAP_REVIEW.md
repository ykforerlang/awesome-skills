# Config Gap Review

This note summarizes the current config coverage of the web helper and the remaining common gaps after the recent helper and skill alignment work.

## Current Status

The helper now covers most high-frequency appearance controls without relying on `Advanced Overrides`:

- foundation
  - title align / size / color / bold
  - subtitle size / color
  - background
  - palette
  - legend show / position / orient / size / color
  - x/y axis tick show
  - x/y axis label size / color
  - x formatter / y formatter
  - x/y axis line show / color
  - x/y min / max
  - horizontal / vertical split line show / color / type / width
  - shared layout margins
- line
  - smooth / step / showSymbol / connectNulls / showLabel
  - symbol / symbolSize
  - lineStyle width / type
  - label fontSize / color
- bar
  - horizontal / stacked
  - barWidth / barGap
  - label show / position / fontSize / color
  - item opacity / borderWidth / borderColor
- pie
  - pie mode
  - label show / position / fontSize / color / formatter
  - labelLine show
  - startAngle / selectedOffset
  - chart size follows plot area
- gauge
  - min / max / startAngle / endAngle
  - progress show / width / color
  - title show / fontSize / color
  - detail show / formatter / fontSize / color
  - axis width
  - axisLabel show / fontSize / color
  - splitLine show / length / width / color
  - axisTick show / length / width / color
  - pointer show / width / color
  - anchor show / size / color
  - chart size follows plot area
- area
  - stacked / smooth / showSymbol / connectNulls / showLabel
  - area opacity
  - symbol / symbolSize
  - lineStyle width / type
  - label fontSize / color
- dual-axis
  - horizontal / stackedBars / rightArea / smoothLine / showSymbol / connectNulls
  - barWidth / barGap / bar opacity
  - right line style / width
  - right symbol / symbolSize
  - right label show / fontSize / color
- scatter
  - scatter / bubble
  - showLabel
  - symbol / symbolSize
  - item opacity / borderWidth / borderColor
  - label fontSize / color
- radar
  - shape / splitNumber / showSymbol / showLabel / areaOpacity
  - chart size follows plot area
  - symbol / symbolSize
  - lineStyle width / type
  - label fontSize / color
  - splitLine color / width / type
  - axisLine color / width / type
  - splitArea color / opacity
- funnel
  - sort / labelPosition / gap / minSize / maxSize
  - showLabel / label fontSize / color
  - item opacity / borderWidth / borderColor
  - chart size follows plot area

## Important Alignment Notes

- Legend anchor positions are now aligned between helper and renderer.
- Axis `min` and `max` now work through the shared renderer path.
- Non-cartesian charts keep axis controls hidden in helper.

## Remaining Common Gaps

These are still the most meaningful common gaps if we want to reduce `Advanced Overrides` further.

### Foundation

- axis name text style
  - `xAxis.nameTextStyle`
  - `yAxis.nameTextStyle`
- split line opacity
- title / subtitle show toggle
- legend item spacing and icon shape

### Line

- label formatter
- line color override per series in helper

### Bar

- label formatter
- per-series color override

### Pie

- per-slice border tuning

### Gauge

- axisLabel formatter
- split count
- pointer length
- title/detail offsetCenter

### Area

- label formatter

### Dual-Axis

- left bar label style
- right line label formatter
- right area color / opacity finer control

### Scatter

- label formatter
- per-series color override

### Radar

- indicator name style
- splitArea multiple color stops / alternating rings
- per-series color override

### Funnel

- label formatter
- min / max explicit numeric control
- per-stage color override

## Priority Recommendation

If we continue, the next best batch should be:

1. formatter-related high-frequency controls
2. per-series color override on selected chart families
3. gauge axisLabel formatter / pointer length / split count
4. pie per-slice tuning if we decide the helper should expose item-level style

## What Does Not Need Form First

These are supported or partly supportable, but do not need immediate helper controls:

- business text fields like title text and subtitle text beyond defaults
- low-frequency formatter customization across every chart
- highly chart-specific edge cases that are better kept in `Advanced Overrides`
