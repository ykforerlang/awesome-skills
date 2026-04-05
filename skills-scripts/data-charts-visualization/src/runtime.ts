import fs from "node:fs";
import path from "node:path";
import * as echarts from "echarts";
import sharp from "sharp";

const runtimeDefinitionsModule = require("../../../skills-helpler/data-charts-visualization/shared/chart-runtime-definitions.js");
const optionBuilder = require("../../../skills-helpler/data-charts-visualization/shared/option-builder.js");

const { CHART_RUNTIME_DEFINITIONS } = runtimeDefinitionsModule;

const PACKAGE_DIR = path.resolve(__dirname, "..");
const DEFAULT_WIDTH_PX = 650;
const DEFAULT_HEIGHT_PX = 360;
const DEFAULT_PNG_PIXEL_RATIO = 2;
const SUPPORTED_CHART_TYPES = ["line", "bar", "pie", "gauge", "area", "dualAxis", "scatter", "radar", "funnel"] as const;

type ChartType = typeof SUPPORTED_CHART_TYPES[number];
type ParsedArgs = Record<string, any> & { positionals: string[] };
type DualAxisTypes = {
  leftType?: string,
  rightType?: string
};

function deepClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function isObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: any, patch: any): any {
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

function buildDefaultPreviewState() {
  return {
    previewStackMode: false,
    previewBarHorizontal: false,
    previewPieMode: "donut"
  };
}

function ensureArrayColorText(value: any, fallback: string) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
}

function coerceNumeric(value: any) {
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }
  return value;
}

