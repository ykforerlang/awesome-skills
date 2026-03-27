# Dual-Axis Chart Test Cases

This document describes the focused dual-axis chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| DA-001 | `data/dual_axis/dual_axis_basic_mixed.json` | Validate a basic bar + line dual-axis chart | `series[].type`, `series[].yAxisIndex` | Left-axis bars and right-axis line render together with a combined legend |
| DA-002 | `data/dual_axis/dual_axis_grouped_bars_line.json` | Validate grouped multi-bar + line rendering | multiple `bar` series, `barWidth`, `barGap`, `yAxisIndex` | Grouped bars render side by side while a right-axis line overlays the same categories |
| DA-003 | `data/dual_axis/dual_axis_stacked_bars_labels.json` | Validate stacked bars with labels plus a secondary line | `stack`, `label.show`, `yAxisIndex` | Same-stack bars accumulate on the left axis and labels remain readable while the line stays on the right axis |
| DA-004 | `data/dual_axis/dual_axis_dataset_encode.json` | Validate dataset + encode support across both axes | `dataset.source`, `series.encode`, `yAxisIndex` | Bar and line series both render from tabular dataset input without inline `series.data` |
| DA-005 | `data/dual_axis/dual_axis_dual_line_styles.json` | Validate dual-line styling on separate axes | `lineStyle`, `symbol`, `symbolSize`, `label.show`, `yAxisIndex` | Two line series render with different symbols, line styles, and labels on different y-axes |
| DA-006 | `data/dual_axis/dual_axis_axis_style_formatter.json` | Validate axis formatting and styling on both y-axes | `axisLabel.formatter`, `axisLine`, `splitLine`, `nameTextStyle`, `min`, `max` | Left and right axes apply independent labels, colors, ranges, and grid/line styling |
| DA-007 | `data/dual_axis/dual_axis_area_smooth.json` | Validate dual-axis area + smooth rendering | `areaStyle`, `smooth`, `yAxisIndex` | A smoothed line renders with filled area on the secondary axis while bars stay on the primary axis |
| DA-008 | `data/dual_axis/dual_axis_negative_stacked.json` | Validate positive and negative stacked bars | `stack`, positive/negative `series[].data`, `yAxisIndex` | Positive bars stack upward, negative bars stack downward, and the secondary line remains aligned |
| DA-009 | `data/dual_axis/dual_axis_horizontal.json` | Validate horizontal dual-axis rendering | `xAxis[]`, `xAxisIndex`, `yAxis.type=category` | Horizontal bars render against the primary x-axis while a secondary-axis line overlays the same categories |
| DA-010 | `data/dual_axis/dual_axis_dataset_encode_table.json` | Validate dataset table + encode support across both axes | `dataset.source=[[...header...], ...]`, `series.encode`, `yAxisIndex` | Bar and line series both render from 2D tabular dataset input with header row |
| DA-011 | `data/dual_axis/dual_axis_null_gap.json` | Validate null-point gaps in dual-axis lines | line `series.data` with `null`, `yAxisIndex` | The secondary-axis line breaks at null points while the bar series remains intact |
| DA-012 | `data/dual_axis/dual_axis_connect_nulls.json` | Validate dual-axis `connectNulls` behavior | line `series.connectNulls=true`, `series.data` with `null` | The secondary-axis line connects adjacent non-null points while bars remain category-aligned |
| DA-013 | `data/dual_axis/dual_axis_show_symbol_hidden.json` | Validate hidden line markers on dual-axis charts | line `series.showSymbol=false`, `yAxisIndex` | The secondary-axis line renders without point markers while the bar series remains unchanged |
| DA-014 | `data/dual_axis/dual_axis_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Dual-axis series render normally while the legend is omitted |
| DA-015 | `data/dual_axis/dual_axis_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | The combined legend renders as a right-aligned vertical stack for both bar and line series |
| DA-016 | `data/dual_axis/dual_axis_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The combined legend renders below the chart as a centered horizontal row |
| DA-017 | `data/dual_axis/dual_axis_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Bar and line series consume colors from the global palette in series order across both axes |
| DA-018 | `data/dual_axis/dual_axis_background_color.json` | Validate chart background color | `backgroundColor` | Dual-axis chart renders with the configured non-default background color |
| DA-019 | `data/dual_axis/dual_axis_style_config.json` | Validate style-config override flow | `--style-config`, layered base/chart style configs | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/dual_axis_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
