#!/usr/bin/env node

"use strict";

const { main } = require("./cli");

main(["render", "--chart-type", "area", ...process.argv.slice(2)]).catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
