#!/usr/bin/env node

"use strict";

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const SCRIPT_DIR = __dirname;
const PACKAGE_DIR = path.resolve(SCRIPT_DIR, "..");
const TEST_DIR = path.join(PACKAGE_DIR, "test");
const REPO_ROOT = path.resolve(PACKAGE_DIR, "..", "..");
const HELPER_ROOT = path.join(REPO_ROOT, "skills-helpler", "data-charts-visualization");
const OUTPUT_DIR = TEST_DIR;
const IMAGE_DIR = path.join(OUTPUT_DIR, "images");
const DATA_DIR = path.join(OUTPUT_DIR, "data");

const { CHART_RUNTIME_DEFINITIONS } = require(path.join(HELPER_ROOT, "shared", "chart-runtime-definitions.js"));
const defaultDataModule = require(path.join(HELPER_ROOT, "shared", "charts-default-data.js"));
const defaultConfigModule = require(path.join(HELPER_ROOT, "shared", "charts-default-config.js"));
const optionBuilder = require(path.join(HELPER_ROOT, "shared", "option-builder.js"));

const NODE = process.env.NODE || "node";
const CLI_SCRIPT = path.join(PACKAGE_DIR, "dist", "cli.js");
const DEFAULT_LOCALE = "zh";
const EXPORT_WIDTH = "650";
const EXPORT_HEIGHT = "360";
const CHART_ORDER = ["line", "bar", "area", "dualAxis", "scatter", "pie", "gauge", "radar", "funnel"];
const SERIES_COUNT_OPTIONS = [1, 2, 5, 8];
const DUAL_AXIS_COUNT_OPTIONS = [1, 2, 4];
const PIE_MODE_OPTIONS = ["pie", "donut", "roseArea", "roseRadius"];

function deepClone(value) {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, patch) {
  if (patch === undefined) {
    return deepClone(base);
  }
  if (base === undefined) {
    return deepClone(patch);
  }
  if (Array.isArray(base) && Array.isArray(patch)) {
    return deepClone(patch);
  }
  if (isObject(base) && isObject(patch)) {
    const result = deepClone(base);
    Object.keys(patch).forEach((key) => {
      result[key] = key in result ? deepMerge(result[key], patch[key]) : deepClone(patch[key]);
    });
    return result;
  }
  return deepClone(patch);
}

function toKebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
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

function buildDefaultPreviewState() {
  return {
    previewStackMode: false,
    previewBarHorizontal: false,
    previewPieMode: "donut"
  };
}

function buildPreviewStateFromVariant(variant) {
  if (!variant || !isObject(variant)) {
    return {};
  }

  const previewState = {};
  if ("stack" in variant) previewState.previewStackMode = Boolean(variant.stack);
  if ("pieMode" in variant) previewState.previewPieMode = variant.pieMode;

  if ("layout" in variant) {
    const layout = String(variant.layout).trim().toLowerCase();
    if (layout === "horizontal") previewState.previewBarHorizontal = true;
    if (layout === "vertical") previewState.previewBarHorizontal = false;
  }

  return previewState;
}

function buildDualAxisTypesFromVariant(variant) {
  if (!variant || !isObject(variant)) {
    return undefined;
  }

  const dualAxisTypes = {};
  if ("leftSeriesType" in variant) dualAxisTypes.leftType = variant.leftSeriesType;
  if ("rightSeriesType" in variant) dualAxisTypes.rightType = variant.rightSeriesType;
  return Object.keys(dualAxisTypes).length ? dualAxisTypes : undefined;
}

function buildDualAxisLayoutOverridesFromVariant(variant) {
  if (!variant || !isObject(variant)) {
    return undefined;
  }

  const overrides = {};
  if ("layout" in variant) {
    const layout = String(variant.layout).trim().toLowerCase();
    if (layout === "horizontal") overrides.horizontal = true;
    if (layout === "vertical") overrides.horizontal = false;
  }

  return Object.keys(overrides).length ? overrides : undefined;
}

