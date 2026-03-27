# Chart Style Config

This directory contains style-oriented chart configuration presets for this skill.

These files are not demo data files. They are ECharts-aligned style config fragments that define how charts should look:
- palette
- background
- title style
- legend style
- grid spacing
- axis appearance
- label style
- series line/bar/area styling
- pie / donut label and radius styling
- gauge band / detail styling
- dual-axis layout styling
- scatter point styling
- radar polygon / indicator styling
- funnel stage styling

## Files

- `base_style.json`: common chart look-and-feel
- `line_style.json`: line-chart style config
- `bar_style.json`: bar-chart style config
- `pie_style.json`: pie / donut style config
- `gauge_style.json`: gauge style config
- `area_style.json`: area-chart style config
- `dual_axis_style.json`: dual-axis style config
- `scatter_style.json`: scatter-chart style config
- `radar_style.json`: radar-chart style config
- `funnel_style.json`: funnel-chart style config

## Usage

1. Pick the closest style preset.
2. Pass it with `--style-config`.
3. Add real `dataset`, `xAxis.data`, or `series[].data` separately.
4. Render with the chart script.

Priority rule:
- input `option` provides chart data and base structure
- style config provides persistent appearance
- overlapping fields are overridden by the style config

Recommended layering from low priority to high priority:
1. `base_style.json`
2. chart style such as `line_style.json`

Example:

```bash
python3 skills/data-charts-visualization/scripts/line_chart.py \
  --style-config skills/data-charts-visualization/config/base_style.json \
  --style-config skills/data-charts-visualization/config/line_style.json \
  --option skills/data-charts-visualization/test/data/line/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/out/manual_line_chart_styled.png
```

Update the shared base style:

```bash
python3 skills/data-charts-visualization/scripts/update_style_config.py \
  --chart-type base \
  --instruction "title size 24, legend at bottom, warm palette"
```

Update a chart-specific style config:

```bash
python3 skills/data-charts-visualization/scripts/update_style_config.py \
  --chart-type line \
  --instruction "line width 3, show labels"
```

Update a persistent config with explicit overrides:

```bash
python3 skills/data-charts-visualization/scripts/update_style_config.py \
  --config skills/data-charts-visualization/config/base_style.json \
  --set title.textStyle.fontSize=24 \
  --set legend.top=bottom
```

The config shape stays close to ECharts, but these files intentionally avoid business/demo data values.
The renderer still produces one resolved final option internally, but `--style-config` exists so user style can be edited and persisted independently from incoming chart data.
Use `--chart-type` for normal updates and `--config` when an exact target file must be chosen.
