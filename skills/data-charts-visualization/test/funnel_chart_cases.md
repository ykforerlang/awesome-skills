# Funnel Chart Test Cases

This document describes the focused funnel-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| FU-001 | `data/funnel/funnel_basic_descending.json` | Validate a basic descending funnel | `series.sort=descending`, `label.position=outside` | Funnel stages render from widest to narrowest with outside labels |
| FU-002 | `data/funnel/funnel_ascending.json` | Validate ascending funnel order | `series.sort=ascending` | Funnel stages render from narrowest to widest in ascending value order |
| FU-003 | `data/funnel/funnel_inside_labels.json` | Validate inside labels | `label.position=inside`, `label.color` | Funnel labels render inside each stage with the configured text style |
| FU-004 | `data/funnel/funnel_item_style_details.json` | Validate border and opacity styling | `itemStyle.borderColor`, `itemStyle.borderWidth`, `itemStyle.opacity` | Funnel stages render with visible borders and transparency |
| FU-005 | `data/funnel/funnel_dataset_encode_table.json` | Validate dataset table + encode support | `dataset.source=[[...header...], ...]`, `series.encode.itemName/value` | Funnel stages render from 2D tabular dataset input with header row |
| FU-006 | `data/funnel/funnel_dataset_encode_object.json` | Validate object-dataset encode support | object `dataset.source`, `series.encode.itemName/value` | Funnel stages render from object-array dataset input without inline `series.data` |
| FU-007 | `data/funnel/funnel_size_gap.json` | Validate min/max width and stage gap | `minSize`, `maxSize`, `gap` | Funnel stages respect configured minimum/maximum width and visible gaps between stages |
| FU-008 | `data/funnel/funnel_sort_none_preserve_order.json` | Validate original-order funnel rendering | `sort=none` | Funnel stages render in the same order as the input data instead of being resorted by value |
| FU-009 | `data/funnel/funnel_label_percent_formatter.json` | Validate percent label formatter | `label.formatter="{b}: {d}%"` | Funnel labels render ECharts-style percentage placeholders based on each stage value |
| FU-010 | `data/funnel/funnel_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Funnel stages render normally while the legend is omitted |
| FU-011 | `data/funnel/funnel_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | Funnel stage legends render as a right-aligned vertical stack beside the funnel body |
| FU-012 | `data/funnel/funnel_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | Funnel stage legends render below the funnel body as a centered horizontal row |
| FU-013 | `data/funnel/funnel_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Funnel stages consume colors from the global palette in rendered stage order |
| FU-014 | `data/funnel/funnel_background_color.json` | Validate chart background color | `backgroundColor` | Funnel chart renders with the configured non-default background color |
| FU-015 | `data/funnel/funnel_style_config.json` | Validate style-config override flow | `--style-config`, single chart style config file | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/funnel_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