function buildPreviewCases(chartType) {
  switch (chartType) {
    case "line":
      return [
        ...SERIES_COUNT_OPTIONS.map((count) => ({
          variantId: `series-${count}`,
          dataSelection: { seriesCount: count },
        })),
        {
          variantId: "title-from-data",
          dataSelection: { seriesCount: 2 },
          dataPatch: {
            title: {
              text: "Revenue Trend",
              subtext: "Generated from test data"
            }
          }
        }
      ];
    case "scatter":
      return [
        ...SERIES_COUNT_OPTIONS.map((count) => ({
          variantId: `series-${count}`,
          dataSelection: { seriesCount: count },
        })),
        {
          variantId: "label-formatter",
          dataSelection: { seriesCount: 2 },
          configPatch: {
            specific: {
              dataLabels: {
                show: true,
                formatter: "{a}: ({c})"
              }
            }
          }
        }
      ];
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
      cases.push({
        variantId: "default-types_vertical",
        dataSelection: {
          leftSeriesCount: 1,
          rightSeriesCount: 1,
        },
        variant: {
          layout: "vertical",
        },
      });
      cases.push({
        variantId: "split-right_vertical",
        dataSelection: {
          leftSeriesCount: 1,
          rightSeriesCount: 1,
        },
        variant: {
          layout: "vertical",
        },
        configPatch: {
          common: {
            splitLines: {
              horizontal: {
                display: "right"
              }
            }
          }
        }
      });
      cases.push({
        variantId: "split-none_vertical",
        dataSelection: {
          leftSeriesCount: 1,
          rightSeriesCount: 1,
        },
        variant: {
          layout: "vertical",
        },
        configPatch: {
          common: {
            splitLines: {
              horizontal: {
                show: false
              }
            }
          }
        }
      });
      for (const leftCount of DUAL_AXIS_COUNT_OPTIONS) {
        for (const rightCount of DUAL_AXIS_COUNT_OPTIONS) {
          for (const leftType of ["bar", "line"]) {
            for (const rightType of ["bar", "line"]) {
              for (const layout of ["vertical", "horizontal"]) {
                cases.push({
                  variantId: [`left-${leftCount}-${leftType}`, `right-${rightCount}-${rightType}`, layout].join("_"),
                  dataSelection: {
                    leftSeriesCount: leftCount,
                    rightSeriesCount: rightCount,
                  },
                  variant: {
                    layout,
                    leftSeriesType: leftType,
                    rightSeriesType: rightType,
                  },
                });
              }
            }
          }
        }
      }
      return cases;
    }
    case "gauge":
      return [
        {
          variantId: "default",
        },
      ];
    case "radar":
      return [
        {
          variantId: "default",
        },
        {
          variantId: "multi-series",
          dataPatch: {
            series: [
              {
                name: "Team A",
                type: "radar",
                data: [
                  { name: "Team A", value: [90, 82, 70, 88, 91] },
                ],
              },
              {
                name: "Team B",
                type: "radar",
                data: [
                  { name: "Team B", value: [76, 90, 82, 72, 84] },
                ],
              },
            ],
          },
        },
      ];
    case "funnel":
      return [
        {
          variantId: "default",
        },
      ];
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

function buildChartArtifacts(chartType, rawData, helperConfig, variant) {
  return optionBuilder.buildChartArtifactsFromHelperConfig({
    chartType,
    helperConfig,
    rawData,
    previewState: deepMerge(
      buildDefaultPreviewState(),
      buildPreviewStateFromVariant(variant)
    ),
    dualAxisTypes: buildDualAxisTypesFromVariant(variant),
    dualAxisLayoutOverrides: buildDualAxisLayoutOverridesFromVariant(variant)
  });
}

function buildSummary(chartType, inputData, rawOption, resolvedOption) {
  const summary = {
    inputSeriesCount: Array.isArray(inputData && inputData.series) ? inputData.series.length : 0,
    rawSeriesCount: Array.isArray(rawOption && rawOption.series) ? rawOption.series.length : 0,
    resolvedSeriesCount: Array.isArray(resolvedOption && resolvedOption.series) ? resolvedOption.series.length : 0,
    inputSeriesNames: Array.isArray(inputData && inputData.series) ? inputData.series.map((series) => series && series.name).filter(Boolean) : [],
    rawSeriesNames: Array.isArray(rawOption && rawOption.series) ? rawOption.series.map((series) => series && series.name).filter(Boolean) : [],
    resolvedSeriesNames: Array.isArray(resolvedOption && resolvedOption.series) ? resolvedOption.series.map((series) => series && series.name).filter(Boolean) : []
  };

  if (inputData && inputData.title) {
    summary.inputTitleText = inputData.title.text;
    summary.inputTitleSubtext = inputData.title.subtext;
  }
  if (rawOption && rawOption.title) {
    summary.rawTitleText = rawOption.title.text;
    summary.rawTitleSubtext = rawOption.title.subtext;
  }
  if (resolvedOption && resolvedOption.title) {
    summary.resolvedTitleText = resolvedOption.title.text;
    summary.resolvedTitleSubtext = resolvedOption.title.subtext;
  }
  if (chartType === "dualAxis") {
    summary.inputSeriesHaveType = Array.isArray(inputData && inputData.series)
      ? inputData.series.map((series) => Object.prototype.hasOwnProperty.call(series || {}, "type"))
      : [];
    summary.resolvedYAxisSplitLineShow = Array.isArray(resolvedOption && resolvedOption.yAxis)
      ? resolvedOption.yAxis.map((axis) => Boolean(axis && axis.splitLine && axis.splitLine.show))
      : [];
    summary.rawSeriesTypes = Array.isArray(rawOption && rawOption.series)
      ? rawOption.series.map((series) => series && series.type)
      : [];
    summary.resolvedSeriesTypes = Array.isArray(resolvedOption && resolvedOption.series)
      ? resolvedOption.series.map((series) => series && series.type)
      : [];
  }

  return summary;
}

async function writeArtifacts(chartType, variantId, inputData, artifacts) {
  const chartDataDir = path.join(DATA_DIR, chartType);
  await fs.mkdir(chartDataDir, { recursive: true });
  const basePath = path.join(chartDataDir, variantId);
  const writes = [
    fs.writeFile(`${basePath}.input-data.json`, `${JSON.stringify(inputData, null, 2)}\n`, "utf-8"),
    fs.writeFile(`${basePath}.raw-option.json`, `${JSON.stringify(artifacts.rawOption, null, 2)}\n`, "utf-8"),
    fs.writeFile(`${basePath}.resolved-option.json`, `${JSON.stringify(artifacts.resolvedOption, null, 2)}\n`, "utf-8"),
    fs.writeFile(`${basePath}.summary.json`, `${JSON.stringify(buildSummary(chartType, inputData, artifacts.rawOption, artifacts.resolvedOption), null, 2)}\n`, "utf-8")
  ];
  await Promise.all(writes);
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

  const selectedData = applyDataSelection(
    chartType,
    defaultDataModule.getDefaultRawData(chartType),
    entry.dataSelection || null,
  );
  const rawData = deepMerge(selectedData, entry.dataPatch || undefined);
  const helperConfig = deepMerge(
    defaultConfigModule.getDefaultHelperConfig(chartType, DEFAULT_LOCALE),
    entry.configPatch || undefined,
  );
  const artifacts = buildChartArtifacts(chartType, rawData, helperConfig, entry.variant || {});

  const imageChartDir = path.join(IMAGE_DIR, chartType);
  const outputPath = path.join(imageChartDir, `${entry.variantId}.png`);
  await fs.mkdir(imageChartDir, { recursive: true });
  await writeArtifacts(chartType, entry.variantId, rawData, artifacts);

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
    outputFile: path.relative(PACKAGE_DIR, outputPath),
    width: Number(EXPORT_WIDTH),
    height: Number(EXPORT_HEIGHT),
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

  const isFullRun = selectedChartTypes.length === CHART_ORDER.length;
  if (isFullRun) {
    await fs.rm(IMAGE_DIR, { recursive: true, force: true });
    await fs.rm(DATA_DIR, { recursive: true, force: true });
  } else {
    for (const chartType of selectedChartTypes) {
      await fs.rm(path.join(IMAGE_DIR, chartType), { recursive: true, force: true });
      await fs.rm(path.join(DATA_DIR, chartType), { recursive: true, force: true });
    }
  }
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
