#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const SKILL_DIR = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(SKILL_DIR, "..", "..");
const HELPER_ROOT = path.join(REPO_ROOT, "skills-helpler", "data-charts-visualization");
const { COMMON_DEFAULTS, CHART_DEFINITIONS, CHART_BEAUTY_DEFAULTS } = require(path.join(
  HELPER_ROOT,
  "mini-program",
  "lib",
  "schema.js"
));
const optionBuilder = require(path.join(HELPER_ROOT, "shared", "option-builder.js"));
const defaultConfigModule = require(path.join(HELPER_ROOT, "shared", "charts-default-config.js"));

const DEFAULT_WIDTH_IN = 650 / 160;
const DEFAULT_HEIGHT_IN = 360 / 160;
const DEFAULT_DPI = 160;
const DEFAULT_PNG_PIXEL_RATIO = 2;

const CHART_CONFIG_FILE_MAP = {
  line: "line_style.json",
  bar: "bar_style.json",
  pie: "pie_style.json",
  gauge: "gauge_style.json",
  area: "area_style.json",
  dualAxis: "dual_axis_style.json",
  scatter: "scatter_style.json",
  radar: "radar_style.json",
  funnel: "funnel_style.json"
};

function getSharp() {
  return require("sharp");
}

function getEcharts() {
  return require("echarts");
}

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

function buildDefaultCommonStateForChart(chartType) {
  if (defaultConfigModule && typeof defaultConfigModule.getDefaultCommonState === "function") {
    return defaultConfigModule.getDefaultCommonState(chartType, "zh");
  }
  const beautyDefaults = CHART_BEAUTY_DEFAULTS[chartType] || {};
  return deepMerge(COMMON_DEFAULTS, beautyDefaults.common || {});
}

function buildDefaultSpecificStateForChart(chartType) {
  if (defaultConfigModule && typeof defaultConfigModule.getDefaultSpecificState === "function") {
    return defaultConfigModule.getDefaultSpecificState(chartType);
  }
  const definition = CHART_DEFINITIONS[chartType];
  if (!definition) {
    throw new Error(`Unsupported chart type: ${chartType}`);
  }
  const defaults = {};
  (definition.fields || []).forEach((field) => {
    if (field.type === "group") {
      return;
    }
    defaults[field.id] = field.default !== undefined ? deepClone(field.default) : "";
  });
  const beautyDefaults = CHART_BEAUTY_DEFAULTS[chartType] || {};
  return deepMerge(defaults, beautyDefaults.specific || {});
}

function buildDefaultPreviewStateForChart(chartType) {
  if (defaultConfigModule && typeof defaultConfigModule.getDefaultPreviewState === "function") {
    return defaultConfigModule.getDefaultPreviewState(chartType);
  }
  return {
    previewStackMode: false,
    previewBarHorizontal: false,
    previewPieMode: chartType === "pie" ? "donut" : "donut"
  };
}

function ensureArrayColorText(value, fallback) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
}

function coerceNumeric(value) {
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }
  return value;
}

