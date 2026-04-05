import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const packageRoot = path.resolve(import.meta.dirname);
const entryFile = path.join(packageRoot, "src", "cli.ts");
const outdir = path.join(packageRoot, "dist");
const outfile = path.join(outdir, "cli.js");

await fs.promises.mkdir(outdir, { recursive: true });

await build({
  entryPoints: [entryFile],
  outfile,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: ["node18"],
  sourcemap: false,
  minify: true,
  legalComments: "none",
  external: ["sharp"],
  banner: {
    js: "#!/usr/bin/env node"
  },
  loader: {
    ".json": "json"
  }
});

await fs.promises.chmod(outfile, 0o755);
console.log(`Built CLI bundle: ${outfile}`);
