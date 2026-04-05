# Chart Config

This directory stores helper-schema config presets for each chart type.

These files are not raw ECharts style fragments. They are helper-facing configs consumed by the shared helper option builder, which then produces the final ECharts option used by both helper preview and skill rendering.
They should be treated as complete helper config payloads for CLI rendering, not as partial patches.

One-off render choices such as bar layout, stack mode, pie mode, or dual-axis type selection should not be stored here. Pass those through CLI `--variant` instead.

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
node skills-scripts/data-charts-visualization/dist/cli.js \
  --chart-type line \
  --config-file skills/data-charts-visualization/config/line_style.json \
  --data-file /tmp/line_basic_single_series.json \
  --out skills/data-charts-visualization/test/manual
```

Default demo data should come from:

- `skills-helpler/data-charts-visualization/shared/charts-default-data.js`
