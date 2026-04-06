#!/usr/bin/env node

"use strict";

const fs = require("fs/promises");
const path = require("path");

const SCRIPT_DIR = __dirname;
const HELPER_ROOT = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(HELPER_ROOT, "..", "..");
const SKILL_CONFIG_DIR = path.join(REPO_ROOT, "skills", "data-charts-visualization", "config");

const defaultConfigModule = require(path.join(HELPER_ROOT, "shared", "charts-default-config.js"));

const DEFAULT_LOCALE = "zh";
const CHART_ORDER = ["line", "bar", "pie", "gauge", "area", "dualAxis", "scatter", "radar", "funnel"];
const OUTPUT_FILE_NAMES = {
  line: "line_style.json",
  bar: "bar_style.json",
  pie: "pie_style.json",
  gauge: "gauge_style.json",
  area: "area_style.json",
  dualAxis: "dual_axis_style.json",
  scatter: "scatter_style.json",
  radar: "radar_style.json",
  funnel: "funnel_style.json",
};

function parseArgs(argv) {
  const args = {
    chartTypes: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--chart-type":
        args.chartTypes.push(argv[index + 1]);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function buildMeta(chartType) {
  const meta = {
    source: "skills-helpler/data-charts-visualization/shared/charts-default-config.js",
    exportedBy: "skills-helpler/data-charts-visualization/scripts/export_default_configs.js",
    chartType,
    exportedAt: new Date().toISOString(),
    note: chartType === "dualAxis"
      ? "Default dual-axis helper config exported from shared defaults."
      : "Default helper config exported from shared defaults.",
  };

  if (chartType === "dualAxis") {
    meta.combo = "bar-line";
  }

  return meta;
}

async function exportConfig(chartType) {
  const outputName = OUTPUT_FILE_NAMES[chartType];
  if (!outputName) {
    throw new Error(`Unsupported chart type: ${chartType}`);
  }

  const helperConfig = defaultConfigModule.getDefaultHelperConfig(chartType, DEFAULT_LOCALE);
  const payload = {
    _meta: buildMeta(chartType),
    ...helperConfig,
  };
  const outputPath = path.join(SKILL_CONFIG_DIR, outputName);
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const chartTypes = args.chartTypes.length
    ? CHART_ORDER.filter((chartType) => args.chartTypes.includes(chartType))
    : CHART_ORDER.slice();

  if (!chartTypes.length) {
    throw new Error("No chart types selected.");
  }

  await fs.mkdir(SKILL_CONFIG_DIR, { recursive: true });
  for (const chartType of chartTypes) {
    const outputPath = await exportConfig(chartType);
    console.log(`Wrote ${path.relative(REPO_ROOT, outputPath)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
