# Chart Config

This directory stores helper-schema config presets for each chart type.

These files are not raw ECharts style fragments. They are helper-facing configs consumed by the shared helper option builder, which then produces the final ECharts option used by both helper preview and skill rendering.

## Files

- `line_style.json`
- `bar_style.json`
- `pie_style.json`
- `gauge_style.json`
- `area_style.json`
- `dual_axis_style.json`
- `scatter_style.json`
- `radar_style.json`
- `funnel_style.json`

## Usage

```bash
node skills/data-charts-visualization/scripts/cli.js render \
  --chart-type line \
  --style-config skills/data-charts-visualization/config/line_style.json \
  --option /tmp/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/manual/manual_line_chart_styled.png
```

Default demo data should come from:

- `skills-helpler/data-charts-visualization/shared/charts-default-data.js`
