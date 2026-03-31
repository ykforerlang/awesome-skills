# Scatter Chart Test Cases

This document describes the focused scatter-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| SC-001 | `data/scatter/scatter_basic_multi_series.json` | Validate multi-series scatter rendering | multiple `scatter` series, value axes | Distinct scatter groups render on shared numeric axes with legend entries |
| SC-002 | `data/scatter/scatter_bubble_sizes.json` | Validate bubble-size rendering | point `value=[x,y,size]`, per-point `itemStyle.color` | Point sizes and colors vary according to data-item configuration |
| SC-003 | `data/scatter/scatter_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode` | Scatter points render from 2D tabular dataset input with header row |
| SC-004 | `data/scatter/scatter_dataset_encode_multi_series_table.json` | Validate shared dataset multi-series support | shared `dataset.source`, multiple `series.encode.y` fields | Multiple scatter series render from one 2D tabular dataset with a shared numeric x field |
| SC-005 | `data/scatter/scatter_dataset_encode_multi_series_object.json` | Validate object-dataset multi-series support | object `dataset.source`, multiple `series.encode.y` fields | Multiple scatter series render from one object-array dataset with a shared numeric x field |
| SC-006 | `data/scatter/scatter_object_data_labels.json` | Validate object data and labels | `series.data[{name,value}]`, `label.formatter` | Scatter labels render using object names and ECharts-style formatter placeholders |
| SC-007 | `data/scatter/scatter_item_style_details.json` | Validate per-point border and opacity styling | per-point `itemStyle.borderColor`, `borderWidth`, `opacity` | Scatter points render distinct edge colors, edge widths, and transparency per item |
| SC-008 | `data/scatter/scatter_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Scatter series render normally while the legend is omitted |
| SC-009 | `data/scatter/scatter_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | The legend renders as a right-aligned vertical stack without overlapping scatter points |
| SC-010 | `data/scatter/scatter_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The legend renders below the scatter plot as a centered horizontal row |
| SC-011 | `data/scatter/scatter_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Scatter series consume colors from the global palette in series order |
| SC-012 | `data/scatter/scatter_background_color.json` | Validate chart background color | `backgroundColor` | Scatter chart renders with the configured non-default background color |
| SC-013 | `data/scatter/scatter_axis_grid_range_formatter.json` | Validate axis/grid styling and explicit range | `grid`, axis formatters, `min/max`, `splitLine` | Scatter chart respects axis labels, ranges, and grid styling on value axes |
| SC-014 | `data/scatter/scatter_style_config.json` | Validate style-config override flow | `--style-config`, single chart style config file | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/scatter_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
