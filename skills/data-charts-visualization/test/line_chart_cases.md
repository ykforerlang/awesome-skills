# Line Chart Test Cases

This document describes the focused line-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| L-001 | `data/line/line_basic_single_series.json` | Validate a basic single-series line chart | `series[0].type=line` | One line series renders with correct categories and legend |
| L-002 | `data/line/line_multi_series.json` | Validate multiple line series | multiple `line` series | Multiple line series render on the same axes with separate legend entries |
| L-003 | `data/line/line_dataset_encode.json` | Validate dataset + encode support | `dataset.source`, `series.encode` | Lines render from tabular dataset input without inline `series.data` |
| L-004 | `data/line/line_line_styles_symbols.json` | Validate line-style and symbol coverage | `lineStyle.type`, `symbol`, `symbolSize` | Solid, dashed, and dotted lines render with distinct markers and widths |
| L-005 | `data/line/line_object_data_labels.json` | Validate object-array data and ECharts-style labels | `series.data[{name,value}]`, `label.formatter` | The line renders from object data and labels apply `{b}` / `{c}` substitutions |
| L-006 | `data/line/line_smooth.json` | Validate smooth line rendering | `series.smooth=true` | The line renders as a smoothed curve instead of straight segments |
| L-007 | `data/line/line_step.json` | Validate step-line rendering | `series.step` | The line renders as step transitions between categories |
| L-008 | `data/line/line_value_axis_pairs.json` | Validate numeric x-axis pairs | `xAxis.type=value`, `series.data=[[x,y],...]` | The line renders against a numeric x-axis using tuple point data |
| L-009 | `data/line/line_axis_grid_range_formatter.json` | Validate axis/grid styling, range, and formatter | `grid`, `axisLabel.formatter`, `axisLine`, `splitLine`, `yAxis.min/max` | The line chart respects axis labels, grid styling, and explicit y-axis bounds |
| L-010 | `data/line/line_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode` | Lines render from 2D tabular dataset input with header row |
| L-011 | `data/line/line_null_gap.json` | Validate null-point gaps | `series.data` with `null` | The line breaks at null points instead of connecting across them |
| L-012 | `data/line/line_connect_nulls.json` | Validate `connectNulls` behavior | `series.connectNulls=true`, `series.data` with `null` | The line connects adjacent non-null points while skipping missing values |
| L-013 | `data/line/line_show_symbol_hidden.json` | Validate hidden point markers | `series.showSymbol=false` | The line renders without per-point markers while preserving the line path |
| L-014 | `data/line/line_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Line series render normally while the legend is omitted |
| L-015 | `data/line/line_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | The legend renders as a right-aligned vertical stack without overlapping the line plot |
| L-016 | `data/line/line_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The legend renders below the plot as a centered horizontal row |
| L-017 | `data/line/line_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Line series consume colors from the global palette in series order without per-series overrides |
| L-018 | `data/line/line_background_color.json` | Validate chart background color | `backgroundColor` | Line chart renders with the configured non-default background color |
| L-019 | `data/line/line_style_config.json` | Validate style-config override flow | `--style-config`, layered base/chart style configs | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/line_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