function applyCommonHelperConfig(commonState, helperCommon) {
  const nextState = deepClone(commonState);
  const titleMain = helperCommon?.title?.main || {};
  const titleSubtitle = helperCommon?.title?.subtitle || {};
  const canvas = helperCommon?.canvas || {};
  const plotArea = canvas.plotArea || {};
  const legend = helperCommon?.legend || {};
  const xAxis = helperCommon?.axes?.x || {};
  const yAxis = helperCommon?.axes?.y || {};
  const horizontalSplit = helperCommon?.splitLines?.horizontal || {};
  const verticalSplit = helperCommon?.splitLines?.vertical || {};

  if ("show" in titleMain) nextState.titleShow = Boolean(titleMain.show);
  if ("text" in titleMain) nextState.titleText = titleMain.text;
  if ("align" in titleMain) nextState.titleAlign = titleMain.align;
  if ("fontSize" in titleMain) nextState.titleFontSize = coerceNumeric(titleMain.fontSize);
  if ("color" in titleMain) nextState.titleColor = titleMain.color;
  if ("bold" in titleMain) nextState.titleBold = Boolean(titleMain.bold);

  if ("show" in titleSubtitle) nextState.subtitleShow = Boolean(titleSubtitle.show);
  if ("text" in titleSubtitle) nextState.subtitleText = titleSubtitle.text;
  if ("fontSize" in titleSubtitle) nextState.subtitleFontSize = coerceNumeric(titleSubtitle.fontSize);
  if ("color" in titleSubtitle) nextState.subtitleColor = titleSubtitle.color;

  if ("backgroundColor" in canvas) nextState.backgroundColor = canvas.backgroundColor;
  if ("palette" in canvas) nextState.palette = deepClone(canvas.palette);
  if ("left" in plotArea) nextState.gridLeft = plotArea.left;
  if ("right" in plotArea) nextState.gridRight = plotArea.right;
  if ("top" in plotArea) nextState.gridTop = plotArea.top;
  if ("bottom" in plotArea) nextState.gridBottom = plotArea.bottom;

  if ("show" in legend) nextState.legendShow = Boolean(legend.show);
  if ("position" in legend) nextState.legendPosition = legend.position;
  if ("orient" in legend) nextState.legendOrient = legend.orient;
  if ("fontSize" in legend) nextState.legendFontSize = coerceNumeric(legend.fontSize);
  if ("color" in legend) nextState.legendColor = legend.color;

  if ("lineShow" in xAxis) nextState.xAxisLineShow = Boolean(xAxis.lineShow);
  if ("tickShow" in xAxis) nextState.xAxisTickShow = Boolean(xAxis.tickShow);
  if ("rotate" in xAxis) nextState.xRotate = coerceNumeric(xAxis.rotate);
  if ("labelFontSize" in xAxis) nextState.xAxisLabelFontSize = coerceNumeric(xAxis.labelFontSize);
  if ("labelColor" in xAxis) nextState.xAxisLabelColor = xAxis.labelColor;
  if ("lineColor" in xAxis) nextState.xAxisLineColor = xAxis.lineColor;
  if ("formatter" in xAxis) nextState.xFormatter = xAxis.formatter;

  if ("lineShow" in yAxis) nextState.yAxisLineShow = Boolean(yAxis.lineShow);
  if ("tickShow" in yAxis) nextState.yAxisTickShow = Boolean(yAxis.tickShow);
  if ("labelFontSize" in yAxis) nextState.yAxisLabelFontSize = coerceNumeric(yAxis.labelFontSize);
  if ("labelColor" in yAxis) nextState.yAxisLabelColor = yAxis.labelColor;
  if ("lineColor" in yAxis) nextState.yAxisLineColor = yAxis.lineColor;
  if ("formatter" in yAxis) nextState.yFormatter = yAxis.formatter;

  if ("show" in horizontalSplit) nextState.splitLineShow = Boolean(horizontalSplit.show);
  if ("color" in horizontalSplit) nextState.splitLineColor = horizontalSplit.color;
  if ("type" in horizontalSplit) nextState.splitLineType = horizontalSplit.type;
  if ("width" in horizontalSplit) nextState.splitLineWidth = coerceNumeric(horizontalSplit.width);

  if ("show" in verticalSplit) nextState.xSplitLineShow = Boolean(verticalSplit.show);
  if ("color" in verticalSplit) nextState.xSplitLineColor = verticalSplit.color;
  if ("type" in verticalSplit) nextState.xSplitLineType = verticalSplit.type;
  if ("width" in verticalSplit) nextState.xSplitLineWidth = coerceNumeric(verticalSplit.width);

  return nextState;
}

function applyLineSpecificConfig(specificState, helperSpecific) {
  const nextState = deepClone(specificState);
  const line = helperSpecific?.line || {};
  const dataLabels = helperSpecific?.dataLabels || {};
  if ("smooth" in line) nextState.smooth = Boolean(line.smooth);
  if ("showSymbol" in line) nextState.showSymbol = Boolean(line.showSymbol);
  if ("connectNulls" in line) nextState.connectNulls = Boolean(line.connectNulls);
  if ("symbol" in line) nextState.symbol = line.symbol;
  if ("symbolSize" in line) nextState.symbolSize = coerceNumeric(line.symbolSize);
  if ("lineStyleType" in line) nextState.lineStyleType = line.lineStyleType;
  if ("lineWidth" in line) nextState.lineWidth = coerceNumeric(line.lineWidth);
  if ("show" in dataLabels) nextState.showLabel = Boolean(dataLabels.show);
  if ("fontSize" in dataLabels) nextState.labelFontSize = coerceNumeric(dataLabels.fontSize);
  if ("color" in dataLabels) nextState.labelColor = dataLabels.color;
  return nextState;
}

