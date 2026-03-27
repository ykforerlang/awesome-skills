# Pie And Donut Chart Test Cases

This document describes the focused pie-chart and donut-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| PIE-001 | `data/pie/pie_basic.json` | Validate a basic pie chart | `series[0].type=pie` | A standard pie chart renders with legend and labels |
| PIE-002 | `data/pie/donut_basic.json` | Validate donut rendering | `series[0].radius=[inner,outer]` | A donut chart renders with a visible inner hole |
| PIE-003 | `data/pie/pie_custom_colors.json` | Validate custom slice colors | `series[].data[].itemStyle.color` | Each slice renders with the configured color |
| PIE-004 | `data/pie/pie_outside_labels.json` | Validate outside labels and formatter | `series[].label.position=outside` | Outside labels show formatted name and percentage |
| PIE-005 | `data/pie/pie_inside_labels.json` | Validate inside labels | `series[].label.position=inside` | Inside labels render within the slices |
| PIE-006 | `data/pie/pie_start_angle.json` | Validate start angle control | `series[].startAngle` | The pie layout rotates according to the configured angle |
| PIE-007 | `data/pie/pie_item_style_details.json` | Validate border and opacity styling | `itemStyle.borderColor`, `itemStyle.borderWidth`, `itemStyle.opacity` | Slices render with visible borders and transparency |
| PIE-008 | `data/pie/pie_multilingual.json` | Validate multilingual title and labels | multilingual `title`, `legend`, `data[].name` | Pie chart renders multilingual text correctly |
| PIE-009 | `data/pie/pie_dataset_encode.json` | Validate dataset + encode support | `dataset.source`, `series.encode.itemName/value` | Pie slices render from tabular dataset input |
| PIE-010 | `data/pie/pie_center_offset.json` | Validate center positioning | `series.center` | Pie chart renders away from the default center |
| PIE-011 | `data/pie/pie_selected_offset.json` | Validate selected slice offset | `data[].selected`, `series.selectedOffset` | Selected slices are visually offset from the pie |
| PIE-012 | `data/pie/pie_rose_radius.json` | Validate rose chart radius mode | `series.roseType=radius` | Slice radius varies by value, approximating ECharts rose charts |
| PIE-013 | `data/pie/pie_rose_area.json` | Validate rose chart area mode | `series.roseType=area` | Slice area varies by value, approximating ECharts rose charts in area mode |
| PIE-014 | `data/pie/pie_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Pie slices render normally while the legend is omitted |
| PIE-015 | `data/pie/pie_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | The legend renders below the pie as a centered horizontal row |
| PIE-016 | `data/pie/pie_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Pie slices consume colors from the global palette in data order |
| PIE-017 | `data/pie/pie_background_color.json` | Validate chart background color | `backgroundColor` | Pie chart renders with the configured non-default background color |
| PIE-018 | `data/pie/pie_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode.itemName/value` | Pie slices render from 2D tabular dataset input with header row |
| PIE-019 | `data/pie/pie_style_config.json` | Validate style-config override flow | `--style-config`, layered base/chart style configs | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/pie_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
