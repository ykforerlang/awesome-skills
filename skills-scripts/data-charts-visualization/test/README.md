# Test Node

This directory is the retained test and regression workspace for `data-charts-visualization`.

## Layout

- `../scripts/`: maintained build and validation scripts
- `images/`: generated preview matrix PNGs
- `manifest.json`: index for the generated preview matrix

## Main Workflow

Generate the preview matrix:

```bash
node skills-scripts/data-charts-visualization/scripts/render_cli_preview_matrix.js
```

The preview matrix uses shared helper defaults as its test inputs:

- `skills-helpler/data-charts-visualization/shared/charts-default-data.js`
- `skills-helpler/data-charts-visualization/shared/charts-default-config.js`

Title copy belongs to the shared default data, not the shared default config.

The test is intentionally black-box:

- it only invokes the packaged CLI
- it only asserts successful rendering and records the generated image paths in `manifest.json`

Manual CLI rendering still requires an explicit helper config, either through `--config` or `--config-file`.
Use `--data` for inline JSON and `--data-file` for file input.
One-off render strategy should go through CLI `--variant`, not through config files.
For dual-axis charts, horizontal layout and left/right series typing should go through `--variant`.
Dual-axis horizontal split-line side belongs to persisted config through `common.splitLines.horizontal.display`. Set `common.splitLines.horizontal.show` to `false` when you want no horizontal split line.

Example repo-local invocation with a skill config file:

```bash
npx --yes --package ./skills-scripts/data-charts-visualization areslabs-data-charts \
  --chart-type line \
  --config-file skills/data-charts-visualization/config/line_style.json \
  --data-file /tmp/line_basic_single_series.json \
  --out skills-scripts/data-charts-visualization/test/manual
```