function applyBarSpecificConfig(specificState, helperSpecific) {
  const nextState = deepClone(specificState);
  const bar = helperSpecific?.bar || {};
  const dataLabels = helperSpecific?.dataLabels || {};
  if ("barGap" in bar) nextState.barGap = bar.barGap;
  if ("itemOpacity" in bar) nextState.itemOpacity = coerceNumeric(bar.itemOpacity);
  if ("borderRadius" in bar) nextState.borderRadius = coerceNumeric(bar.borderRadius);
  if ("borderWidth" in bar) nextState.borderWidth = coerceNumeric(bar.borderWidth);
  if ("borderColor" in bar) nextState.borderColor = bar.borderColor;
  if ("show" in dataLabels) nextState.showLabel = Boolean(dataLabels.show);
  if ("position" in dataLabels) nextState.labelPosition = dataLabels.position;
  if ("fontSize" in dataLabels) nextState.labelFontSize = coerceNumeric(dataLabels.fontSize);
  if ("color" in dataLabels) nextState.labelColor = dataLabels.color;
  return nextState;
}

function applyAreaSpecificConfig(specificState, helperSpecific) {
  const nextState = deepClone(specificState);
  const area = helperSpecific?.area || {};
  const dataLabels = helperSpecific?.dataLabels || {};
  if ("smooth" in area) nextState.smooth = Boolean(area.smooth);
  if ("showSymbol" in area) nextState.showSymbol = Boolean(area.showSymbol);
  if ("symbol" in area) nextState.symbol = area.symbol;
  if ("symbolSize" in area) nextState.symbolSize = coerceNumeric(area.symbolSize);
  if ("connectNulls" in area) nextState.connectNulls = Boolean(area.connectNulls);
  if ("areaOpacity" in area) nextState.areaOpacity = coerceNumeric(area.areaOpacity);
  if ("areaFillMode" in area) nextState.areaFillMode = area.areaFillMode;
  if ("lineStyleType" in area) nextState.lineStyleType = area.lineStyleType;
  if ("lineWidth" in area) nextState.lineWidth = coerceNumeric(area.lineWidth);
  if ("show" in dataLabels) nextState.showLabel = Boolean(dataLabels.show);
  if ("fontSize" in dataLabels) nextState.labelFontSize = coerceNumeric(dataLabels.fontSize);
  if ("color" in dataLabels) nextState.labelColor = dataLabels.color;
  return nextState;
}

