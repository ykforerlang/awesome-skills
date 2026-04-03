#!/usr/bin/env node

"use strict";

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const SCRIPT_DIR = __dirname;
const TEST_DIR = path.resolve(SCRIPT_DIR, "..");
const SKILL_DIR = path.resolve(TEST_DIR, "..");
const REPO_ROOT = path.resolve(SKILL_DIR, "..", "..");
const HELPER_ROOT = path.join(REPO_ROOT, "skills-helpler", "data-charts-visualization");
const OUTPUT_DIR = TEST_DIR;
const IMAGE_DIR = path.join(OUTPUT_DIR, "images");
const DATA_DIR = path.join(OUTPUT_DIR, "data");

const { CHART_DEFINITIONS } = require(path.join(HELPER_ROOT, "mini-program", "lib", "schema.js"));
const optionBuilder = require(path.join(HELPER_ROOT, "shared", "option-builder.js"));
const defaultDataModule = require(path.join(HELPER_ROOT, "shared", "charts-default-data.js"));
const defaultConfigModule = require(path.join(HELPER_ROOT, "shared", "charts-default-config.js"));

const NODE = process.env.NODE || "node";
const CLI_SCRIPT = path.join(SKILL_DIR, "scripts", "cli.js");
const DEFAULT_LOCALE = "zh";
const EXPORT_WIDTH = String(650 / 160);
const EXPORT_HEIGHT = String(360 / 160);
const EXPORT_DPI = "160";
const PREVIEW_VIEWPORT = { width: 375, height: 375 / 1.8 };
const CHART_ORDER = ["line", "bar", "area", "dualAxis", "scatter", "pie"];
const SERIES_COUNT_OPTIONS = [1, 2, 5, 8];
const DUAL_AXIS_COUNT_OPTIONS = [1, 2, 4];
const PIE_MODE_OPTIONS = ["pie", "donut", "roseArea", "roseRadius"];

