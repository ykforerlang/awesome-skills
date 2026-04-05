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

const { CHART_RUNTIME_DEFINITIONS } = require(path.join(HELPER_ROOT, "shared", "chart-runtime-definitions.js"));
const optionBuilder = require(path.join(HELPER_ROOT, "shared", "option-builder.js"));
const defaultDataModule = require(path.join(HELPER_ROOT, "shared", "charts-default-data.js"));
const defaultConfigModule = require(path.join(HELPER_ROOT, "shared", "charts-default-config.js"));

const NODE = process.env.NODE || "node";
const CLI_SCRIPT = path.join(REPO_ROOT, "skills-scripts", "data-charts-visualization", "dist", "cli.js");
const CONFIG_DIR = path.join(SKILL_DIR, "config");
const DEFAULT_LOCALE = "zh";
const EXPORT_WIDTH = "650";
const EXPORT_HEIGHT = "360";
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
        dataSelection: { seriesCount: count },
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
                dataSelection: { seriesCount: count },
                variant: {
                  layout: horizontal ? "horizontal" : "vertical",
                  stack: stacked,
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
            dataSelection: { seriesCount: count },
            variant: {
              stack: stacked,
            },
          });
        }
      }
      return cases;
    }
    case "pie":
      return PIE_MODE_OPTIONS.map((mode) => ({
        variantId: toKebabCase(mode),
        variant: { pieMode: mode },
      }));
    case "dualAxis": {
      const cases = [];
      for (const leftCount of DUAL_AXIS_COUNT_OPTIONS) {
        for (const rightCount of DUAL_AXIS_COUNT_OPTIONS) {
          for (const leftType of ["bar", "line"]) {
            for (const rightType of ["bar", "line"]) {
              cases.push({
                variantId: [`left-${leftCount}-${leftType}`, `right-${rightCount}-${rightType}`].join("_"),
                dataSelection: {
                  leftSeriesCount: leftCount,
                  rightSeriesCount: rightCount,
                },
                variant: {
                  leftSeriesType: leftType,
                  rightSeriesType: rightType,
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

function trimSeriesList(series, count) {
  if (!Array.isArray(series) || !Number.isFinite(count) || count <= 0) {
    return Array.isArray(series) ? deepClone(series) : [];
  }
  return deepClone(series.slice(0, count));
}

function resolveDualAxisSide(series, index) {
  if (series && typeof series.yAxisIndex === "number") {
    return series.yAxisIndex === 1 ? "right" : "left";
  }
  return index % 2 === 0 ? "left" : "right";
}

function applyDataSelection(chartType, rawData, dataSelection) {
  const nextRawData = deepClone(rawData);
  if (!dataSelection) {
    return nextRawData;
  }

  if ("seriesCount" in dataSelection) {
    nextRawData.series = trimSeriesList(nextRawData.series, Number(dataSelection.seriesCount));
  }

  if (chartType === "dualAxis" && Array.isArray(nextRawData.series)) {
    const leftLimit = Number(dataSelection.leftSeriesCount) || 0;
    const rightLimit = Number(dataSelection.rightSeriesCount) || 0;
    if (leftLimit > 0 || rightLimit > 0) {
      const counters = { left: 0, right: 0 };
      nextRawData.series = deepClone(nextRawData.series.filter((series, index) => {
        const side = resolveDualAxisSide(series, index);
        const limit = side === "left" ? leftLimit : rightLimit;
        if (limit > 0 && counters[side] >= limit) {
          return false;
        }
        counters[side] += 1;
        return true;
      }));
    }
  }

  return nextRawData;
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
  if (!CHART_RUNTIME_DEFINITIONS[chartType]) {
    throw new Error(`Unsupported chart type: ${chartType}`);
  }

  const commonState = defaultConfigModule.getDefaultCommonState(chartType, DEFAULT_LOCALE);
  const specificState = defaultConfigModule.getDefaultSpecificState(chartType);
  const previewState = {
    ...defaultConfigModule.getDefaultPreviewState(chartType),
    ...(function buildPreviewStateFromVariant(variant) {
      if (!variant) {
        return {};
      }
      const nextState = {};
      if ("stack" in variant) nextState.previewStackMode = Boolean(variant.stack);
      if ("pieMode" in variant) nextState.previewPieMode = variant.pieMode;
      if ("layout" in variant) nextState.previewBarHorizontal = variant.layout === "horizontal";
      return nextState;
    })(deepClone(entry.variant || {})),
  };
  const rawData = applyDataSelection(
    chartType,
    defaultDataModule.getDefaultRawData(chartType),
    entry.dataSelection || null,
  );
  const helperConfigPath = path.join(CONFIG_DIR, CHART_RUNTIME_DEFINITIONS[chartType].styleFile);
  const helperConfig = JSON.parse(await fs.readFile(helperConfigPath, "utf-8"));

  const artifacts = optionBuilder.buildChartArtifacts({
    chartType,
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

  await withTempJson(rawData, async (dataPath) => {
    await withTempJson(helperConfig, async (configPath) => {
      execFileSync(
        NODE,
        [
          CLI_SCRIPT,
          "--chart-type",
          chartType,
          "--data-file",
          dataPath,
          "--config-file",
          configPath,
          "--variant",
          JSON.stringify(entry.variant || {}),
          "--out",
          outputPath,
          "--width",
          EXPORT_WIDTH,
          "--height",
          EXPORT_HEIGHT,
        ],
        { cwd: REPO_ROOT, stdio: "inherit" },
      );
    });
  });

  return {
    chartType,
    variantId: entry.variantId,
    dataSelection: entry.dataSelection || {},
    variant: entry.variant || {},
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
