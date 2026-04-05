(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  const runtimeDefinitions = factory();
  root.DataChartsRuntimeDefinitions = runtimeDefinitions;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CHART_RUNTIME_DEFINITIONS = Object.freeze({
    line: Object.freeze({
      styleFile: "line_style.json",
      supportsLegend: true,
      usesGrid: true,
      usesCartesian: true,
      supportsPlotArea: false
    }),
    bar: Object.freeze({
      styleFile: "bar_style.json",
      supportsLegend: true,
      usesGrid: true,
      usesCartesian: true,
      supportsPlotArea: false
    }),
    pie: Object.freeze({
      styleFile: "pie_style.json",
      supportsLegend: true,
      usesGrid: false,
      usesCartesian: false,
      supportsPlotArea: true
    }),
    gauge: Object.freeze({
      styleFile: "gauge_style.json",
      supportsLegend: false,
      usesGrid: false,
      usesCartesian: false,
      supportsPlotArea: true
    }),
    area: Object.freeze({
      styleFile: "area_style.json",
      supportsLegend: true,
      usesGrid: true,
      usesCartesian: true,
      supportsPlotArea: false
    }),
    dualAxis: Object.freeze({
      styleFile: "dual_axis_style.json",
      supportsLegend: true,
      usesGrid: true,
      usesCartesian: true,
      supportsPlotArea: false
    }),
    scatter: Object.freeze({
      styleFile: "scatter_style.json",
      supportsLegend: true,
      usesGrid: true,
      usesCartesian: true,
      supportsPlotArea: false
    }),
    radar: Object.freeze({
      styleFile: "radar_style.json",
      supportsLegend: true,
      usesGrid: false,
      usesCartesian: false,
      supportsPlotArea: true
    }),
    funnel: Object.freeze({
      styleFile: "funnel_style.json",
      supportsLegend: true,
      usesGrid: false,
      usesCartesian: false,
      supportsPlotArea: true
    })
  });

  function getChartRuntimeDefinition(chartType) {
    return CHART_RUNTIME_DEFINITIONS[chartType] || null;
  }

  return {
    CHART_RUNTIME_DEFINITIONS,
    getChartRuntimeDefinition
  };
});
