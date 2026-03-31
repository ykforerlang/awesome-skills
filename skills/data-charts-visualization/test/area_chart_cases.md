# Area Chart Test Cases

This document describes the focused area-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| A-001 | `data/area/area_basic.json` | Validate a basic area chart | `series[].areaStyle` | A single-series area chart renders with filled area |
| A-002 | `data/area/area_stacked.json` | Validate stacked area rendering | `series[].stack` | Stacked series accumulate vertically with filled layers |
| A-003 | `data/area/area_multi_series.json` | Validate multiple non-stacked area series | multiple `line` series with `areaStyle` | Multiple filled series render on the same axes |
| A-004 | `data/area/area_custom_style.json` | Validate custom colors, opacity, and line style | `lineStyle`, `areaStyle`, `symbol` | Area series render custom line/marker/fill styling |
| A-005 | `data/area/area_labels.json` | Validate point labels | `series[].label.show` | Numeric labels render at area points |
| A-006 | `data/area/area_dataset_encode.json` | Validate dataset + encode support | `dataset.source`, `series.encode` | Area chart renders from tabular dataset input |
| A-007 | `data/area/area_multilingual.json` | Validate multilingual title and legend | multilingual `title`, `legend`, `series[].name` | Area chart renders multilingual text correctly |
| A-008 | `data/area/area_axis_grid_style.json` | Validate axis and grid styling | `xAxis`, `yAxis`, `grid` | Area chart respects axis label, axis line, split line, and grid styling |
| A-009 | `data/area/area_smooth.json` | Validate smooth line rendering | `series[].smooth=true` | Area line is rendered as a smoothed curve with area fill |
| A-010 | `data/area/area_gradient_fill.json` | Validate gradient area fill | `areaStyle.color.type=linear` | Area fill uses a linear gradient similar to ECharts |
| A-011 | `data/area/area_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode` | Area chart renders from 2D tabular dataset input with header row |
| A-012 | `data/area/area_label_name_value_formatter.json` | Validate name/value label formatter | `series.label.formatter=\"{b}: {c}\"` | Area point labels render category name and value with ECharts-style placeholder substitution |
| A-013 | `data/area/area_null_gap.json` | Validate null-point gaps | `series.data` with `null` | Area line and fill break at null points instead of bridging them |
| A-014 | `data/area/area_connect_nulls.json` | Validate `connectNulls` behavior | `series.connectNulls=true`, `series.data` with `null` | Area line and fill connect adjacent non-null points while skipping missing values |
| A-015 | `data/area/area_show_symbol_hidden.json` | Validate hidden point markers | `series.showSymbol=false` | The area line renders without point markers while keeping the area fill |
| A-016 | `data/area/area_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Area series render normally while the legend is omitted |
| A-017 | `data/area/area_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | The legend renders as a right-aligned vertical stack without overlapping area fills |
| A-018 | `data/area/area_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The legend renders below the area plot as a centered horizontal row |
| A-019 | `data/area/area_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Area series consume colors from the global palette in series order for line and fill styling |
| A-020 | `data/area/area_background_color.json` | Validate chart background color | `backgroundColor` | Area chart renders with the configured non-default background color |
| A-021 | `data/area/area_style_config.json` | Validate style-config override flow | `--style-config`, single chart style config file | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/area_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
