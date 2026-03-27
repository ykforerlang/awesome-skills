# Test Assets

This directory stores human-readable test-case descriptions and input data used to validate the chart renderers.

Golden-image baselines are stored under:
- `test/golden/<chart>/*.png`

All `run_*_tests.py` runners now verify rendered output against the matching golden image by default.
Useful runner flags:
- `--update-golden`: replace the stored golden images with current output
- `--no-verify`: render without comparing against the golden images

Current coverage:
- `line_chart_cases.md`: line-chart test case descriptions and expected validation points
- `data/line/*.json`: ECharts-aligned option payloads for each line-chart case
- `bar_chart_cases.md`: bar-chart test case descriptions and expected validation points
- `data/bar/*.json`: ECharts-aligned option payloads for each bar-chart case
- `pie_chart_cases.md`: pie/donut test case descriptions and expected validation points
- `data/pie/*.json`: ECharts-aligned option payloads for each pie/donut case
- `gauge_chart_cases.md`: gauge test case descriptions and expected validation points
- `data/gauge/*.json`: ECharts-aligned option payloads for each gauge case
- `area_chart_cases.md`: area-chart test case descriptions and expected validation points
- `data/area/*.json`: ECharts-aligned option payloads for each area case
- `dual_axis_chart_cases.md`: dual-axis test case descriptions and expected validation points
- `data/dual_axis/*.json`: ECharts-aligned option payloads for each dual-axis case
- `scatter_chart_cases.md`: scatter-chart test case descriptions and expected validation points
- `data/scatter/*.json`: ECharts-aligned option payloads for each scatter case
- `radar_chart_cases.md`: radar-chart test case descriptions and expected validation points
- `data/radar/*.json`: ECharts-aligned option payloads for each radar case
- `funnel_chart_cases.md`: funnel-chart test case descriptions and expected validation points
- `data/funnel/*.json`: ECharts-aligned option payloads for each funnel case

Line coverage includes:
- basic single-series and multi-series lines
- `dataset + encode`
- line style and symbol coverage
- `showSymbol=false`
- object-array data with ECharts-style label formatter
- `smooth`
- `step`
- numeric x-axis tuple data
- axis/grid styling, range, and formatter
- right-side vertical legend layout
- bottom-centered horizontal legend layout
- top-level `option.color` palette

Bar second-round coverage includes:
- horizontal bars
- mixed positive and negative values
- `dataset + encode`
- stacked bars with labels
- itemStyle border and opacity details

Bar third-round coverage includes:
- multi-series shared `dataset.source` table + per-series `encode.y`
- right-side vertical legend layout
- bottom-centered horizontal legend layout
- top-level `option.color` palette

Pie second-round coverage includes:
- `dataset + encode`
- `center`
- `selectedOffset`
- `roseType=radius`
- right-side vertical legend layout
- bottom-centered horizontal legend layout

Pie third-round coverage includes:
- `roseType=area`
- top-level `option.color` palette

Gauge coverage includes:
- custom min/max range
- custom start/end angles
- progress arc
- splitLine / axisTick / axisLabel
- title/detail `offsetCenter`
- multilingual content
- pointer / anchor styling

Gauge second-round coverage includes:
- `center` and `radius`
- `pointer.show` and `pointer.length`
- `{value}` formatter support
- `axisLabel.distance` / `axisTick.distance` / `splitLine.distance`

Gauge third-round coverage includes:
- segmented `axisLine.lineStyle.color` thresholds

Area coverage includes:
- stacked and non-stacked area series
- custom line and fill styling
- point labels
- `dataset + encode`
- multilingual content
- axis and grid styling

Area second-round coverage includes:
- `smooth`
- `areaStyle.color` linear gradient fill
- `showSymbol=false`
- right-side vertical legend layout
- bottom-centered horizontal legend layout
- top-level `option.color` palette

Area third-round coverage includes:
- label formatter placeholders with `{b}` and `{c}`

