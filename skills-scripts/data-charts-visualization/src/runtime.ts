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
type ChartArtifacts = {
  rawOption: any,
  resolvedOption: any,
  stylePayload: any,
  dualAxisTypes?: DualAxisTypes
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

function buildDualAxisLayoutOverridesFromVariant(variant: any): Record<string, any> | undefined {
  if (!variant || !isObject(variant)) {
    return undefined;
  }

  const overrides: Record<string, any> = {};
  if ("layout" in variant) {
    const layout = String(variant.layout).trim().toLowerCase();
    if (layout === "horizontal") overrides.horizontal = true;
    if (layout === "vertical") overrides.horizontal = false;
  }

  return Object.keys(overrides).length ? overrides : undefined;
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

function buildChartArtifactsFromArgs(chartType: ChartType, args: ParsedArgs): ChartArtifacts {
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

  return optionBuilder.buildChartArtifactsFromHelperConfig({
    chartType,
    helperConfig,
    rawData: sourceOption,
    previewState: deepMerge(
      buildDefaultPreviewState(),
      buildPreviewStateFromVariant(variant)
    ),
    dualAxisTypes: buildDualAxisTypesFromVariant(variant),
    dualAxisLayoutOverrides: buildDualAxisLayoutOverridesFromVariant(variant)
  });
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
  const artifacts = buildChartArtifactsFromArgs(chartType, args);
  const outputPath = path.resolve(String(args.out));
  const svg = renderSvg(artifacts.resolvedOption, widthPx, heightPx);

  await writeOutput(outputPath, svg, widthPx, heightPx);
  console.log(`Wrote ${outputPath} (${widthPx}x${heightPx})`);
}

export {
  buildChartArtifactsFromArgs,
  DEFAULT_HEIGHT_PX,
  DEFAULT_WIDTH_PX,
  PACKAGE_DIR,
  parseArgv,
  runChartScript,
  SUPPORTED_CHART_TYPES
};
