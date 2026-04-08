(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.DataChartsDefaultConfig = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function getRuntimeDefinitionsModule() {
    if (typeof module === "object" && module.exports) {
      return require("./chart-runtime-definitions.js");
    }
    if (typeof globalThis !== "undefined") {
      return globalThis.DataChartsRuntimeDefinitions || null;
    }
    return null;
  }

  function getChartRuntimeDefinition(chartType) {
    const runtimeDefinitionsModule = getRuntimeDefinitionsModule();
    const definition = runtimeDefinitionsModule
      && runtimeDefinitionsModule.CHART_RUNTIME_DEFINITIONS
      && runtimeDefinitionsModule.CHART_RUNTIME_DEFINITIONS[chartType];
    if (!definition) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }
    return definition;
  }

  function deepClone(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(base, patch) {
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

  function compactObject(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => compactObject(item))
        .filter((item) => item !== undefined);
    }
    if (!isObject(value)) {
      return value === undefined ? undefined : value;
    }
    const result = {};
    Object.entries(value).forEach(([key, item]) => {
      const cleaned = compactObject(item);
      const isEmptyObject = isObject(cleaned) && Object.keys(cleaned).length === 0;
      const isEmptyArray = Array.isArray(cleaned) && cleaned.length === 0;
      if (cleaned !== undefined && !isEmptyObject && !isEmptyArray) {
        result[key] = cleaned;
      }
    });
    return result;
  }

  function normalizePaletteValue(value) {
    if (Array.isArray(value)) {
      return deepClone(value);
    }
    return String(value || "")
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const COMMON_DEFAULTS_BY_LOCALE = {
    en: {
      titleShow: true,
      subtitleShow: true,
      titleAlign: "left",
      titleFontSize: 24,
      titleColor: "#1f2937",
      titleBold: true,
      subtitleFontSize: 14,
      subtitleColor: "#6b7280",
      backgroundColor: "#ffffff",
      legendFontSize: 12,
      legendColor: "#4b5563",
      palette: "#5470c6, #91cc75, #fac858, #ee6666, #73c0de",
      legendShow: true,
      legendPosition: "top-left",
      legendOrient: "horizontal",
      xSplitLineShow: false,
      xSplitLineColor: "#e5e7eb",
      xSplitLineType: "dashed",
      xSplitLineWidth: 0.6,
      xAxisLabelFontSize: 12,
      xAxisLabelColor: "#4b5563",
      xAxisLineShow: true,
      xAxisTickShow: true,
      xAxisLineColor: "#9ca3af",
      xFormatter: "{value}",
      xRotate: 0,
      yAxisLabelFontSize: 12,
      yAxisLabelColor: "#4b5563",
      yAxisLineShow: false,
      yAxisTickShow: true,
      yAxisLineColor: "#9ca3af",
      yAxisScale: false,
      yFormatter: "{value}",
      splitLineShow: true,
      splitLineDisplay: "left",
      splitLineColor: "#e5e7eb",
      splitLineType: "dashed",
      splitLineWidth: 0.6,
      gridLeft: "12%",
      gridRight: "9%",
      gridTop: "21%",
      gridBottom: "15%",
    },
    zh: {
      titleShow: true,
      subtitleShow: true,
      titleAlign: "left",
      titleFontSize: 24,
      titleColor: "#1f2937",
      titleBold: true,
      subtitleFontSize: 14,
      subtitleColor: "#6b7280",
      backgroundColor: "#ffffff",
      legendFontSize: 12,
      legendColor: "#4b5563",
      palette: "#5470c6, #91cc75, #fac858, #ee6666, #73c0de",
      legendShow: true,
      legendPosition: "top-left",
      legendOrient: "horizontal",
      xSplitLineShow: false,
      xSplitLineColor: "#e5e7eb",
      xSplitLineType: "dashed",
      xSplitLineWidth: 0.6,
      xAxisLabelFontSize: 12,
      xAxisLabelColor: "#4b5563",
      xAxisLineShow: true,
      xAxisTickShow: true,
      xAxisLineColor: "#9ca3af",
      xFormatter: "{value}",
      xRotate: 0,
      yAxisLabelFontSize: 12,
      yAxisLabelColor: "#4b5563",
      yAxisLineShow: false,
      yAxisTickShow: true,
      yAxisLineColor: "#9ca3af",
      yAxisScale: false,
      yFormatter: "{value}",
      splitLineShow: true,
      splitLineDisplay: "left",
      splitLineColor: "#e5e7eb",
      splitLineType: "dashed",
      splitLineWidth: 0.6,
      gridLeft: "12%",
      gridRight: "9%",
      gridTop: "21%",
      gridBottom: "15%",
    },
  };

  const BEAUTY_DEFAULTS_BY_CHART = {
    line: {
      common: {
        titleAlign: "center",
        backgroundColor: "#fafafa",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        yAxisLineShow: true,
        xRotate: 0,
        splitLineShow: true,
        splitLineType: "dashed",
        xSplitLineShow: false,
        gridLeft: "12%",
        gridRight: "9%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        smooth: true,
        showSymbol: true,
        connectNulls: false,
        showLabel: true,
        lineWidth: 4,
        symbolSize: 8,
      },
    },
    bar: {
      common: {
        titleAlign: "center",
        backgroundColor: "#fafafa",
        palette: "#2563eb, #06b6d4, #f59e0b, #ef4444, #84cc16",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        yAxisLineShow: true,
        splitLineShow: true,
        splitLineType: "dashed",
        xSplitLineShow: false,
        gridLeft: "12%",
        gridRight: "9%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        showLabel: true,
        barGap: "10%",
        borderRadius: 0,
      },
    },
    pie: {
      common: {
        titleAlign: "center",
        backgroundColor: "#ffffff",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-right",
        legendOrient: "vertical",
        gridLeft: "30%",
        gridRight: "30%",
        gridTop: "30%",
        gridBottom: "15%",
      },
      specific: {
        labelPosition: "outside",
        startAngle: 90,
        labelLineWidth: 1,
      },
    },
    gauge: {
      common: {
        titleAlign: "center",
        backgroundColor: "#ffffff",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: false,
        gridLeft: "15%",
        gridRight: "15%",
        gridTop: "15%",
        gridBottom: "15%",
      },
      specific: {
        progressShow: true,
        titleShow: true,
        detailShow: true,
        detailFontSize: 24,
        axisLabelShow: true,
        axisTickShow: true,
        splitLineShow: true,
        axisLabelDistance: 14,
        anchorSize: "12",
        titleFontSize: 14,
        axisLabelFontSize: 12,
      },
    },
    area: {
      common: {
        titleAlign: "center",
        backgroundColor: "#fafafa",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        yAxisLineShow: true,
        xRotate: 0,
        splitLineShow: true,
        splitLineType: "dashed",
        xSplitLineShow: false,
        gridLeft: "12%",
        gridRight: "9%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        smooth: true,
        showSymbol: true,
        connectNulls: false,
        showLabel: true,
        areaOpacity: 0.24,
        areaFillMode: "gradient",
        lineWidth: 3,
        symbolSize: 6,
      },
    },
    dualAxis: {
      common: {
        titleAlign: "center",
        backgroundColor: "#fafafa",
        palette: "#2563eb, #ef4444, #14b8a6, #f59e0b, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        splitLineShow: true,
        splitLineDisplay: "left",
        splitLineType: "dashed",
        xSplitLineShow: false,
        gridLeft: "12%",
        gridRight: "12%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        leftBarGap: "10%",
        leftLineSmooth: true,
        leftLineArea: false,
        leftLineShowSymbol: false,
        leftLineConnectNulls: false,
        rightBarGap: "10%",
        rightLineSmooth: true,
        rightLineArea: false,
        rightLineShowSymbol: false,
        rightLineConnectNulls: false,
        leftBarBorderRadius: 0,
        rightBarBorderRadius: 0,
        leftLineWidth: 4,
        rightLineWidth: 4,
        leftLineSymbolSize: 8,
        rightLineSymbolSize: 8,
      },
    },
    scatter: {
      common: {
        titleAlign: "center",
        backgroundColor: "#fafafa",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        yAxisLineShow: true,
        splitLineShow: true,
        splitLineType: "dashed",
        xSplitLineShow: true,
        xSplitLineType: "dashed",
        gridLeft: "12%",
        gridRight: "9%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        showLabel: false,
        symbolSize: 64,
      },
    },
    radar: {
      common: {
        titleAlign: "center",
        backgroundColor: "#ffffff",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        gridLeft: "30%",
        gridRight: "30%",
        gridTop: "30%",
        gridBottom: "15%",
      },
      specific: {
        shape: "polygon",
        splitNumber: 5,
        showSymbol: false,
        showLabel: false,
        labelFontSize: 12,
        labelFormatter: "{b}: {c}",
        areaOpacity: 0.2,
        axisNameBold: true,
        lineWidth: 3,
        symbolSize: 6,
        axisNameFontSize: 12,
      },
    },
    funnel: {
      common: {
        titleAlign: "center",
        backgroundColor: "#ffffff",
        palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
        legendShow: true,
        legendPosition: "bottom-center",
        legendOrient: "horizontal",
        gridLeft: "12%",
        gridRight: "12%",
        gridTop: "21%",
        gridBottom: "15%",
      },
      specific: {
        sort: "descending",
        showLabel: true,
        labelPosition: "inside",
        gap: 2,
        minSize: "12%",
        maxSize: "88%",
        labelFormatter: "{b}: {d}%",
      },
    },
  };

  const DEFAULT_SPECIFIC_BY_CHART = {
    line: {
      smooth: true,
      showSymbol: true,
      connectNulls: false,
      showLabel: true,
      symbol: "circle",
      symbolSize: 8,
      lineStyleType: "solid",
      lineWidth: 4,
      labelFontSize: 12,
      labelColor: "#334155",
    },
    bar: {
      showLabel: true,
      barGap: "10%",
      labelPosition: "top",
      labelFontSize: 12,
      labelColor: "#334155",
      itemOpacity: 0.92,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "#ffffff",
    },
    area: {
      smooth: true,
      showSymbol: true,
      symbol: "circle",
      symbolSize: 6,
      connectNulls: false,
      showLabel: true,
      areaOpacity: 0.24,
      areaFillMode: "gradient",
      lineStyleType: "solid",
      lineWidth: 3,
      labelFontSize: 12,
      labelColor: "#334155",
    },
    dualAxis: {
      leftAxisLabelFontSize: 12,
      leftAxisLabelColor: "#9ca3af",
      leftAxisLineShow: true,
      leftAxisLineColor: "#9ca3af",
      leftAxisTickShow: true,
      leftAxisFormatter: "{value}",
      leftBarShowLabel: true,
      leftBarLabelPosition: "top",
      leftBarLabelFontSize: 12,
      leftBarLabelColor: "#334155",
      leftBarOpacity: 0.92,
      leftBarGap: "10%",
      leftBarBorderRadius: 0,
      leftBarBorderWidth: 0,
      leftBarBorderColor: "#ffffff",
      leftBarColors: "#5470c6, #73c0de, #91cc75",
      leftLineSmooth: true,
      leftLineArea: false,
      leftLineShowSymbol: false,
      leftLineConnectNulls: false,
      leftLineShowLabel: false,
      leftLineColors: "#5470c6, #3b82f6, #06b6d4",
      leftLineStyleType: "solid",
      leftLineWidth: 4,
      leftLineSymbol: "circle",
      leftLineSymbolSize: 8,
      leftLineLabelFontSize: 12,
      leftLineLabelColor: "#334155",
      rightAxisLabelFontSize: 12,
      rightAxisLabelColor: "#9ca3af",
      rightAxisLineShow: true,
      rightAxisLineColor: "#9ca3af",
      rightAxisTickShow: true,
      rightAxisFormatter: "{value}",
      rightBarShowLabel: true,
      rightBarLabelPosition: "top",
      rightBarLabelFontSize: 12,
      rightBarLabelColor: "#334155",
      rightBarOpacity: 0.92,
      rightBarGap: "10%",
      rightBarBorderRadius: 0,
      rightBarBorderWidth: 0,
      rightBarBorderColor: "#ffffff",
      rightBarColors: "#ef4444, #f97316, #f59e0b",
      rightLineSmooth: true,
      rightLineArea: false,
      rightLineShowSymbol: false,
      rightLineConnectNulls: false,
      rightLineShowLabel: false,
      rightLineColors: "#ef4444, #f97316, #f59e0b",
      rightLineStyleType: "solid",
      rightLineWidth: 4,
      rightLineSymbol: "circle",
      rightLineSymbolSize: 8,
      rightLineLabelFontSize: 12,
      rightLineLabelColor: "#334155",
    },
    scatter: {
      showLabel: false,
      labelFormatter: "{a}",
      symbolSize: 64,
      symbol: "circle",
      itemOpacity: 0.92,
      borderWidth: 0,
      borderColor: "#ffffff",
      labelFontSize: 12,
      labelColor: "#334155",
    },
    pie: {
      labelPosition: "outside",
      startAngle: 90,
      showLabel: true,
      labelFontSize: 12,
      labelColor: "#334155",
      labelFormatter: "{b} {d}%",
      labelLineShow: true,
      labelLineColor: "#94a3b8",
      labelLineWidth: 1,
      itemOpacity: 0.96,
      borderWidth: 0,
      borderColor: "#ffffff",
    },
    gauge: {
      startAngle: 225,
      endAngle: -45,
      progressShow: true,
      progressWidth: 11,
      progressColor: "#5470c6",
      axisWidth: 11,
      bandStops: "#22c55e, #84cc16, #facc15, #f97316, #ef4444",
      titleShow: true,
      titleFontSize: 14,
      titleColor: "#6e7079",
      detailShow: true,
      detailFormatter: "{value}%",
      detailFontSize: 24,
      detailColor: "#464646",
      axisLabelShow: true,
      axisLabelDistance: 14,
      axisLabelFontSize: 12,
      axisLabelColor: "#6e7079",
      splitLineShow: true,
      splitLineLength: 7,
      splitLineWidth: 1.1,
      splitLineColor: "#6e7079",
      axisTickShow: true,
      axisTickLength: 3,
      axisTickWidth: 0.6,
      axisTickColor: "#999999",
      pointerShow: true,
      pointerWidth: "2",
      pointerColor: "#2f4554",
      anchorShow: true,
      anchorSize: "12",
      anchorColor: "#2f4554",
    },
    radar: {
      shape: "polygon",
      splitNumber: 5,
      showSymbol: false,
      showLabel: false,
      labelFormatter: "{b}: {c}",
      areaOpacity: 0.2,
      splitLineColor: "#d0d7de",
      splitLineWidth: 0.5,
      splitLineType: "solid",
      axisLineColor: "#94a3b8",
      axisLineWidth: 0.6,
      axisLineType: "solid",
      axisNameFontSize: 12,
      axisNameColor: "#334155",
      axisNameBold: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyleType: "solid",
      lineWidth: 3,
      labelFontSize: 12,
      labelColor: "#334155",
    },
    funnel: {
      sort: "descending",
      gap: 2,
      minSize: "12%",
      maxSize: "88%",
      itemOpacity: 0.92,
      labelPosition: "inside",
      showLabel: true,
      labelFormatter: "{b}: {d}%",
      labelFontSize: 12,
      labelColor: "#334155",
    },
  };

  const DEFAULT_PREVIEW_BY_CHART = {
    line: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    bar: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    area: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    dualAxis: {
      previewStackMode: false,
      previewBarHorizontal: false,
      previewPieMode: "donut"
    },
    scatter: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    pie: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    gauge: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    radar: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
    funnel: { previewStackMode: false, previewBarHorizontal: false, previewPieMode: "donut" },
  };

  function getCommonDefaults(locale) {
    return deepClone(COMMON_DEFAULTS_BY_LOCALE[locale] || COMMON_DEFAULTS_BY_LOCALE.en);
  }

  function getBeautyDefaults(chartType) {
    return deepClone(BEAUTY_DEFAULTS_BY_CHART[chartType] || { common: {}, specific: {} });
  }

  function getDefaultSpecificState(chartType) {
    return deepClone(DEFAULT_SPECIFIC_BY_CHART[chartType] || {});
  }

  function getDefaultPreviewState(chartType) {
    return deepClone(DEFAULT_PREVIEW_BY_CHART[chartType] || DEFAULT_PREVIEW_BY_CHART.line);
  }

  function getDefaultCommonState(chartType, locale) {
    const beautyDefaults = BEAUTY_DEFAULTS_BY_CHART[chartType] || {};
    return deepMerge(getCommonDefaults(locale), beautyDefaults.common || {});
  }

  function buildRawHelperConfig(chartType, commonState, specificState, options) {
    return {
      chartType,
      common: buildHelperCommonState(chartType, commonState),
      specific: buildHelperSpecificState(chartType, specificState),
    };
  }

  function pruneHelperConfig(chartType, helperConfig) {
    const runtimeDefinition = getChartRuntimeDefinition(chartType);
    const nextConfig = deepClone(helperConfig || {});
    if (!isObject(nextConfig.common)) {
      return nextConfig;
    }

    if (runtimeDefinition.supportsLegend === false) {
      delete nextConfig.common.legend;
    }
    if (!runtimeDefinition.usesCartesian) {
      delete nextConfig.common.axes;
      delete nextConfig.common.splitLines;
    }
    if (chartType !== "dualAxis" && isObject(nextConfig.common.splitLines) && isObject(nextConfig.common.splitLines.horizontal)) {
      delete nextConfig.common.splitLines.horizontal.display;
    }

    nextConfig.common = compactObject(nextConfig.common);
    return compactObject(nextConfig);
  }

  function buildHelperConfig(chartType, commonState, specificState, options) {
    return pruneHelperConfig(
      chartType,
      buildRawHelperConfig(chartType, commonState, specificState, options),
    );
  }

  function buildHelperCommonState(chartType, commonState) {
    const source = deepClone(commonState || {});
    const horizontalSplitLine = {
      show: source.splitLineShow,
      color: source.splitLineColor,
      type: source.splitLineType,
      width: source.splitLineWidth,
    };
    if (chartType === "dualAxis") {
      horizontalSplitLine.display = source.splitLineDisplay;
    }
    return {
      title: {
        main: {
          show: source.titleShow,
          align: source.titleAlign,
          fontSize: source.titleFontSize,
          color: source.titleColor,
          bold: source.titleBold,
        },
        subtitle: {
          show: source.subtitleShow,
          fontSize: source.subtitleFontSize,
          color: source.subtitleColor,
        },
      },
      canvas: {
        backgroundColor: source.backgroundColor,
        palette: normalizePaletteValue(source.palette),
        plotArea: {
          left: source.gridLeft,
          right: source.gridRight,
          top: source.gridTop,
          bottom: source.gridBottom,
        },
      },
      legend: {
        show: source.legendShow,
        position: source.legendPosition,
        orient: source.legendOrient,
        fontSize: source.legendFontSize,
        color: source.legendColor,
      },
      axes: {
        x: {
          lineShow: source.xAxisLineShow,
          tickShow: source.xAxisTickShow,
          rotate: source.xRotate,
          labelFontSize: source.xAxisLabelFontSize,
          labelColor: source.xAxisLabelColor,
          lineColor: source.xAxisLineColor,
          formatter: source.xFormatter,
        },
        y: {
          lineShow: source.yAxisLineShow,
          tickShow: source.yAxisTickShow,
          labelFontSize: source.yAxisLabelFontSize,
          labelColor: source.yAxisLabelColor,
          lineColor: source.yAxisLineColor,
          scale: source.yAxisScale,
          formatter: source.yFormatter,
        },
      },
      splitLines: {
        horizontal: horizontalSplitLine,
        vertical: {
          show: source.xSplitLineShow,
          color: source.xSplitLineColor,
          type: source.xSplitLineType,
          width: source.xSplitLineWidth,
        },
      },
    };
  }

  function buildHelperSpecificState(chartType, specificState) {
    const source = deepClone(specificState || {});
    switch (chartType) {
      case "line":
        return {
          line: {
            smooth: source.smooth,
            showSymbol: source.showSymbol,
            connectNulls: source.connectNulls,
            symbol: source.symbol,
            symbolSize: source.symbolSize,
            lineStyleType: source.lineStyleType,
            lineWidth: source.lineWidth,
          },
          dataLabels: {
            show: source.showLabel,
            formatter: source.labelFormatter,
            fontSize: source.labelFontSize,
            color: source.labelColor,
          },
        };
      case "bar":
        return {
          bar: {
            barGap: source.barGap,
            itemOpacity: source.itemOpacity,
            borderRadius: source.borderRadius,
            borderWidth: source.borderWidth,
            borderColor: source.borderColor,
          },
          dataLabels: {
            show: source.showLabel,
            position: source.labelPosition,
            fontSize: source.labelFontSize,
            color: source.labelColor,
          },
        };
      case "area":
        return {
          area: {
            smooth: source.smooth,
            showSymbol: source.showSymbol,
            symbol: source.symbol,
            symbolSize: source.symbolSize,
            connectNulls: source.connectNulls,
            areaOpacity: source.areaOpacity,
            areaFillMode: source.areaFillMode,
            lineStyleType: source.lineStyleType,
            lineWidth: source.lineWidth,
          },
          dataLabels: {
            show: source.showLabel,
            fontSize: source.labelFontSize,
            color: source.labelColor,
          },
        };
      case "dualAxis":
        return {
          leftAxis: {
            labelFontSize: source.leftAxisLabelFontSize,
            labelColor: source.leftAxisLabelColor,
            lineShow: source.leftAxisLineShow,
            lineColor: source.leftAxisLineColor,
            tickShow: source.leftAxisTickShow,
            formatter: source.leftAxisFormatter,
          },
          rightAxis: {
            labelFontSize: source.rightAxisLabelFontSize,
            labelColor: source.rightAxisLabelColor,
            lineShow: source.rightAxisLineShow,
            lineColor: source.rightAxisLineColor,
            tickShow: source.rightAxisTickShow,
            formatter: source.rightAxisFormatter,
          },
          leftBar: {
            showLabel: source.leftBarShowLabel,
            labelPosition: source.leftBarLabelPosition,
            labelFontSize: source.leftBarLabelFontSize,
            labelColor: source.leftBarLabelColor,
            opacity: source.leftBarOpacity,
            barGap: source.leftBarGap,
            borderRadius: source.leftBarBorderRadius,
            borderWidth: source.leftBarBorderWidth,
            borderColor: source.leftBarBorderColor,
            colors: normalizePaletteValue(source.leftBarColors),
          },
          rightBar: {
            showLabel: source.rightBarShowLabel,
            labelPosition: source.rightBarLabelPosition,
            labelFontSize: source.rightBarLabelFontSize,
            labelColor: source.rightBarLabelColor,
            opacity: source.rightBarOpacity,
            barGap: source.rightBarGap,
            borderRadius: source.rightBarBorderRadius,
            borderWidth: source.rightBarBorderWidth,
            borderColor: source.rightBarBorderColor,
            colors: normalizePaletteValue(source.rightBarColors),
          },
          leftLine: {
            smooth: source.leftLineSmooth,
            area: source.leftLineArea,
            showSymbol: source.leftLineShowSymbol,
            connectNulls: source.leftLineConnectNulls,
            showLabel: source.leftLineShowLabel,
            colors: normalizePaletteValue(source.leftLineColors),
            lineStyleType: source.leftLineStyleType,
            lineWidth: source.leftLineWidth,
            symbol: source.leftLineSymbol,
            symbolSize: source.leftLineSymbolSize,
            labelFontSize: source.leftLineLabelFontSize,
            labelColor: source.leftLineLabelColor,
          },
          rightLine: {
            smooth: source.rightLineSmooth,
            area: source.rightLineArea,
            showSymbol: source.rightLineShowSymbol,
            connectNulls: source.rightLineConnectNulls,
            showLabel: source.rightLineShowLabel,
            colors: normalizePaletteValue(source.rightLineColors),
            lineStyleType: source.rightLineStyleType,
            lineWidth: source.rightLineWidth,
            symbol: source.rightLineSymbol,
            symbolSize: source.rightLineSymbolSize,
            labelFontSize: source.rightLineLabelFontSize,
            labelColor: source.rightLineLabelColor,
          },
        };
      case "scatter":
        return {
          point: {
            symbol: source.symbol,
            symbolSize: source.symbolSize,
            itemOpacity: source.itemOpacity,
            borderWidth: source.borderWidth,
            borderColor: source.borderColor,
          },
          dataLabels: {
            show: source.showLabel,
            formatter: source.labelFormatter,
            fontSize: source.labelFontSize,
            color: source.labelColor,
          },
        };
      case "pie":
        return deepClone(source);
      case "gauge":
      case "radar":
      case "funnel":
        return deepClone(source);
      default:
        return deepClone(source);
    }
  }

  function getDefaultHelperConfig(chartType, locale, options) {
    const cfg = options || {};
    return buildHelperConfig(
      chartType,
      getDefaultCommonState(chartType, locale),
      getDefaultSpecificState(chartType),
      { dualAxisTypes: cfg.dualAxisTypes }
    );
  }

  return {
    COMMON_DEFAULTS_BY_LOCALE,
    BEAUTY_DEFAULTS_BY_CHART,
    DEFAULT_SPECIFIC_BY_CHART,
    DEFAULT_PREVIEW_BY_CHART,
    getCommonDefaults,
    getBeautyDefaults,
    getDefaultCommonState,
    getDefaultSpecificState,
    getDefaultPreviewState,
    buildRawHelperConfig,
    buildHelperConfig,
    pruneHelperConfig,
    getDefaultHelperConfig,
  };
});
