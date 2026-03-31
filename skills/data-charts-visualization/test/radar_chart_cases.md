# Radar Chart Test Cases

This document describes the focused radar-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| RA-001 | `data/radar/radar_basic_single_series.json` | Validate a basic radar chart | `radar.indicator`, one `radar` series item | A single radar polygon renders against the configured indicators |
| RA-002 | `data/radar/radar_multi_series.json` | Validate comparative radar rendering | `series[].data` with multiple named items | Multiple radar polygons render together with separate legend entries |
| RA-003 | `data/radar/radar_circle_shape.json` | Validate circle radar shape and custom indicator ranges | `radar.shape=circle`, `indicator[].min/max`, `splitNumber` | The radar grid renders as concentric circles and values respect the configured ranges |
| RA-004 | `data/radar/radar_custom_style_labels.json` | Validate radar series styling and labels | `lineStyle`, `areaStyle`, `symbol`, `label.show` | Radar polygons render with custom line/fill/marker styling and visible value labels |
| RA-005 | `data/radar/radar_split_area_axis_name_style.json` | Validate radar split-area and axis-name styling | `splitArea`, `axisName`, `splitLine`, `axisLine` | Radar grid renders alternating filled bands and styled indicator names/axes |
| RA-006 | `data/radar/radar_show_symbol_hidden.json` | Validate hidden radar markers | `series.showSymbol=false` | Radar polygons render without point markers while preserving line and fill |
| RA-007 | `data/radar/radar_legend_hidden.json` | Validate hidden legend behavior | `legend.show=false` | Radar polygons render normally while the legend is omitted |
| RA-008 | `data/radar/radar_legend_vertical_right.json` | Validate right-side vertical legend layout | `legend.left=right`, `legend.orient=vertical` | Radar item legends render as a right-aligned vertical stack beside the grid |
| RA-009 | `data/radar/radar_legend_bottom_center.json` | Validate bottom-centered horizontal legend layout | `legend.top=bottom`, `legend.left=center`, `legend.orient=horizontal` | Radar item legends render below the grid as a centered horizontal row |
| RA-010 | `data/radar/radar_global_palette.json` | Validate global palette assignment | top-level `color=[...]` | Radar items consume colors from the global palette in data order |
| RA-011 | `data/radar/radar_background_color.json` | Validate chart background color | `backgroundColor` | Radar chart renders with the configured non-default background color |
| RA-012 | `data/radar/radar_style_config.json` | Validate style-config override flow | `--style-config`, single chart style config file | Rendered output reflects style-config overrides over the input option |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/radar_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
