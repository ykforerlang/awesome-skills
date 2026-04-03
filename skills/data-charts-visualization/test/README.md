# Test Node

This directory is the retained test and regression workspace for `data-charts-visualization`.

## Layout

- `scripts/`: maintained validation scripts
- `images/`: generated preview matrix PNGs
- `data/`: generated raw/resolved option snapshots plus summary files
- `manifest.json`: index for the generated preview matrix

## Main Workflow

Generate the preview matrix:

```bash
node skills/data-charts-visualization/test/scripts/render_skill_preview_matrix.js
```

Manual render inputs should come from the shared helper defaults:

- `skills-helpler/data-charts-visualization/shared/charts-default-data.js`
- `skills-helpler/data-charts-visualization/shared/charts-default-config.js`