function applyDualAxisSpecificConfig(specificState, helperSpecific) {
  const nextState = deepClone(specificState);
  const layout = helperSpecific?.layout || {};
  const leftAxis = helperSpecific?.leftAxis || {};
  const rightAxis = helperSpecific?.rightAxis || {};
  const leftBar = helperSpecific?.leftBar || {};
  const rightBar = helperSpecific?.rightBar || {};
  const leftLine = helperSpecific?.leftLine || {};
  const rightLine = helperSpecific?.rightLine || {};

  if ("horizontal" in layout) nextState.horizontal = Boolean(layout.horizontal);
  if ("splitLineFollowAxis" in layout) nextState.splitLineFollowAxis = layout.splitLineFollowAxis;

  if ("labelFontSize" in leftAxis) nextState.leftAxisLabelFontSize = coerceNumeric(leftAxis.labelFontSize);
  if ("labelColor" in leftAxis) nextState.leftAxisLabelColor = leftAxis.labelColor;
  if ("lineShow" in leftAxis) nextState.leftAxisLineShow = Boolean(leftAxis.lineShow);
  if ("lineColor" in leftAxis) nextState.leftAxisLineColor = leftAxis.lineColor;
  if ("tickShow" in leftAxis) nextState.leftAxisTickShow = Boolean(leftAxis.tickShow);
  if ("formatter" in leftAxis) nextState.leftAxisFormatter = leftAxis.formatter;

  if ("labelFontSize" in rightAxis) nextState.rightAxisLabelFontSize = coerceNumeric(rightAxis.labelFontSize);
  if ("labelColor" in rightAxis) nextState.rightAxisLabelColor = rightAxis.labelColor;
  if ("lineShow" in rightAxis) nextState.rightAxisLineShow = Boolean(rightAxis.lineShow);
  if ("lineColor" in rightAxis) nextState.rightAxisLineColor = rightAxis.lineColor;
  if ("tickShow" in rightAxis) nextState.rightAxisTickShow = Boolean(rightAxis.tickShow);
  if ("formatter" in rightAxis) nextState.rightAxisFormatter = rightAxis.formatter;

  if ("showLabel" in leftBar) nextState.leftBarShowLabel = Boolean(leftBar.showLabel);
  if ("labelPosition" in leftBar) nextState.leftBarLabelPosition = leftBar.labelPosition;
  if ("labelFontSize" in leftBar) nextState.leftBarLabelFontSize = coerceNumeric(leftBar.labelFontSize);
  if ("labelColor" in leftBar) nextState.leftBarLabelColor = leftBar.labelColor;
  if ("opacity" in leftBar) nextState.leftBarOpacity = coerceNumeric(leftBar.opacity);
  if ("barGap" in leftBar) nextState.leftBarGap = leftBar.barGap;
  if ("borderRadius" in leftBar) nextState.leftBarBorderRadius = coerceNumeric(leftBar.borderRadius);
  if ("borderWidth" in leftBar) nextState.leftBarBorderWidth = coerceNumeric(leftBar.borderWidth);
  if ("borderColor" in leftBar) nextState.leftBarBorderColor = leftBar.borderColor;
  if ("colors" in leftBar) nextState.leftBarColors = ensureArrayColorText(leftBar.colors, nextState.leftBarColors);

  if ("showLabel" in rightBar) nextState.rightBarShowLabel = Boolean(rightBar.showLabel);
  if ("labelPosition" in rightBar) nextState.rightBarLabelPosition = rightBar.labelPosition;
  if ("labelFontSize" in rightBar) nextState.rightBarLabelFontSize = coerceNumeric(rightBar.labelFontSize);
  if ("labelColor" in rightBar) nextState.rightBarLabelColor = rightBar.labelColor;
  if ("opacity" in rightBar) nextState.rightBarOpacity = coerceNumeric(rightBar.opacity);
  if ("barGap" in rightBar) nextState.rightBarGap = rightBar.barGap;
  if ("borderRadius" in rightBar) nextState.rightBarBorderRadius = coerceNumeric(rightBar.borderRadius);
  if ("borderWidth" in rightBar) nextState.rightBarBorderWidth = coerceNumeric(rightBar.borderWidth);
  if ("borderColor" in rightBar) nextState.rightBarBorderColor = rightBar.borderColor;
  if ("colors" in rightBar) nextState.rightBarColors = ensureArrayColorText(rightBar.colors, nextState.rightBarColors);

  if ("smooth" in leftLine) nextState.leftLineSmooth = Boolean(leftLine.smooth);
  if ("area" in leftLine) nextState.leftLineArea = Boolean(leftLine.area);
  if ("showSymbol" in leftLine) nextState.leftLineShowSymbol = Boolean(leftLine.showSymbol);
  if ("connectNulls" in leftLine) nextState.leftLineConnectNulls = Boolean(leftLine.connectNulls);
  if ("showLabel" in leftLine) nextState.leftLineShowLabel = Boolean(leftLine.showLabel);
  if ("colors" in leftLine) nextState.leftLineColors = ensureArrayColorText(leftLine.colors, nextState.leftLineColors);
  if ("lineStyleType" in leftLine) nextState.leftLineStyleType = leftLine.lineStyleType;
  if ("lineWidth" in leftLine) nextState.leftLineWidth = coerceNumeric(leftLine.lineWidth);
  if ("symbol" in leftLine) nextState.leftLineSymbol = leftLine.symbol;
  if ("symbolSize" in leftLine) nextState.leftLineSymbolSize = coerceNumeric(leftLine.symbolSize);
  if ("labelFontSize" in leftLine) nextState.leftLineLabelFontSize = coerceNumeric(leftLine.labelFontSize);
  if ("labelColor" in leftLine) nextState.leftLineLabelColor = leftLine.labelColor;

  if ("smooth" in rightLine) nextState.rightLineSmooth = Boolean(rightLine.smooth);
  if ("area" in rightLine) nextState.rightLineArea = Boolean(rightLine.area);
  if ("showSymbol" in rightLine) nextState.rightLineShowSymbol = Boolean(rightLine.showSymbol);
  if ("connectNulls" in rightLine) nextState.rightLineConnectNulls = Boolean(rightLine.connectNulls);
  if ("showLabel" in rightLine) nextState.rightLineShowLabel = Boolean(rightLine.showLabel);
  if ("colors" in rightLine) nextState.rightLineColors = ensureArrayColorText(rightLine.colors, nextState.rightLineColors);
  if ("lineStyleType" in rightLine) nextState.rightLineStyleType = rightLine.lineStyleType;
  if ("lineWidth" in rightLine) nextState.rightLineWidth = coerceNumeric(rightLine.lineWidth);
  if ("symbol" in rightLine) nextState.rightLineSymbol = rightLine.symbol;
  if ("symbolSize" in rightLine) nextState.rightLineSymbolSize = coerceNumeric(rightLine.symbolSize);
  if ("labelFontSize" in rightLine) nextState.rightLineLabelFontSize = coerceNumeric(rightLine.labelFontSize);
  if ("labelColor" in rightLine) nextState.rightLineLabelColor = rightLine.labelColor;

  return {
    specificState: nextState,
    dualAxisTypes: {
      leftType: layout.leftSeriesType || "bar",
      rightType: layout.rightSeriesType || "line"
    }
  };
}