function applyCommonHelperConfig(commonState: any, helperCommon: any) {
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

function applyLineSpecificConfig(specificState: any, helperSpecific: any) {
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

function applyBarSpecificConfig(specificState: any, helperSpecific: any) {
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

function applyAreaSpecificConfig(specificState: any, helperSpecific: any) {
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

function applyDualAxisSpecificConfig(specificState: any, helperSpecific: any) {
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

function applyScatterSpecificConfig(specificState: any, helperSpecific: any) {
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

function applyPieSpecificConfig(specificState: any, helperSpecific: any) {
  const nextState = deepClone(specificState);
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
  return nextState;
}

function buildPreviewStateFromVariant(variant: any) {
  if (!variant || !isObject(variant)) {
    return {};
  }

  const previewState: Record<string, any> = {};

  if ("stack" in variant) previewState.previewStackMode = Boolean(variant.stack);
  if ("pieMode" in variant) previewState.previewPieMode = variant.pieMode;

  if ("layout" in variant) {
    const layout = String(variant.layout).trim().toLowerCase();
    if (layout === "horizontal") previewState.previewBarHorizontal = true;
    if (layout === "vertical") previewState.previewBarHorizontal = false;
  }

  return previewState;
}

function buildDualAxisTypesFromVariant(variant: any): DualAxisTypes | undefined {
  if (!variant || !isObject(variant)) {
    return undefined;
  }

  const dualAxisTypes: DualAxisTypes = {};
  if ("leftSeriesType" in variant) dualAxisTypes.leftType = variant.leftSeriesType;
  if ("rightSeriesType" in variant) dualAxisTypes.rightType = variant.rightSeriesType;

  return Object.keys(dualAxisTypes).length ? dualAxisTypes : undefined;
}

function buildStateContextFromHelperConfig(chartType: ChartType, helperConfig: any, variant?: any) {
  if (!helperConfig || !isObject(helperConfig)) {
    throw new Error("Helper config must be a JSON object.");
  }
  if (helperConfig.chartType && helperConfig.chartType !== chartType) {
    throw new Error(`Helper config chartType mismatch: expected ${chartType}, got ${helperConfig.chartType}`);
  }
  if (!isObject(helperConfig.common) || !isObject(helperConfig.specific)) {
    throw new Error("Helper config must be a complete config object with both common and specific sections.");
  }

  const commonState = applyCommonHelperConfig(
    {},
    helperConfig.common
  );
  let specificState = {};
  let previewState = deepMerge(
    buildDefaultPreviewState(),
    buildPreviewStateFromVariant(variant)
  );
  let dualAxisTypes = buildDualAxisTypesFromVariant(variant);
  const helperSpecific = helperConfig.specific;

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
      dualAxisTypes = deepMerge(resolved.dualAxisTypes, dualAxisTypes);
      break;
    }
    case "scatter":
      specificState = applyScatterSpecificConfig(specificState, helperSpecific);
      break;
    case "pie":
      specificState = applyPieSpecificConfig(specificState, helperSpecific);
      break;
    case "gauge":
    case "radar":
    case "funnel":
      specificState = deepClone(helperSpecific);
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

function parseArgv(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    positionals: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--") {
      args.positionals.push(...argv.slice(index + 1));
      break;
    }

    if (token === "-" || /^-\d/.test(token) || !token.startsWith("-")) {
      args.positionals.push(token);
      continue;
    }

    const [flagToken, inlineValue] = token.split(/=(.*)/s, 2);
    const flag = flagToken.replace(/^-+/, "");
    if (inlineValue !== undefined) {
      args[flag] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next === undefined || (next.startsWith("-") && !/^-?\d+(\.\d+)?$/.test(next))) {
      args[flag] = true;
      continue;
    }

    args[flag] = next;
    index += 1;
  }

  if (args.h && args.help === undefined) {
    args.help = true;
  }

  return args;
}

function loadJsonFile<T = any>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function parseJsonValue<T = any>(rawValue: string, label: string): T {
  try {
    return JSON.parse(rawValue);
  } catch (error: any) {
    throw new Error(`Invalid ${label} JSON: ${error.message}`);
  }
}

function computeRenderSize(args: ParsedArgs) {
  const widthPx = args.width !== undefined ? Number(args.width) : DEFAULT_WIDTH_PX;
  const heightPx = args.height !== undefined ? Number(args.height) : DEFAULT_HEIGHT_PX;

  if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx)) {
    throw new Error("width and height must be numeric pixel values.");
  }

  return {
    widthPx: Math.round(widthPx),
    heightPx: Math.round(heightPx)
  };
}

function buildResolvedOption(chartType: ChartType, args: ParsedArgs) {
  if (args.data && args["data-file"]) {
    throw new Error("--data and --data-file are mutually exclusive.");
  }
  if (!args.data && !args["data-file"]) {
    throw new Error("One of --data or --data-file is required.");
  }
  if (!args.config && !args["config-file"]) {
    throw new Error("One of --config or --config-file is required.");
  }
  if (args.config && args["config-file"]) {
    throw new Error("--config and --config-file are mutually exclusive.");
  }

  const sourceOption = args.data
    ? parseJsonValue(String(args.data), "data")
    : loadJsonFile(path.resolve(String(args["data-file"])));
  const helperConfig = args.config
    ? parseJsonValue(String(args.config), "config")
    : loadJsonFile(path.resolve(String(args["config-file"])));
  const variant = args.variant !== undefined
    ? parseJsonValue(String(args.variant), "variant")
    : undefined;
  if (variant !== undefined && !isObject(variant)) {
    throw new Error("Variant must be a JSON object.");
  }

  const stateContext = buildStateContextFromHelperConfig(chartType, helperConfig, variant);
  const artifacts = optionBuilder.buildChartArtifacts({
    chartType,
    commonState: stateContext.commonState,
    specificState: stateContext.specificState,
    rawData: sourceOption,
    previewState: stateContext.previewState,
    dualAxisTypes: stateContext.dualAxisTypes
  });

  return artifacts.resolvedOption;
}

function renderSvg(option: any, widthPx: number, heightPx: number) {
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

async function writeOutput(outputPath: string, svg: string, widthPx: number, heightPx: number) {
  const extension = path.extname(outputPath).toLowerCase();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (extension === ".svg") {
    fs.writeFileSync(outputPath, svg, "utf-8");
    return;
  }

  if (extension !== ".png") {
    throw new Error(`Unsupported output extension: ${extension}. Use .png or .svg`);
  }

  const outputWidthPx = Math.max(1, Math.round(widthPx * DEFAULT_PNG_PIXEL_RATIO));
  const outputHeightPx = Math.max(1, Math.round(heightPx * DEFAULT_PNG_PIXEL_RATIO));

  await sharp(Buffer.from(svg), {
    density: Math.round(72 * DEFAULT_PNG_PIXEL_RATIO)
  })
    .resize(outputWidthPx, outputHeightPx, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: 100,
      effort: 10,
      colors: 256,
      dither: 1
    })
    .toFile(outputPath);
}

async function runChartScript(argv: string[]) {
  const args = parseArgv(argv);
  const chartType = (args["chart-type"] || args.positionals[0]) as ChartType | undefined;

  if (!chartType || !(chartType in CHART_RUNTIME_DEFINITIONS)) {
    throw new Error(`Missing or unsupported chart type. Supported values: ${SUPPORTED_CHART_TYPES.join(", ")}`);
  }
  if (!args.out) {
    throw new Error("--out is required.");
  }

  const { widthPx, heightPx } = computeRenderSize(args);
  const resolvedOption = buildResolvedOption(chartType, args);
  const svg = renderSvg(resolvedOption, widthPx, heightPx);
  const outputPath = path.resolve(String(args.out));

  await writeOutput(outputPath, svg, widthPx, heightPx);
  console.log(`Wrote ${outputPath} (${widthPx}x${heightPx})`);
}

export {
  DEFAULT_HEIGHT_PX,
  DEFAULT_WIDTH_PX,
  PACKAGE_DIR,
  parseArgv,
  runChartScript,
  SUPPORTED_CHART_TYPES
};
