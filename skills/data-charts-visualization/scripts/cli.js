#!/usr/bin/env node

"use strict";

const { execFileSync } = require("child_process");

const { CHART_CONFIG_FILE_MAP, SKILL_DIR, parseArgv, runChartScript } = require("./lib/skill_runtime");

const SUPPORTED_CHART_TYPES = Object.keys(CHART_CONFIG_FILE_MAP);

function hasDependency(name) {
  try {
    require.resolve(name, { paths: [SKILL_DIR] });
    return true;
  } catch (error) {
    return false;
  }
}

function printMainHelp() {
  console.log(
    [
      "Usage:",
      "  data-charts-visualization render --chart-type <type> --option <file> --output <file>",
      "  data-charts-visualization render <chartType> --option <file> --output <file>",
      "  data-charts-visualization deps [--install]",
      "",
      "Commands:",
      "  render    Render one chart image from option JSON",
      "  deps      Inspect or install local Node dependencies",
      "  help      Show this message",
      "",
      `Supported chart types: ${SUPPORTED_CHART_TYPES.join(", ")}`
    ].join("\n")
  );
}

function printRenderHelp() {
  console.log(
    [
      "Usage:",
      "  data-charts-visualization render --chart-type <type> --option <file> --output <file>",
      "  data-charts-visualization render <chartType> --option <file> --output <file>",
      "",
      "Flags:",
      "  --chart-type <type>             Chart type if not passed positionally",
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
      "  --height-px <px>                Render height in pixels",
      "",
      `Supported chart types: ${SUPPORTED_CHART_TYPES.join(", ")}`
    ].join("\n")
  );
}

function assertChartType(chartType) {
  if (!chartType) {
    throw new Error(`Missing chart type. Supported values: ${SUPPORTED_CHART_TYPES.join(", ")}`);
  }
  if (!SUPPORTED_CHART_TYPES.includes(chartType)) {
    throw new Error(`Unsupported chart type "${chartType}". Supported values: ${SUPPORTED_CHART_TYPES.join(", ")}`);
  }
}

function resolveRenderChartType(argv) {
  const args = parseArgv(argv);
  return args["chart-type"] || args.positionals[0];
}

async function runRender(argv) {
  const args = parseArgv(argv);
  if (args.help) {
    printRenderHelp();
    return;
  }

  const chartType = resolveRenderChartType(argv);
  assertChartType(chartType);
  await runChartScript(chartType, argv);
}

function runDeps(argv) {
  const args = parseArgv(argv);
  if (args.install) {
    execFileSync("npm", ["install"], {
      cwd: SKILL_DIR,
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

  console.log(`Dependencies are installed in ${SKILL_DIR}/node_modules`);
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printMainHelp();
    return;
  }

  if (command === "render") {
    await runRender(rest);
    return;
  }

  if (command === "deps") {
    runDeps(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  SUPPORTED_CHART_TYPES
};