Dual-axis coverage includes:
- mixed `bar + line` rendering
- grouped and stacked bars in a dual-axis layout
- `dataset + encode`
- `series[].yAxisIndex`
- bar/line labels and common style options
- independent left/right y-axis formatter, range, and axis styling
- secondary-axis `areaStyle` and `smooth`
- positive and negative stacked bars
- horizontal dual-axis with `xAxisIndex`
- line `showSymbol=false`
- right-side vertical legend layout
- bottom-centered horizontal legend layout
- top-level `option.color` palette

Scatter coverage includes:
- multi-series value-axis scatter plots
- bubble size from the third data dimension
- `dataset + encode`
- object data labels
- axis/grid styling and explicit range
- `--style-config`

Scatter second-round coverage includes:
- shared `dataset.source` table with multiple `series.encode.y` mappings

Scatter third-round coverage includes:
- per-point `itemStyle.borderColor`
- per-point `itemStyle.borderWidth`
- per-point `itemStyle.opacity`

Scatter fourth-round coverage includes:
- `legend.show=false`

Scatter fifth-round coverage includes:
- object-array `dataset.source` with multiple `series.encode.y`

Scatter sixth-round coverage includes:
- `backgroundColor`

Scatter seventh-round coverage includes:
- right-side vertical legend layout

Scatter eighth-round coverage includes:
- top-level `option.color` palette

Scatter ninth-round coverage includes:
- bottom-centered horizontal legend layout

Radar coverage includes:
- single-series and multi-series radar rendering
- `indicator[].min/max`
- `shape=circle`
- line/fill/marker styling
- point labels
- `--style-config`

Radar second-round coverage includes:
- `splitArea`
- `axisName`
- styled `splitLine` and `axisLine`

Radar third-round coverage includes:
- `showSymbol=false`

Radar fourth-round coverage includes:
- `legend.show=false`

Radar fifth-round coverage includes:
- `backgroundColor`

Radar sixth-round coverage includes:
- right-side vertical legend layout

Radar seventh-round coverage includes:
- top-level `option.color` palette

Radar eighth-round coverage includes:
- bottom-centered horizontal legend layout

Funnel coverage includes:
- descending and ascending funnel ordering
- inside and outside labels
- border and opacity styling
- `dataset + encode`
- `--style-config`

Funnel second-round coverage includes:
- `minSize`
- `maxSize`
- `gap`

Funnel third-round coverage includes:
- `sort=none`

Funnel fourth-round coverage includes:
- label percent formatter with `{d}`

Funnel fifth-round coverage includes:
- object-array `dataset.source` with `encode.itemName/value`

Funnel sixth-round coverage includes:
- `legend.show=false`
- `backgroundColor`

Funnel seventh-round coverage includes:
- right-side vertical legend layout

Funnel eighth-round coverage includes:
- top-level `option.color` palette

Funnel ninth-round coverage includes:
- bottom-centered horizontal legend layout

Recommended validation flow:

```bash
python3 skills/data-charts-visualization/test/scripts/run_line_tests.py
python3 skills/data-charts-visualization/test/scripts/run_bar_tests.py
python3 skills/data-charts-visualization/test/scripts/run_pie_tests.py
python3 skills/data-charts-visualization/test/scripts/run_gauge_tests.py
python3 skills/data-charts-visualization/test/scripts/run_area_tests.py
python3 skills/data-charts-visualization/test/scripts/run_dual_axis_tests.py
python3 skills/data-charts-visualization/test/scripts/run_scatter_tests.py
python3 skills/data-charts-visualization/test/scripts/run_radar_tests.py
python3 skills/data-charts-visualization/test/scripts/run_funnel_tests.py
```

Rendered outputs are written into:

```text
skills/data-charts-visualization/test/out/line/
skills/data-charts-visualization/test/out/bar/
skills/data-charts-visualization/test/out/pie/
skills/data-charts-visualization/test/out/gauge/
skills/data-charts-visualization/test/out/area/
skills/data-charts-visualization/test/out/dual_axis/
skills/data-charts-visualization/test/out/scatter/
skills/data-charts-visualization/test/out/radar/
skills/data-charts-visualization/test/out/funnel/
```

When verification fails, diff previews are written into:

```text
skills/data-charts-visualization/test/out/<chart>/_diff/
```
