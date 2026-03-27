# Bar Chart Test Cases

This document describes the focused bar-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| BAR-001 | `data/bar/bar_basic_single_group.json` | Validate a basic single-series bar chart | `series[0].type=bar` | One bar series renders with correct categories and legend |
| BAR-002 | `data/bar/bar_stacked.json` | Validate stacked bars | `series[].stack` | Bars in the same stack accumulate vertically |
| BAR-003 | `data/bar/bar_grouped_multi_series.json` | Validate grouped multi-series bars | multiple `bar` series without `stack` | Multiple bar groups render side by side per category |
| BAR-004 | `data/bar/bar_custom_colors.json` | Validate custom bar colors | `series[].data[].itemStyle.color` | Individual bars render with their configured colors |
| BAR-005 | `data/bar/bar_custom_width.json` | Validate custom bar width | `series[].barWidth` | Rendered bars use the configured width |
| BAR-006 | `data/bar/bar_gap_spacing.json` | Validate inter-bar gap control | `series[].barGap` | Gap between grouped bars changes according to the configured spacing |
| BAR-007 | `data/bar/bar_top_labels.json` | Validate top number labels | `series[].label.show` | Numeric labels render above each bar |
| BAR-008 | `data/bar/bar_horizontal.json` | Validate horizontal bars | `xAxis.type=value`, `yAxis.type=category` | Bars render horizontally with category labels on the y-axis |
| BAR-009 | `data/bar/bar_negative_values.json` | Validate mixed positive and negative values | negative numbers in `series[].data` | Bars extend in both positive and negative directions correctly |
| BAR-010 | `data/bar/bar_dataset_encode.json` | Validate dataset + encode support | `dataset.source`, `series.encode` | Bars render from tabular dataset input without direct `series.data` |
| BAR-011 | `data/bar/bar_stacked_with_labels.json` | Validate stacked bars with labels | `series[].stack`, `series[].label.show` | Stacked bars render with visible per-segment labels |
| BAR-012 | `data/bar/bar_item_style_details.json` | Validate border and opacity styling | `itemStyle.borderColor`, `itemStyle.borderWidth`, `itemStyle.opacity` | Bars render with visible borders and opacity styling |
| BAR-013 | `data/bar/bar_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode` | Bars render from 2D tabular dataset input with header row |
| BAR-014 | `data/bar/bar_dataset_encode_multi_series_table.json` | Validate multi-series dataset table support | shared `dataset.source` with multiple `series.encode.y` fields | Grouped bars render from one 2D tabular dataset with one category field and multiple metrics |
| BAR-015 | `data/bar/bar_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Bar series render normally while the legend is omitted |
| BAR-016 | `data/bar/bar_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | The legend renders as a right-aligned vertical stack without overlapping grouped bars |
| BAR-017 | `data/bar/bar_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The legend renders below grouped bars as a centered horizontal row |
| BAR-018 | `data/bar/bar_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Grouped bar series consume colors from the global palette in series order |
| BAR-019 | `data/bar/bar_background_color.json` | Validate chart background color | `backgroundColor` | Bar chart renders with the configured non-default background color |
| BAR-020 | `data/bar/bar_style_config.json` | Validate style-config override flow | `--style-config`, layered base/chart style configs | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/bar_chart.py`.
- The test cases are intended for visual regression checks and implementation coverage checks.
