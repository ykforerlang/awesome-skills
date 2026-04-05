import path from "node:path";
import { build } from "esbuild";

const targetRoot = path.resolve(import.meta.dirname);
const helperRoot = path.resolve(targetRoot, "..");
const entryFile = path.join(targetRoot, "mini_program_echarts_entry.ts");
const outputFile = path.join(
  helperRoot,
  "mini-program",
  "ec-canvas",
  "echarts.js"
);

await build({
  entryPoints: [entryFile],
  outfile: outputFile,
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: ["es2018"],
  minify: true,
  treeShaking: true,
  sourcemap: false,
  legalComments: "eof"
});

console.log(`Built mini-program ECharts bundle: ${outputFile}`);
