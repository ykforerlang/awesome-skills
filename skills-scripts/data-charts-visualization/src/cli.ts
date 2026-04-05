import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  DEFAULT_HEIGHT_PX,
  DEFAULT_WIDTH_PX,
  PACKAGE_DIR,
  parseArgv,
  runChartScript,
  SUPPORTED_CHART_TYPES
} from "./runtime";

type ParsedArgs = Record<string, any> & { positionals: string[] };
type ChartType = typeof SUPPORTED_CHART_TYPES[number];
const KNOWN_COMMANDS = new Set(["deps", "help", "--help", "-h"]);

function hasDependency(name: string) {
  try {
    require.resolve(name, { paths: [PACKAGE_DIR] });
    return true;
  } catch {
    return false;
  }
}

function printMainHelp() {
  console.log(
    [
      "Usage:",
      "  areslabs-data-charts --chart-type <type> (--data <json> | --data-file <file>) (--config <json> | --config-file <file>) [--variant <json>] [--width <px>] [--height <px>] [--out <dir|file>]",
      "  areslabs-data-charts deps [--install]",
      "",
      "Flags:",
      "  --chart-type <type>            Chart type",
      "  --data <json>                  Raw chart data inline JSON payload",
      "  --data-file <file>             Raw chart data file path",
      "  --config <json>                Complete helper config inline JSON payload",
      "  --config-file <file>           Complete helper config file path",
      "  --variant <json>               One-off render strategy JSON payload",
      `  --width <px>                   Output width in pixels; default ${DEFAULT_WIDTH_PX}`,
      `  --height <px>                  Output height in pixels; default ${DEFAULT_HEIGHT_PX}`,
      "  --out <dir|file>               Output directory or output file path; default system tmp/areslabs-data-charts",
      "",
      "Commands:",
      "  deps                           Inspect or install local Node dependencies",
      "  help                           Show this message",
      "",
      `Supported chart types: ${SUPPORTED_CHART_TYPES.join(", ")}`
    ].join("\n")
  );
}

function assertChartType(chartType: string | undefined): asserts chartType is ChartType {
  if (!chartType) {
    throw new Error(`Missing chart type. Supported values: ${SUPPORTED_CHART_TYPES.join(", ")}`);
  }
  if (!SUPPORTED_CHART_TYPES.includes(chartType as ChartType)) {
    throw new Error(`Unsupported chart type "${chartType}". Supported values: ${SUPPORTED_CHART_TYPES.join(", ")}`);
  }
}

function runDeps(argv: string[]) {
  const args = parseArgv(argv) as ParsedArgs;
  if (args.install) {
    execFileSync("npm", ["install"], {
      cwd: PACKAGE_DIR,
      stdio: "inherit"
    });
    return;
  }

  const deps = ["echarts", "sharp"];
  const missing = deps.filter((name) => !hasDependency(name));
  if (missing.length) {
    console.log(`Missing dependencies: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Dependencies are installed in ${PACKAGE_DIR}/node_modules`);
}

function looksLikeJson(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function buildOutputPath(chartType: ChartType, outValue?: string) {
  if (outValue) {
    const resolvedOut = path.resolve(outValue);
    const extension = path.extname(resolvedOut).toLowerCase();
    if (extension === ".png" || extension === ".svg") {
      return resolvedOut;
    }
    const fileName = `${chartType}-${Date.now()}.png`;
    return path.join(resolvedOut, fileName);
  }

  const defaultDir = path.join(os.tmpdir(), "areslabs-data-charts");
  return path.join(defaultDir, `${chartType}-${Date.now()}.png`);
}

async function runDirect(argv: string[]) {
  const args = parseArgv(argv) as ParsedArgs;
  if (args.help) {
    printMainHelp();
    return;
  }

  const chartType = args["chart-type"] || args.positionals[0];
  assertChartType(chartType);

  if (args.data !== undefined && args["data-file"] !== undefined) {
    throw new Error("--data and --data-file are mutually exclusive.");
  }
  if (args.data === undefined && args["data-file"] === undefined) {
    throw new Error("One of --data or --data-file is required.");
  }
  if (args.config !== undefined && args["config-file"] !== undefined) {
    throw new Error("--config and --config-file are mutually exclusive.");
  }
  if (args.config === undefined && args["config-file"] === undefined) {
    throw new Error("One of --config or --config-file is required.");
  }

  const widthPx = args.width !== undefined ? Number(args.width) : DEFAULT_WIDTH_PX;
  const heightPx = args.height !== undefined ? Number(args.height) : DEFAULT_HEIGHT_PX;
  if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx)) {
    throw new Error("--width and --height must be numeric pixel values.");
  }

  if (args.data !== undefined && !looksLikeJson(args.data)) {
    throw new Error("--data only accepts inline JSON. Use --data-file for file paths.");
  }

  const normalizedArgs: string[] = [
    "--chart-type",
    chartType,
    "--out",
    buildOutputPath(chartType, args.out),
    "--width",
    String(Math.round(widthPx)),
    "--height",
    String(Math.round(heightPx))
  ];

  if (args.data !== undefined) {
    normalizedArgs.push("--data", String(args.data));
  }

  if (args["data-file"] !== undefined) {
    const resolvedDataPath = path.resolve(args["data-file"]);
    if (!fs.existsSync(resolvedDataPath)) {
      throw new Error(`data-file must be an existing file path. Received: ${args["data-file"]}`);
    }
    normalizedArgs.push("--data-file", resolvedDataPath);
  }

  if (args.config !== undefined) {
    if (!looksLikeJson(args.config)) {
      throw new Error("--config only accepts inline JSON. Use --config-file for file paths.");
    }
    normalizedArgs.push("--config", args.config);
  }

  if (args.variant !== undefined) {
    if (!looksLikeJson(args.variant)) {
      throw new Error("--variant only accepts inline JSON.");
    }
    normalizedArgs.push("--variant", String(args.variant));
  }

  if (args["config-file"] !== undefined) {
    const resolvedConfigPath = path.resolve(args["config-file"]);
    if (!fs.existsSync(resolvedConfigPath)) {
      throw new Error(`config-file must be an existing file path. Received: ${args["config-file"]}`);
    }
    normalizedArgs.push("--config-file", resolvedConfigPath);
  }

  await runChartScript(normalizedArgs);
}

async function main(argv: string[] = process.argv.slice(2)) {
  const [command, ...rest] = argv;

  if (!command) {
    printMainHelp();
    return;
  }

  if (!KNOWN_COMMANDS.has(command)) {
    await runDirect(argv);
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    printMainHelp();
    return;
  }

  if (command === "deps") {
    runDeps(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  main().catch((error: any) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

export {
  main
};
