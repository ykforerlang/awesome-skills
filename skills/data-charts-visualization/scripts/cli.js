#!/usr/bin/env node

"use strict";

const { main } = require("../../../skills-scripts/data-charts-visualization/dist/cli");

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
