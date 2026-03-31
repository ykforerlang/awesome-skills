# Gauge Chart Test Cases

This document describes the focused gauge-chart coverage cases used to validate the `data-charts-visualization` skill.

## Coverage Matrix

| Case ID | File | Goal | Key Fields | Expected Result |
| --- | --- | --- | --- | --- |
| G-001 | `data/gauge/gauge_basic.json` | Validate a basic gauge chart | `series[0].type=gauge` | A standard gauge renders with pointer and detail text |
| G-002 | `data/gauge/gauge_custom_range.json` | Validate custom min and max values | `series.min`, `series.max` | Gauge value is positioned against the configured range |
| G-003 | `data/gauge/gauge_custom_angles.json` | Validate start and end angle control | `series.startAngle`, `series.endAngle` | Gauge arc rotates to the configured angular range |
| G-004 | `data/gauge/gauge_progress_arc.json` | Validate progress arc rendering | `series.progress.show` | A progress arc overlays the base gauge band |
| G-005 | `data/gauge/gauge_ticks_and_labels.json` | Validate tick lines and axis labels | `splitLine`, `axisTick`, `axisLabel` | Gauge renders major ticks, minor ticks, and numeric labels |
| G-006 | `data/gauge/gauge_detail_and_title_style.json` | Validate title/detail styling and offset | `title`, `detail`, `offsetCenter` | Gauge title and detail render with configured style and position |
| G-007 | `data/gauge/gauge_multilingual.json` | Validate multilingual title and detail | multilingual `title`, `detail`, `data[].name` | Gauge renders multilingual text correctly |
| G-008 | `data/gauge/gauge_pointer_anchor_style.json` | Validate pointer and anchor styling | `pointer`, `anchor` | Pointer width/color and anchor styling are applied |
| G-009 | `data/gauge/gauge_center_radius.json` | Validate center and radius control | `series.center`, `series.radius` | Gauge renders shifted from center with resized radius |
| G-010 | `data/gauge/gauge_pointer_length_hidden.json` | Validate pointer visibility and length | `pointer.show`, `pointer.length` | Pointer can be hidden or shortened compared with default |
| G-011 | `data/gauge/gauge_detail_value_formatter.json` | Validate `{value}` formatter support | `detail.formatter`, `axisLabel.formatter` | Gauge detail and labels render with ECharts-style `{value}` substitutions |
| G-012 | `data/gauge/gauge_axis_label_distance.json` | Validate label/tick distance tuning | `axisLabel.distance`, `axisTick.distance`, `splitLine.distance` | Labels and ticks render with shifted radial distance |
| G-013 | `data/gauge/gauge_axisline_segments.json` | Validate segmented axis-line thresholds | `axisLine.lineStyle.color=[[threshold,color],...]` | Gauge renders distinct colored axis-line segments across configured thresholds |
| G-014 | `data/gauge/gauge_background_color.json` | Validate chart background color | `backgroundColor` | Gauge chart renders with the configured non-default background color |
| G-015 | `data/gauge/gauge_style_config.json` | Validate style-config override flow | `--style-config`, single chart style config file | Rendered output reflects style-config overrides over the input option |
| G-016 | `data/gauge/gauge_compact_layout.json` | Validate default gauge layout does not leave excessive top whitespace | default `startAngle`, `endAngle`, `center`, `radius` | Gauge arc occupies the expected top-oriented region and exports with balanced padding |

## Notes

- All cases use ECharts-aligned `option` JSON payloads.
- Outputs are static PNGs rendered through `scripts/gauge_chart.py`.
- These cases are intended for visual regression checks and implementation coverage checks.
