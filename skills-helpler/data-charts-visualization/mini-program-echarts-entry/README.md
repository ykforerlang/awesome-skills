# Mini Program ECharts Entry

This target owns the custom ECharts bundle used by:

- `skills-helpler/data-charts-visualization/mini-program/ec-canvas/echarts.js`

It is intentionally separate from the CLI package under `skills-scripts/data-charts-visualization`.

## Files

- `mini_program_echarts_entry.ts`: the tree-shaken ECharts entry
- `build.mjs`: esbuild script that writes the bundle into the mini-program workspace
- `tsconfig.json`: local editor/typecheck config

## Commands

Install dependencies:

```bash
npm install
```

Type-check the entry:

```bash
npm run typecheck
```

Rebuild the mini-program ECharts bundle:

```bash
npm run build
```

The build output is written to:

```text
skills-helpler/data-charts-visualization/mini-program/ec-canvas/echarts.js
```