function applyScatterSpecificConfig(specificState, helperSpecific) {
  const nextState = deepClone(specificState);
  const point = helperSpecific?.point || {};
  const dataLabels = helperSpecific?.dataLabels || {};
  if ("symbol" in point) nextState.symbol = point.symbol;
  if ("symbolSize" in point) nextState.symbolSize = coerceNumeric(point.symbolSize);
  if ("itemOpacity" in point) nextState.itemOpacity = coerceNumeric(point.itemOpacity);
  if ("borderWidth" in point) nextState.borderWidth = coerceNumeric(point.borderWidth);
  if ("borderColor" in point) nextState.borderColor = point.borderColor;
  if ("show" in dataLabels) nextState.showLabel = Boolean(dataLabels.show);
  if ("fontSize" in dataLabels) nextState.labelFontSize = coerceNumeric(dataLabels.fontSize);
  if ("color" in dataLabels) nextState.labelColor = dataLabels.color;
  return nextState;
}

function applyPieSpecificConfig(specificState, helperSpecific, previewState) {
  const nextState = deepClone(specificState);
  const nextPreviewState = deepClone(previewState);
  if ("labelPosition" in helperSpecific) nextState.labelPosition = helperSpecific.labelPosition;
  if ("startAngle" in helperSpecific) nextState.startAngle = coerceNumeric(helperSpecific.startAngle);
  if ("showLabel" in helperSpecific) nextState.showLabel = Boolean(helperSpecific.showLabel);
  if ("labelFontSize" in helperSpecific) nextState.labelFontSize = coerceNumeric(helperSpecific.labelFontSize);
  if ("labelColor" in helperSpecific) nextState.labelColor = helperSpecific.labelColor;
  if ("labelFormatter" in helperSpecific) nextState.labelFormatter = helperSpecific.labelFormatter;
  if ("labelLineShow" in helperSpecific) nextState.labelLineShow = Boolean(helperSpecific.labelLineShow);
  if ("labelLineColor" in helperSpecific) nextState.labelLineColor = helperSpecific.labelLineColor;
  if ("labelLineWidth" in helperSpecific) nextState.labelLineWidth = coerceNumeric(helperSpecific.labelLineWidth);
  if ("itemOpacity" in helperSpecific) nextState.itemOpacity = coerceNumeric(helperSpecific.itemOpacity);
  if ("borderWidth" in helperSpecific) nextState.borderWidth = coerceNumeric(helperSpecific.borderWidth);
  if ("borderColor" in helperSpecific) nextState.borderColor = helperSpecific.borderColor;
  if ("previewPieMode" in helperSpecific) nextPreviewState.previewPieMode = helperSpecific.previewPieMode;
  return { specificState: nextState, previewState: nextPreviewState };
}

