#!/usr/bin/env node

"use strict";

const { main } = require("./cli");

main(["deps", ...process.argv.slice(2)]).catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