function deepClone(value) {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function toKebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function buildVariantSummary(artifacts) {
  const rawSeries = Array.isArray(artifacts.rawOption && artifacts.rawOption.series) ? artifacts.rawOption.series : [];
  const resolvedSeries = Array.isArray(artifacts.resolvedOption && artifacts.resolvedOption.series)
    ? artifacts.resolvedOption.series
    : [];
  return {
    rawSeriesCount: rawSeries.length,
    resolvedSeriesCount: resolvedSeries.length,
    rawSeriesNames: rawSeries.map((series) => series && series.name).filter(Boolean),
    resolvedSeriesNames: resolvedSeries.map((series) => series && series.name).filter(Boolean),
    resolvedBarWidths: resolvedSeries
      .map((series) => (series && Object.prototype.hasOwnProperty.call(series, "barWidth") ? series.barWidth : null))
      .filter((barWidth) => barWidth !== null),
  };
}

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

function buildPreviewCases(chartType) {
  switch (chartType) {
    case "line":
    case "scatter":
      return SERIES_COUNT_OPTIONS.map((count) => ({
        variantId: `series-${count}`,
        previewState: { previewSeriesCount: count },
      }));
    case "bar": {
      const cases = [];
      for (const count of SERIES_COUNT_OPTIONS) {
        for (const horizontal of [false, true]) {
          for (const stacked of [false, true]) {
            cases.push({
              variantId: [
                `series-${count}`,
                horizontal ? "horizontal" : "vertical",
                stacked ? "stacked" : "normal",
              ].join("-"),
              previewState: {
                previewSeriesCount: count,
                previewBarHorizontal: horizontal,
                previewStackMode: stacked,
              },
            });
          }
        }
      }
      return cases;
    }
    case "area": {
      const cases = [];
      for (const count of SERIES_COUNT_OPTIONS) {
        for (const stacked of [false, true]) {
          cases.push({
            variantId: [`series-${count}`, stacked ? "stacked" : "normal"].join("-"),
            previewState: {
              previewSeriesCount: count,
              previewStackMode: stacked,
            },
          });
        }
      }
      return cases;
    }
    case "pie":
      return PIE_MODE_OPTIONS.map((mode) => ({
        variantId: toKebabCase(mode),
        previewState: { previewPieMode: mode },
      }));
    case "dualAxis": {
      const cases = [];
      for (const leftCount of DUAL_AXIS_COUNT_OPTIONS) {
        for (const rightCount of DUAL_AXIS_COUNT_OPTIONS) {
          for (const leftType of ["bar", "line"]) {
            for (const rightType of ["bar", "line"]) {
              cases.push({
                variantId: [`left-${leftCount}-${leftType}`, `right-${rightCount}-${rightType}`].join("_"),
                previewState: {
                  previewDualAxisLeftSeriesCount: leftCount,
                  previewDualAxisRightSeriesCount: rightCount,
                  dualAxisPreviewLeftType: leftType,
                  dualAxisPreviewRightType: rightType,
                },
              });
            }
          }
        }
      }
      return cases;
    }
    default:
      return [];
  }
}

async function withTempJson(payload, callback) {
  const tempPath = path.join(
    os.tmpdir(),
    `skill-preview-matrix-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );
  await fs.writeFile(tempPath, `${JSON.stringify(payload)}\n`, "utf-8");
  try {
    return await callback(tempPath);
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}

async function renderVariant(chartType, entry) {
  const definition = CHART_DEFINITIONS[chartType];
  if (!definition) {
    throw new Error(`Unsupported chart type: ${chartType}`);
  }

  const commonState = defaultConfigModule.getDefaultCommonState(chartType, DEFAULT_LOCALE);
  const specificState = defaultConfigModule.getDefaultSpecificState(chartType);
  const previewState = {
    ...defaultConfigModule.getDefaultPreviewState(chartType),
    ...deepClone(entry.previewState || {}),
  };
  const rawData = defaultDataModule.getDefaultRawData(chartType);

  const artifacts = optionBuilder.buildChartArtifacts({
    chartType,
    definition,
    commonState,
    specificState,
    rawData,
    previewState,
    previewViewportSize: PREVIEW_VIEWPORT,
  });

  const imageChartDir = path.join(IMAGE_DIR, chartType);
  const dataChartDir = path.join(DATA_DIR, chartType);
  const outputPath = path.join(imageChartDir, `${entry.variantId}.png`);
  const resolvedOptionPath = path.join(dataChartDir, `${entry.variantId}.resolved-option.json`);
  const rawOptionPath = path.join(dataChartDir, `${entry.variantId}.raw-option.json`);
  const summaryPath = path.join(dataChartDir, `${entry.variantId}.summary.json`);
  await fs.mkdir(imageChartDir, { recursive: true });
  await fs.mkdir(dataChartDir, { recursive: true });
  await fs.writeFile(resolvedOptionPath, `${JSON.stringify(artifacts.resolvedOption, null, 2)}\n`, "utf-8");
  await fs.writeFile(rawOptionPath, `${JSON.stringify(artifacts.rawOption, null, 2)}\n`, "utf-8");
  const summary = buildVariantSummary(artifacts);
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");

  await withTempJson(artifacts.resolvedOption, async (optionPath) => {
    execFileSync(
      NODE,
      [
        CLI_SCRIPT,
        "render",
        "--chart-type",
        chartType,
        "--option",
        optionPath,
        "--resolved-option",
        "--output",
        outputPath,
        "--width",
        EXPORT_WIDTH,
        "--height",
        EXPORT_HEIGHT,
        "--dpi",
        EXPORT_DPI,
      ],
      { cwd: REPO_ROOT, stdio: "inherit" },
    );
  });

  return {
    chartType,
    variantId: entry.variantId,
    previewState,
    summary,
    outputFile: path.relative(SKILL_DIR, outputPath),
    rawOptionFile: path.relative(SKILL_DIR, rawOptionPath),
    resolvedOptionFile: path.relative(SKILL_DIR, resolvedOptionPath),
    summaryFile: path.relative(SKILL_DIR, summaryPath),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedChartTypes = args.chartTypes.length
    ? CHART_ORDER.filter((chartType) => args.chartTypes.includes(chartType))
    : CHART_ORDER.slice();

  if (!selectedChartTypes.length) {
    throw new Error("No chart types selected.");
  }

  await fs.rm(IMAGE_DIR, { recursive: true, force: true });
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  await fs.rm(path.join(OUTPUT_DIR, "manifest.json"), { force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = [];
  for (const chartType of selectedChartTypes) {
    const previewCases = buildPreviewCases(chartType);
    for (const entry of previewCases) {
      manifest.push(await renderVariant(chartType, entry));
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  console.log(`Rendered ${manifest.length} chart previews into ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