function buildStateContextFromHelperConfig(chartType, helperConfig) {
  if (!helperConfig || !isObject(helperConfig)) {
    throw new Error("Helper config must be a JSON object.");
  }
  if (helperConfig.chartType && helperConfig.chartType !== chartType) {
    throw new Error(`Helper config chartType mismatch: expected ${chartType}, got ${helperConfig.chartType}`);
  }

  const commonState = applyCommonHelperConfig(
    buildDefaultCommonStateForChart(chartType),
    helperConfig.common || {}
  );
  let specificState = buildDefaultSpecificStateForChart(chartType);
  let previewState = buildDefaultPreviewStateForChart(chartType);
  let dualAxisTypes;
  const helperSpecific = helperConfig.specific || {};

  switch (chartType) {
    case "line":
      specificState = applyLineSpecificConfig(specificState, helperSpecific);
      break;
    case "bar":
      specificState = applyBarSpecificConfig(specificState, helperSpecific);
      break;
    case "area":
      specificState = applyAreaSpecificConfig(specificState, helperSpecific);
      break;
    case "dualAxis": {
      const resolved = applyDualAxisSpecificConfig(specificState, helperSpecific);
      specificState = resolved.specificState;
      dualAxisTypes = resolved.dualAxisTypes;
      break;
    }
    case "scatter":
      specificState = applyScatterSpecificConfig(specificState, helperSpecific);
      break;
    case "pie": {
      const resolved = applyPieSpecificConfig(specificState, helperSpecific, previewState);
      specificState = resolved.specificState;
      previewState = resolved.previewState;
      break;
    }
    case "gauge":
    case "radar":
    case "funnel":
      specificState = deepMerge(specificState, helperSpecific);
      break;
    default:
      throw new Error(`Unsupported chart type: ${chartType}`);
  }

  return {
    commonState,
    specificState,
    previewState,
    dualAxisTypes
  };
}

function parseArgv(argv) {
  const args = {
    positionals: []
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args.positionals.push(token);
      continue;
    }
    const flag = token.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      args[flag] = true;
      continue;
    }
    args[flag] = next;
    index += 1;
  }
  return args;
}

function loadJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function stripMeta(option) {
  if (!isObject(option)) {
    return option;
  }
  const nextOption = deepClone(option);
  delete nextOption._meta;
  return nextOption;
}

function getSkillConfigPath(chartType) {
  const configFile = CHART_CONFIG_FILE_MAP[chartType];
  if (!configFile) {
    throw new Error(`No default config file mapped for chart type: ${chartType}`);
  }
  return path.join(SKILL_DIR, "config", configFile);
}

function computeRenderSize(args) {
  if (args["width-px"] || args["height-px"]) {
    if (!args["width-px"] || !args["height-px"]) {
      throw new Error("--width-px and --height-px must be provided together.");
    }
    return {
      widthPx: Math.round(Number(args["width-px"])),
      heightPx: Math.round(Number(args["height-px"]))
    };
  }

  const widthIn = args.width !== undefined ? Number(args.width) : DEFAULT_WIDTH_IN;
  const heightIn = args.height !== undefined ? Number(args.height) : DEFAULT_HEIGHT_IN;
  const dpi = args.dpi !== undefined ? Number(args.dpi) : DEFAULT_DPI;

  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn) || !Number.isFinite(dpi)) {
    throw new Error("width, height, and dpi must be numeric.");
  }

  return {
    widthPx: Math.round(widthIn * dpi),
    heightPx: Math.round(heightIn * dpi)
  };
}

function buildResolvedOption(chartType, args) {
  if (!args.option && !args["option-json"]) {
    throw new Error("One of --option or --option-json is required.");
  }

  const sourceOption = stripMeta(
    args["option-json"] ? JSON.parse(args["option-json"]) : loadJsonFile(path.resolve(args.option))
  );

  if (args["resolved-option"]) {
    return deepClone(sourceOption);
  }

  const helperConfigPath = args["helper-config"]
    ? path.resolve(args["helper-config"])
    : args["style-config"]
      ? path.resolve(args["style-config"])
      : getSkillConfigPath(chartType);
  const helperConfig = loadJsonFile(helperConfigPath);
  const stateContext = buildStateContextFromHelperConfig(chartType, helperConfig);

  const artifacts = optionBuilder.buildChartArtifacts({
    chartType,
    definition: CHART_DEFINITIONS[chartType],
    commonState: stateContext.commonState,
    specificState: stateContext.specificState,
    rawData: sourceOption,
    previewState: stateContext.previewState,
    dualAxisTypes: stateContext.dualAxisTypes
  });

  if (args["resolved-option-output"]) {
    fs.mkdirSync(path.dirname(path.resolve(args["resolved-option-output"])), { recursive: true });
    fs.writeFileSync(
      path.resolve(args["resolved-option-output"]),
      `${JSON.stringify(artifacts.resolvedOption, null, 2)}\n`,
      "utf-8"
    );
  }

  return artifacts.resolvedOption;
}

function renderSvg(option, widthPx, heightPx) {
  const echarts = getEcharts();
  const renderOption = deepClone(option);
  renderOption.animation = false;

  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width: widthPx,
    height: heightPx
  });
  chart.setOption(renderOption, true);
  const svg = chart.renderToSVGString();
  chart.dispose();
  return svg;
}

async function writeOutput({ svg, outputPath, svgOutputPath, pixelRatio, widthPx, heightPx }) {
  const sharp = getSharp();
  if (svgOutputPath) {
    fs.mkdirSync(path.dirname(svgOutputPath), { recursive: true });
    fs.writeFileSync(svgOutputPath, svg, "utf-8");
  }

  const extension = path.extname(outputPath).toLowerCase();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (extension === ".svg") {
    fs.writeFileSync(outputPath, svg, "utf-8");
    return;
  }

  if (extension !== ".png") {
    throw new Error(`Unsupported output extension: ${extension}. Use .png or .svg`);
  }

  const effectivePixelRatio = Math.max(1, Number(pixelRatio) || DEFAULT_PNG_PIXEL_RATIO);
  const outputWidthPx = Math.max(1, Math.round(widthPx * effectivePixelRatio));
  const outputHeightPx = Math.max(1, Math.round(heightPx * effectivePixelRatio));

  await sharp(Buffer.from(svg), {
    density: Math.round(72 * effectivePixelRatio)
  })
    .resize(outputWidthPx, outputHeightPx, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: 100,
      effort: 10,
      colors: 256,
      dither: 1,
    })
    .toFile(outputPath);
}

async function runChartScript(chartType, argv) {
  const args = parseArgv(argv);
  if (args.help) {
    console.log(
      [
        `Usage: node scripts/${chartType}_chart.js --option <file> --output <file> [flags]`,
        "",
        "Flags:",
        "  --option <file>                 Raw data option JSON or resolved option JSON",
        "  --option-json <json>            Inline JSON payload",
        "  --output <file>                 Output .png or .svg file",
        "  --style-config <file>           Helper config file; defaults to config/<chart>_style.json",
        "  --helper-config <file>          Alias of --style-config",
        "  --resolved-option               Treat --option as a fully resolved ECharts option",
        "  --resolved-option-output <file> Write the resolved option JSON for inspection",
        "  --svg-output <file>             Also write the intermediate SVG",
        "  --width <inches>                Render width in inches",
        "  --height <inches>               Render height in inches",
        "  --dpi <dpi>                     DPI used with width/height",
        "  --pixel-ratio <ratio>           PNG rasterization scale; default 2",
        "  --width-px <px>                 Render width in pixels",
        "  --height-px <px>                Render height in pixels"
      ].join("\n")
    );
    return;
  }

  if (!args.output) {
    throw new Error("--output is required.");
  }

  const { widthPx, heightPx } = computeRenderSize(args);
  const resolvedOption = buildResolvedOption(chartType, args);
  const svg = renderSvg(resolvedOption, widthPx, heightPx);
  const outputPath = path.resolve(args.output);
  const svgOutputPath = args["svg-output"] ? path.resolve(args["svg-output"]) : null;
  const pixelRatio = args["pixel-ratio"] !== undefined
    ? Number(args["pixel-ratio"])
    : DEFAULT_PNG_PIXEL_RATIO;

  await writeOutput({ svg, outputPath, svgOutputPath, pixelRatio, widthPx, heightPx });
  console.log(`Wrote ${outputPath} (${widthPx}x${heightPx})`);
}

module.exports = {
  CHART_CONFIG_FILE_MAP,
  DEFAULT_DPI,
  DEFAULT_HEIGHT_IN,
  DEFAULT_PNG_PIXEL_RATIO,
  DEFAULT_WIDTH_IN,
  SKILL_DIR,
  buildResolvedOption,
  computeRenderSize,
  getSkillConfigPath,
  parseArgv,
  runChartScript
};
