(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.DataChartsOptionBuilder = factory();
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
    const chartRuntimeDefinitions = runtimeDefinitionsModule && runtimeDefinitionsModule.CHART_RUNTIME_DEFINITIONS;
    const definition = chartRuntimeDefinitions && chartRuntimeDefinitions[chartType];
    if (!definition) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }
    return definition;
  }

  const DUAL_AXIS_COLOR_LIST_FALLBACKS = {
    leftBarColors: ["#5470c6", "#73c0de", "#91cc75"],
    leftLineColors: ["#5470c6", "#3b82f6", "#06b6d4"],
    rightBarColors: ["#ef4444", "#f97316", "#f59e0b"],
    rightLineColors: ["#ef4444", "#f97316", "#f59e0b"]
  };

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

  function numberOr(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function optionalNumber(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  function normalizeStrokeType(value) {
    return value === "solid" || value === "dashed" || value === "dotted" ? value : "dashed";
  }

  function parsePalette(raw) {
    if (Array.isArray(raw)) {
      return raw.filter(Boolean);
    }
    return String(raw || "")
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeColorValue(color) {
    return String(color || "#ffffff").trim().toLowerCase();
  }

  function parseGaugeBandColorsText(rawValue) {
    const fallback = ["#22c55e", "#84cc16", "#facc15", "#f97316", "#ef4444"];
    const source = String(rawValue || "").trim();
    if (!source) {
      return fallback;
    }
    const parsed = source
      .split(",")
      .map((segment) => normalizeColorValue(segment))
      .filter(Boolean);
    return parsed.length ? parsed : fallback;
  }

  function parseColorListText(rawValue, fallback) {
    const fallbackList = Array.isArray(fallback) && fallback.length ? fallback : ["#e2e8f0"];
    const source = String(rawValue || "").trim();
    if (!source) {
      return fallbackList;
    }
    const parsed = source
      .split(",")
      .map((segment) => normalizeColorValue(segment))
      .filter(Boolean);
    return parsed.length ? parsed : fallbackList;
  }

  function supportsPreviewSeriesCount(chartType) {
    return chartType === "line"
      || chartType === "bar"
      || chartType === "area"
      || chartType === "dualAxis"
      || chartType === "scatter";
  }

  function trimSeriesListForPreview(seriesList, targetCount) {
    const sourceSeries = Array.isArray(seriesList) ? seriesList.filter(Boolean) : [];
    if (!sourceSeries.length || !Number.isFinite(targetCount) || targetCount <= 0) {
      return sourceSeries;
    }
    return deepClone(sourceSeries.slice(0, targetCount));
  }

  function resolveDualAxisPreviewSeriesCounts(previewState) {
    const fallbackCount = numberOr(previewState && previewState.previewSeriesCount, 0);
    const leftCount = numberOr(previewState && previewState.previewDualAxisLeftSeriesCount, 0);
    const rightCount = numberOr(previewState && previewState.previewDualAxisRightSeriesCount, 0);
    return {
      leftCount: leftCount || fallbackCount,
      rightCount: rightCount || fallbackCount,
      hasSideCounts: leftCount > 0 || rightCount > 0
    };
  }

  function trimDualAxisSeriesListForPreview(rawData, previewState) {
    const sourceSeries = Array.isArray(rawData && rawData.series) ? rawData.series.filter(Boolean) : [];
    if (!sourceSeries.length) {
      return sourceSeries;
    }
    const previewCounts = resolveDualAxisPreviewSeriesCounts(previewState);
    if (!previewCounts.hasSideCounts) {
      return trimSeriesListForPreview(sourceSeries, numberOr(previewState && previewState.previewSeriesCount, 0));
    }

    const xAxes = Array.isArray(rawData && rawData.xAxis) ? rawData.xAxis : [rawData && rawData.xAxis ? rawData.xAxis : {}];
    const yAxes = Array.isArray(rawData && rawData.yAxis) ? rawData.yAxis : [rawData && rawData.yAxis ? rawData.yAxis : {}];
    const horizontal = (xAxes[0] && xAxes[0].type === "value" || xAxes[1] && xAxes[1].type === "value") && yAxes[0] && yAxes[0].type === "category";
    const counters = { left: 0, right: 0 };

    return deepClone(sourceSeries.filter((series, index) => {
      const side = resolveDualAxisSeriesSide(series, { horizontal }, index);
      const limit = side === "left" ? previewCounts.leftCount : previewCounts.rightCount;
      if (limit > 0 && counters[side] >= limit) {
        return false;
      }
      counters[side] += 1;
      return true;
    }));
  }

  function applyPreviewSeriesCount(chartType, rawData, previewState) {
    if (!supportsPreviewSeriesCount(chartType)) {
      return deepClone(rawData);
    }
    const nextRawData = deepClone(rawData || {});
    if (chartType === "dualAxis") {
      nextRawData.series = trimDualAxisSeriesListForPreview(nextRawData, previewState);
      return nextRawData;
    }
    const targetCount = numberOr(previewState && previewState.previewSeriesCount, 0);
    if (!targetCount) {
      return nextRawData;
    }
    nextRawData.series = trimSeriesListForPreview(nextRawData.series, targetCount);
    return nextRawData;
  }

  function applyStyleConfig(optionValue, styleValue, path) {
    const currentPath = path || [];
    if (styleValue === undefined || styleValue === null) {
      return deepClone(optionValue);
    }
    if (optionValue === undefined || optionValue === null) {
      return deepClone(styleValue);
    }

    if (isObject(optionValue) && isObject(styleValue)) {
      const merged = {};
      const keys = new Set(Object.keys(optionValue).concat(Object.keys(styleValue)));
      keys.forEach((key) => {
        merged[key] = applyStyleConfig(optionValue[key], styleValue[key], currentPath.concat(key));
      });
      return merged;
    }

    if (Array.isArray(optionValue) && Array.isArray(styleValue)) {
      const currentKey = currentPath[currentPath.length - 1] || "";
      if (currentKey === "series") {
        return applySeriesStyle(optionValue, styleValue, currentPath);
      }
      const dictLike = optionValue.concat(styleValue).every((item) => item === undefined || isObject(item));
      if (dictLike) {
        const maxLength = Math.max(optionValue.length, styleValue.length);
        const mergedItems = [];
        for (let index = 0; index < maxLength; index += 1) {
          mergedItems.push(applyStyleConfig(optionValue[index], styleValue[index], currentPath.concat(String(index))));
        }
        return mergedItems;
      }
      return styleValue.length ? deepClone(styleValue) : deepClone(optionValue);
    }

    return deepClone(styleValue);
  }

  function applySeriesStyle(optionSeries, styleSeries, path) {
    if (!styleSeries.length) {
      return deepClone(optionSeries);
    }
    if (!optionSeries.length) {
      return deepClone(styleSeries);
    }

    if (styleSeries.length === 1 && isObject(styleSeries[0])) {
      const template = styleSeries[0];
      return optionSeries.map((series, index) => {
        if (!isObject(series)) {
          return series;
        }
        const optionType = series.type;
        const styleType = template.type;
        if (optionType && styleType && optionType !== styleType) {
          return deepClone(series);
        }
        return applyStyleConfig(series, template, path.concat(String(index)));
      });
    }

    const merged = [];
    const maxLength = Math.max(optionSeries.length, styleSeries.length);
    for (let index = 0; index < maxLength; index += 1) {
      const optionItem = optionSeries[index];
      const styleItem = styleSeries[index];
      if (isObject(optionItem) && isObject(styleItem)) {
        const optionType = optionItem.type;
        const styleType = styleItem.type;
        if (optionType && styleType && optionType !== styleType) {
          merged.push(deepClone(optionItem));
        } else {
          merged.push(applyStyleConfig(optionItem, styleItem, path.concat(String(index))));
        }
      } else {
        merged.push(styleItem !== undefined ? deepClone(styleItem) : deepClone(optionItem));
      }
    }
    return merged;
  }

  function legendPlacement(position) {
    const placementMap = {
      "top-left": { left: "left", top: "top" },
      "top-center": { left: "center", top: "top" },
      "top-right": { left: "right", top: "top" },
      "middle-left": { left: "left", top: "middle" },
      "middle-right": { left: "right", top: "middle" },
      "bottom-left": { left: "left", top: "bottom" },
      "bottom-center": { left: "center", top: "bottom" },
      "bottom-right": { left: "right", top: "bottom" },
      top: { left: "center", top: "top" },
      right: { left: "right", top: "middle" },
      bottom: { left: "center", top: "bottom" },
      left: { left: "left", top: "middle" }
    };
    return placementMap[position] || placementMap["top-left"];
  }

  function buildCommonOption(commonState, runtimeDefinition) {
    const titleText = commonState.titleShow ? commonState.titleText : "";
    const subtitleText = commonState.subtitleShow ? commonState.subtitleText : "";
    const option = {
      title: {
        show: commonState.titleShow || commonState.subtitleShow,
        text: titleText,
        subtext: subtitleText,
        left: commonState.titleAlign
      },
      backgroundColor: commonState.backgroundColor,
      color: Array.isArray(commonState.palette) ? commonState.palette : parsePalette(commonState.palette)
    };

    if (runtimeDefinition.supportsLegend !== false) {
      option.legend = {
        show: commonState.legendShow,
        orient: commonState.legendOrient,
        ...legendPlacement(commonState.legendPosition)
      };
    }

    if (runtimeDefinition.usesGrid || runtimeDefinition.supportsPlotArea) {
      option.grid = {
        left: commonState.gridLeft,
        right: commonState.gridRight,
        top: commonState.gridTop,
        bottom: commonState.gridBottom
      };
    }

    return compactObject(option);
  }

  function buildBaseStyleConfig(commonState, runtimeDefinition) {
    const titleText = commonState.titleShow ? commonState.titleText : "";
    const subtitleText = commonState.subtitleShow ? commonState.subtitleText : "";
    const base = {
      color: Array.isArray(commonState.palette) ? commonState.palette : parsePalette(commonState.palette),
      backgroundColor: commonState.backgroundColor,
      title: {
        show: commonState.titleShow || commonState.subtitleShow,
        text: titleText,
        subtext: subtitleText,
        left: commonState.titleAlign,
        textStyle: {
          fontSize: commonState.titleFontSize,
          fontWeight: commonState.titleBold ? "bold" : "normal",
          color: commonState.titleColor
        },
        subtextStyle: {
          fontSize: commonState.subtitleFontSize,
          color: commonState.subtitleColor
        }
      }
    };

    if (runtimeDefinition.supportsLegend !== false) {
      base.legend = {
        show: commonState.legendShow,
        orient: commonState.legendOrient,
        ...legendPlacement(commonState.legendPosition),
        textStyle: {
          fontSize: commonState.legendFontSize,
          color: commonState.legendColor
        }
      };
    }

    if (runtimeDefinition.usesGrid || runtimeDefinition.supportsPlotArea) {
      base.grid = {
        left: commonState.gridLeft,
        right: commonState.gridRight,
        top: commonState.gridTop,
        bottom: commonState.gridBottom
      };
    }

    if (runtimeDefinition.usesCartesian) {
      base.xAxis = {
        axisLabel: {
          rotate: commonState.xRotate,
          fontSize: commonState.xAxisLabelFontSize,
          color: commonState.xAxisLabelColor,
          formatter: commonState.xFormatter
        },
        axisTick: {
          show: commonState.xAxisTickShow
        },
        axisLine: {
          show: commonState.xAxisLineShow,
          lineStyle: {
            color: commonState.xAxisLineColor
          }
        },
        splitLine: {
          show: commonState.xSplitLineShow,
          lineStyle: {
            color: commonState.xSplitLineColor,
            type: normalizeStrokeType(commonState.xSplitLineType),
            width: commonState.xSplitLineWidth
          }
        }
      };
      base.yAxis = {
        axisLabel: {
          fontSize: commonState.yAxisLabelFontSize,
          color: commonState.yAxisLabelColor,
          formatter: commonState.yFormatter
        },
        axisTick: {
          show: commonState.yAxisTickShow
        },
        axisLine: {
          show: commonState.yAxisLineShow,
          lineStyle: {
            color: commonState.yAxisLineColor
          }
        },
        splitLine: {
          show: commonState.splitLineShow,
          lineStyle: {
            color: commonState.splitLineColor,
            type: normalizeStrokeType(commonState.splitLineType),
            width: commonState.splitLineWidth
          }
        }
      };
    }

    return compactObject(base);
  }

  function buildStructurePatch(chartType, specificState) {
    switch (chartType) {
      case "line":
      case "area":
        return {
          xAxis: { type: "category" },
          yAxis: { type: "value" }
        };
      case "bar":
        return {
          xAxis: { type: "category" },
          yAxis: { type: "value" }
        };
      case "dualAxis":
        return specificState.horizontal
          ? {
              xAxis: [{ type: "value" }, { type: "value" }],
              yAxis: { type: "category" }
            }
          : {
              xAxis: { type: "category" },
              yAxis: [{ type: "value" }, { type: "value" }]
            };
      case "scatter":
        return {
          xAxis: { type: "value" },
          yAxis: { type: "value" }
        };
      default:
        return {};
    }
  }

  function clampLayoutPercent(value) {
    return Math.max(0, Math.min(42, Number(value) || 0));
  }

  function parseLayoutPercentValue(value, fallback) {
    if (typeof value === "string" && value.trim().endsWith("%")) {
      return clampLayoutPercent(Number.parseFloat(value));
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return clampLayoutPercent(numeric / 10);
    }
    return clampLayoutPercent(fallback);
  }

  function buildLayoutBox(commonState) {
    const left = parseLayoutPercentValue(commonState.gridLeft, 12);
    const right = parseLayoutPercentValue(commonState.gridRight, 9);
    const top = parseLayoutPercentValue(commonState.gridTop, 21);
    const bottom = parseLayoutPercentValue(commonState.gridBottom, 15);
    const width = Math.max(16, 100 - left - right);
    const height = Math.max(16, 100 - top - bottom);
    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
      centerX: left + width / 2,
      centerY: top + height / 2
    };
  }

  function parsePercentValue(value, fallback) {
    const parsed = Number.parseFloat(String(value).replace("%", ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function resolveLayoutCenterValues(layoutBox, centerX, centerY) {
    return {
      x: parsePercentValue(centerX, layoutBox.centerX),
      y: parsePercentValue(centerY, layoutBox.centerY)
    };
  }

  function buildCircularPlotMaxRadiusPercent(layoutBox, viewportSize) {
    const viewportWidth = Math.max(1, Number(viewportSize && viewportSize.width) || 0);
    const viewportHeight = Math.max(1, Number(viewportSize && viewportSize.height) || 0);
    const viewportShort = Math.min(viewportWidth, viewportHeight);
    const plotWidthPx = viewportWidth * (layoutBox.width / 100);
    const plotHeightPx = viewportHeight * (layoutBox.height / 100);
    const radiusPx = Math.min(plotWidthPx, plotHeightPx) / 2;
    return Math.max(10, (radiusPx / (viewportShort / 2)) * 100);
  }

  function buildCircleLayout(layoutBox, viewportSize, outerRatio, innerRatio) {
    const safeOuterRatio = outerRatio === undefined ? 1 : outerRatio;
    const safeInnerRatio = innerRatio === undefined ? 0 : innerRatio;
    const maxRadiusPercent = buildCircularPlotMaxRadiusPercent(layoutBox, viewportSize);
    const outer = Math.max(10, Math.round(maxRadiusPercent * safeOuterRatio));
    if (safeInnerRatio > 0) {
      return [`${Math.round(outer * safeInnerRatio)}%`, `${outer}%`];
    }
    return `${outer}%`;
  }

  function resolveLayoutCenter(layoutBox, centerX, centerY) {
    const resolved = resolveLayoutCenterValues(layoutBox, centerX, centerY);
    return [`${Math.round(resolved.x)}%`, `${Math.round(resolved.y)}%`];
  }

  function resolveGaugeLayoutCenter(layoutBox, centerX, centerY) {
    const autoCenterX = layoutBox.centerX;
    const autoCenterY = layoutBox.top + layoutBox.height * 0.58;
    const resolved = resolveLayoutCenterValues(
      layoutBox,
      centerX === "auto" ? autoCenterX : centerX,
      centerY === "auto" ? autoCenterY : centerY
    );
    return [`${Math.round(resolved.x)}%`, `${Math.round(resolved.y)}%`];
  }

  function resolveGaugeRadius(layoutBox, viewportSize) {
    return buildCircleLayout(layoutBox, viewportSize, 1);
  }

  function resolveRadarRadius(layoutBox, viewportSize) {
    return buildCircleLayout(layoutBox, viewportSize, 1);
  }

  function resolvePieRadius(layoutBox, viewportSize, pieMode) {
    const modeMap = {
      pie: { radius: buildCircleLayout(layoutBox, viewportSize, 1) },
      donut: { radius: buildCircleLayout(layoutBox, viewportSize, 1, 0.6), innerRatio: 0.6 },
      roseArea: { radius: buildCircleLayout(layoutBox, viewportSize, 1, 0.25), roseType: "area", innerRatio: 0.25 },
      roseRadius: { radius: buildCircleLayout(layoutBox, viewportSize, 1, 0.25), roseType: "radius", innerRatio: 0.25 }
    };
    return modeMap[pieMode] || modeMap.donut;
  }

  function resolveGaugeBands(specificState) {
    const colors = parseGaugeBandColorsText(specificState.bandStops);
    const bandCount = Math.max(colors.length, 1);
    return colors.map((color, index) => [Number(((index + 1) / bandCount).toFixed(4)), color]);
  }

  function normalizeGaugeFormatter(formatter) {
    if (typeof formatter !== "string") {
      return formatter;
    }
    return formatter.replaceAll("{c}", "{value}");
  }

  function hexToRgba(color, alpha) {
    const source = String(color || "").trim();
    const normalized = source.startsWith("#") ? source.slice(1) : source;
    const safeAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      const red = Number.parseInt(normalized.slice(0, 2), 16);
      const green = Number.parseInt(normalized.slice(2, 4), 16);
      const blue = Number.parseInt(normalized.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
    }
    if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
      const red = Number.parseInt(normalized[0] + normalized[0], 16);
      const green = Number.parseInt(normalized[1] + normalized[1], 16);
      const blue = Number.parseInt(normalized[2] + normalized[2], 16);
      return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
    }
    return color;
  }

  function resolveAreaFill(specificState, commonState, seriesIndex) {
    const nextSeriesIndex = seriesIndex || 0;
    const palette = Array.isArray(commonState && commonState.palette) && commonState.palette.length
      ? commonState.palette
      : ["#5470c6"];
    const baseColor = palette[nextSeriesIndex % palette.length] || palette[0];
    const topAlpha = Math.max(0, Math.min(1, numberOr(specificState.areaOpacity, 0.24)));
    const bottomAlpha = Math.min(topAlpha, Math.max(0.02, Number((topAlpha * 0.18).toFixed(3))));
    if (specificState.areaFillMode === "gradient") {
      return {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(baseColor, topAlpha) },
            { offset: 1, color: hexToRgba(baseColor, bottomAlpha) }
          ]
        }
      };
    }
    return {
      color: baseColor,
      opacity: specificState.areaOpacity
    };
  }

  function resolveLinePreviewSymbolVisibility(showSymbol, showLabel) {
    return showSymbol || showLabel;
  }

  function resolveLinePreviewSymbolSize(symbolSize, showSymbol) {
    return showSymbol ? symbolSize : 0.01;
  }

  function deriveDualAxisTypesFromRawData(rawData, previewState) {
    const xAxes = Array.isArray(rawData && rawData.xAxis) ? rawData.xAxis : [rawData && rawData.xAxis ? rawData.xAxis : {}];
    const yAxes = Array.isArray(rawData && rawData.yAxis) ? rawData.yAxis : [rawData && rawData.yAxis ? rawData.yAxis : {}];
    const seriesList = Array.isArray(rawData && rawData.series) ? rawData.series : [];
    const horizontal = (xAxes[0] && xAxes[0].type === "value" || xAxes[1] && xAxes[1].type === "value") && yAxes[0] && yAxes[0].type === "category";
    let leftType = null;
    let rightType = null;

    seriesList.forEach((series, index) => {
      const axisIndex = horizontal ? series && series.xAxisIndex : series && series.yAxisIndex;
      const side = axisIndex === 1 ? "right" : axisIndex === 0 ? "left" : index === 1 ? "right" : "left";
      const type = series && series.type === "line" ? "line" : "bar";
      if (side === "left" && !leftType) {
        leftType = type;
      }
      if (side === "right" && !rightType) {
        rightType = type;
      }
    });

    return {
      leftType: (previewState && previewState.dualAxisPreviewLeftType) || leftType || "bar",
      rightType: (previewState && previewState.dualAxisPreviewRightType) || rightType || "line"
    };
  }

  function buildDualAxisValueAxisConfig(commonState, specificState, side) {
    const isLeft = side === "left";
    const formatter = isLeft ? specificState.leftAxisFormatter : specificState.rightAxisFormatter;
    const labelFontSize = isLeft ? specificState.leftAxisLabelFontSize : specificState.rightAxisLabelFontSize;
    const labelColor = isLeft ? specificState.leftAxisLabelColor : specificState.rightAxisLabelColor;
    const axisLineShow = isLeft ? specificState.leftAxisLineShow : specificState.rightAxisLineShow;
    const axisLineColor = isLeft ? specificState.leftAxisLineColor : specificState.rightAxisLineColor;
    const axisTickShow = isLeft ? specificState.leftAxisTickShow : specificState.rightAxisTickShow;
    const followAxis = specificState.splitLineFollowAxis || "left";
    const horizontal = Boolean(specificState.horizontal);
    const sharedSplitLineShow = horizontal ? commonState.xSplitLineShow : commonState.splitLineShow;
    const sharedSplitLineColor = horizontal ? commonState.xSplitLineColor : commonState.splitLineColor;
    const sharedSplitLineType = normalizeStrokeType(horizontal ? commonState.xSplitLineType : commonState.splitLineType);
    const sharedSplitLineWidth = horizontal ? commonState.xSplitLineWidth : commonState.splitLineWidth;
    const effectiveSplitLineShow = side === followAxis ? sharedSplitLineShow : false;

    return compactObject({
      type: "value",
      axisLabel: {
        formatter: formatter || undefined,
        fontSize: labelFontSize,
        color: labelColor
      },
      axisTick: {
        show: axisTickShow
      },
      axisLine: {
        show: axisLineShow,
        lineStyle: {
          color: axisLineColor
        }
      },
      splitLine: {
        show: effectiveSplitLineShow,
        lineStyle: {
          color: sharedSplitLineColor,
          type: sharedSplitLineType,
          width: sharedSplitLineWidth
        }
      }
    });
  }

  function buildDualAxisSeriesAxisRef(specificState, side) {
    const axisIndex = side === "left" ? 0 : 1;
    return specificState.horizontal ? { xAxisIndex: axisIndex, yAxisIndex: 0 } : { yAxisIndex: axisIndex };
  }

  function resolveDualAxisSeriesSide(series, specificState, index) {
    const nextIndex = index || 0;
    const horizontal = Boolean(specificState.horizontal);
    const axisIndex = horizontal
      ? (series && (series.xAxisIndex !== undefined ? series.xAxisIndex : series.yAxisIndex))
      : (series && (series.yAxisIndex !== undefined ? series.yAxisIndex : series.xAxisIndex));
    if (axisIndex === 1) {
      return "right";
    }
    if (axisIndex === 0) {
      return "left";
    }
    return nextIndex === 1 ? "right" : "left";
  }

  function buildDualAxisSeriesStructure(specificState, side, dualAxisTypes) {
    const isLeft = side === "left";
    return compactObject({
      type: isLeft ? dualAxisTypes.leftType : dualAxisTypes.rightType,
      ...buildDualAxisSeriesAxisRef(specificState, side)
    });
  }

  function normalizeDualAxisSeriesStructure(sourceSeries, specificState, dualAxisTypes) {
    const seriesList = Array.isArray(sourceSeries) ? sourceSeries : [];
    if (!seriesList.length) {
      return [
        buildDualAxisSeriesStructure(specificState, "left", dualAxisTypes),
        buildDualAxisSeriesStructure(specificState, "right", dualAxisTypes)
      ];
    }
    return seriesList.map((series, index) => {
      const side = resolveDualAxisSeriesSide(series, specificState, index);
      return compactObject(deepMerge(series, buildDualAxisSeriesStructure(specificState, side, dualAxisTypes)));
    });
  }

  function normalizeDualAxisHorizontalOption(option, sourceOption) {
    const normalized = deepClone(option) || {};
    const sourceXAxis = Array.isArray(sourceOption && sourceOption.xAxis) ? (sourceOption.xAxis[0] || {}) : ((sourceOption && sourceOption.xAxis) || {});
    const categoryData = Array.isArray(sourceXAxis && sourceXAxis.data) ? sourceXAxis.data : undefined;

    normalized.yAxis = compactObject({
      ...(isObject(normalized.yAxis) ? normalized.yAxis : {}),
      type: "category",
      data: categoryData
    });

    if (Array.isArray(normalized.series)) {
      normalized.series = normalized.series.map((series) => {
        if (!isObject(series) || !isObject(series.encode)) {
          return series;
        }
        const encode = series.encode;
        if (encode.x === undefined && encode.y === undefined) {
          return series;
        }
        return {
          ...series,
          encode: {
            ...encode,
            x: encode.y,
            y: encode.x
          }
        };
      });
    }
    return normalized;
  }

  function buildDualAxisSeriesConfig(specificState, side, dualAxisTypes, previewState) {
    const isLeft = side === "left";
    const seriesType = isLeft ? dualAxisTypes.leftType : dualAxisTypes.rightType;
    const axisRef = buildDualAxisSeriesAxisRef(specificState, side);
    if (seriesType === "bar") {
      const previewCounts = resolveDualAxisPreviewSeriesCounts(previewState);
      const isSingleBarVisual = (isLeft ? previewCounts.leftCount : previewCounts.rightCount) === 1
        || Boolean(previewState && previewState.previewStackMode);
      const previewBarWidth = isSingleBarVisual ? "40%" : undefined;
      return compactObject({
        type: "bar",
        ...axisRef,
        barWidth: previewBarWidth,
        barGap: isLeft ? specificState.leftBarGap : specificState.rightBarGap,
        itemStyle: {
          opacity: isLeft ? specificState.leftBarOpacity : specificState.rightBarOpacity,
          borderRadius: isLeft ? specificState.leftBarBorderRadius : specificState.rightBarBorderRadius,
          borderWidth: isLeft ? specificState.leftBarBorderWidth : specificState.rightBarBorderWidth,
          borderColor: isLeft ? specificState.leftBarBorderColor : specificState.rightBarBorderColor
        },
        label: {
          show: isLeft ? specificState.leftBarShowLabel : specificState.rightBarShowLabel,
          position: isLeft ? specificState.leftBarLabelPosition : specificState.rightBarLabelPosition,
          fontSize: isLeft ? specificState.leftBarLabelFontSize : specificState.rightBarLabelFontSize,
          color: isLeft ? specificState.leftBarLabelColor : specificState.rightBarLabelColor
        }
      });
    }
    return compactObject({
      type: "line",
      ...axisRef,
      smooth: isLeft ? specificState.leftLineSmooth : specificState.rightLineSmooth,
      showSymbol: isLeft ? specificState.leftLineShowSymbol : specificState.rightLineShowSymbol,
      connectNulls: isLeft ? specificState.leftLineConnectNulls : specificState.rightLineConnectNulls,
      lineStyle: {
        width: isLeft ? specificState.leftLineWidth : specificState.rightLineWidth,
        type: isLeft ? specificState.leftLineStyleType : specificState.rightLineStyleType
      },
      symbol: isLeft ? specificState.leftLineSymbol : specificState.rightLineSymbol,
      symbolSize: isLeft ? specificState.leftLineSymbolSize : specificState.rightLineSymbolSize,
      label: {
        show: isLeft ? specificState.leftLineShowLabel : specificState.rightLineShowLabel,
        fontSize: isLeft ? specificState.leftLineLabelFontSize : specificState.rightLineLabelFontSize,
        color: isLeft ? specificState.leftLineLabelColor : specificState.rightLineLabelColor
      },
      areaStyle: (isLeft ? specificState.leftLineArea : specificState.rightLineArea)
        ? {
            opacity: 0.22
          }
        : undefined
    });
  }

  function getDualAxisColorListFallback(fieldId) {
    return DUAL_AXIS_COLOR_LIST_FALLBACKS[fieldId] || ["#5470c6", "#91cc75", "#fac858"];
  }

  function resolveDualAxisSeriesPalette(specificState, side, seriesType) {
    const fieldId = `${side}${seriesType === "bar" ? "Bar" : "Line"}Colors`;
    return parseColorListText(specificState[fieldId], getDualAxisColorListFallback(fieldId));
  }

  function resolveDualAxisSeriesColor(specificState, side, seriesType, sideIndex) {
    const nextSideIndex = sideIndex || 0;
    const palette = resolveDualAxisSeriesPalette(specificState, side, seriesType);
    return palette[nextSideIndex % palette.length] || palette[0];
  }

  function buildDualAxisSeriesConfigForSeries(specificState, series, index, sideIndex, dualAxisTypes, previewState) {
    const nextIndex = index || 0;
    const nextSideIndex = sideIndex || 0;
    const side = resolveDualAxisSeriesSide(series, specificState, nextIndex);
    const seriesType = side === "left" ? dualAxisTypes.leftType : dualAxisTypes.rightType;
    const sideColor = resolveDualAxisSeriesColor(specificState, side, seriesType, nextSideIndex);
    const baseConfig = buildDualAxisSeriesConfig(specificState, side, dualAxisTypes, previewState);
    if (seriesType === "bar") {
      return compactObject(deepMerge(baseConfig, {
        itemStyle: { color: sideColor }
      }));
    }
    return compactObject(deepMerge(baseConfig, {
      lineStyle: { color: sideColor },
      areaStyle: baseConfig.areaStyle
        ? {
            color: hexToRgba(sideColor, 0.22),
            opacity: 0.22
          }
        : undefined
    }));
  }

  function buildDualAxisCategoryAxisConfig(commonState, horizontal) {
    if (horizontal) {
      return compactObject({
        type: "category",
        axisLabel: {
          fontSize: commonState.yAxisLabelFontSize,
          color: commonState.yAxisLabelColor,
          formatter: commonState.yFormatter
        },
        axisTick: {
          show: commonState.yAxisTickShow
        },
        axisLine: {
          show: commonState.yAxisLineShow,
          lineStyle: {
            color: commonState.yAxisLineColor
          }
        },
        splitLine: {
          show: commonState.splitLineShow,
          lineStyle: {
            color: commonState.splitLineColor,
            type: normalizeStrokeType(commonState.splitLineType),
            width: commonState.splitLineWidth
          }
        }
      });
    }
    return compactObject({
      type: "category",
      axisLabel: {
        rotate: commonState.xRotate,
        fontSize: commonState.xAxisLabelFontSize,
        color: commonState.xAxisLabelColor,
        formatter: commonState.xFormatter
      },
      axisTick: {
        show: commonState.xAxisTickShow
      },
      axisLine: {
        show: commonState.xAxisLineShow,
        lineStyle: {
          color: commonState.xAxisLineColor
        }
      },
      splitLine: {
        show: commonState.xSplitLineShow,
        lineStyle: {
          color: commonState.xSplitLineColor,
          type: normalizeStrokeType(commonState.xSplitLineType),
          width: commonState.xSplitLineWidth
        }
      }
    });
  }

  function applyPreviewOnlyOverrides(chartType, option, previewState) {
    const previewOption = deepClone(option);
    const state = previewState || {};
    if (chartType === "pie") {
      const layoutBox = buildLayoutBox({
        gridLeft: previewOption.grid && previewOption.grid.left || "12%",
        gridRight: previewOption.grid && previewOption.grid.right || "9%",
        gridTop: previewOption.grid && previewOption.grid.top || "21%",
        gridBottom: previewOption.grid && previewOption.grid.bottom || "15%"
      });
      if (Array.isArray(previewOption.series) && previewOption.series[0] && previewOption.series[0].type === "pie") {
        previewOption.series[0] = compactObject({
          ...previewOption.series[0],
          center: resolveLayoutCenter(layoutBox, "auto", "auto")
        });
      }
      return previewOption;
    }

    if (chartType === "bar") {
      if (state.previewBarHorizontal) {
        const sourceXAxis = Array.isArray(previewOption.xAxis) ? (previewOption.xAxis[0] || {}) : (previewOption.xAxis || {});
        const sourceYAxis = Array.isArray(previewOption.yAxis) ? (previewOption.yAxis[0] || {}) : (previewOption.yAxis || {});
        const categoryData = Array.isArray(sourceXAxis.data) ? sourceXAxis.data : undefined;
        previewOption.xAxis = compactObject({
          ...sourceXAxis,
          type: "value",
          data: undefined
        });
        previewOption.yAxis = compactObject({
          ...sourceYAxis,
          type: "category",
          data: Array.isArray(sourceYAxis.data) ? sourceYAxis.data : categoryData
        });
        if (Array.isArray(previewOption.series)) {
          previewOption.series = previewOption.series.map((series) => {
            if (!series || series.type !== "bar") {
              return series;
            }
            if (series.encode && (series.encode.x !== undefined || series.encode.y !== undefined)) {
              return {
                ...series,
                encode: {
                  ...series.encode,
                  x: series.encode.y,
                  y: series.encode.x
                }
              };
            }
            return series;
          });
        }
      }
      if (state.previewStackMode && Array.isArray(previewOption.series)) {
        previewOption.series = previewOption.series.map((series) => (
          series && series.type === "bar" ? { ...series, stack: "preview-stack" } : series
        ));
      }
      return previewOption;
    }

    if (chartType === "area" && state.previewStackMode && Array.isArray(previewOption.series)) {
      previewOption.series = previewOption.series.map((series) => (
        series && series.type === "line" ? { ...series, stack: "preview-stack" } : series
      ));
    }

    return previewOption;
  }

  function buildChartStyleConfig(chartType, specificState, commonState, rawOption, options) {
    const cfg = options || {};
    const previewState = cfg.previewState || {};
    const dualAxisTypes = cfg.dualAxisTypes || { leftType: "bar", rightType: "line" };
    const previewViewportSize = cfg.previewViewportSize || { width: 960, height: 520 };
    const layoutBox = buildLayoutBox(commonState);

    switch (chartType) {
      case "line":
        return compactObject({
          xAxis: { type: "category" },
          yAxis: { type: "value" },
          series: [
            {
              type: "line",
              symbol: specificState.symbol,
              symbolSize: resolveLinePreviewSymbolSize(specificState.symbolSize, specificState.showSymbol),
              smooth: specificState.smooth,
              showSymbol: resolveLinePreviewSymbolVisibility(specificState.showSymbol, specificState.showLabel),
              connectNulls: specificState.connectNulls,
              lineStyle: {
                width: specificState.lineWidth,
                type: specificState.lineStyleType
              },
              label: {
                show: specificState.showLabel,
                fontSize: specificState.labelFontSize,
                color: specificState.labelColor
              }
            }
          ]
        });
      case "bar":
        {
          const previewSeriesCount = numberOr(previewState.previewSeriesCount, 0);
          const isSingleBarVisual = previewSeriesCount === 1 || Boolean(previewState.previewStackMode);
          const previewBarWidth = isSingleBarVisual ? "40%" : undefined;
          return compactObject({
            xAxis: { type: "category" },
            yAxis: { type: "value" },
            series: [
              {
                type: "bar",
                barWidth: previewBarWidth,
                barGap: specificState.barGap,
                itemStyle: {
                  opacity: specificState.itemOpacity,
                  borderRadius: specificState.borderRadius,
                  borderWidth: specificState.borderWidth,
                  borderColor: specificState.borderColor
                },
                label: {
                  show: specificState.showLabel,
                  position: specificState.labelPosition,
                  fontSize: specificState.labelFontSize,
                  color: specificState.labelColor
                }
              }
            ]
          });
        }
      case "pie": {
        const resolvedPieConfig = resolvePieRadius(layoutBox, previewViewportSize, previewState.previewPieMode || "donut");
        return compactObject({
          series: [
            {
              type: "pie",
              radius: resolvedPieConfig.radius,
              roseType: resolvedPieConfig.roseType,
              center: resolveLayoutCenter(layoutBox, "auto", "auto"),
              startAngle: specificState.startAngle,
              label: {
                show: specificState.showLabel,
                position: specificState.labelPosition,
                fontSize: specificState.labelFontSize,
                color: specificState.labelColor,
                formatter: specificState.labelFormatter
              },
              labelLine: {
                show: specificState.labelLineShow,
                lineStyle: {
                  color: specificState.labelLineColor,
                  width: specificState.labelLineWidth
                }
              },
              itemStyle: {
                opacity: specificState.itemOpacity,
                borderWidth: specificState.borderWidth,
                borderColor: specificState.borderColor
              }
            }
          ]
        });
      }
      case "gauge":
        return compactObject({
          series: [
            {
              type: "gauge",
              startAngle: specificState.startAngle,
              endAngle: specificState.endAngle,
              center: resolveGaugeLayoutCenter(layoutBox, "auto", "auto"),
              radius: resolveGaugeRadius(layoutBox, previewViewportSize),
              progress: {
                show: specificState.progressShow,
                width: specificState.progressWidth,
                itemStyle: { color: specificState.progressColor }
              },
              title: {
                show: specificState.titleShow,
                fontSize: specificState.titleFontSize,
                color: specificState.titleColor
              },
              detail: {
                show: specificState.detailShow,
                fontSize: specificState.detailFontSize,
                fontWeight: "bold",
                color: specificState.detailColor,
                formatter: normalizeGaugeFormatter(specificState.detailFormatter)
              },
              axisLabel: {
                show: specificState.axisLabelShow,
                distance: specificState.axisLabelDistance,
                fontSize: specificState.axisLabelFontSize,
                color: specificState.axisLabelColor
              },
              splitLine: {
                show: specificState.splitLineShow,
                length: specificState.splitLineLength,
                lineStyle: {
                  width: specificState.splitLineWidth,
                  color: specificState.splitLineColor
                }
              },
              axisTick: {
                show: specificState.axisTickShow,
                length: specificState.axisTickLength,
                lineStyle: {
                  width: specificState.axisTickWidth,
                  color: specificState.axisTickColor
                }
              },
              pointer: {
                show: specificState.pointerShow,
                width: numberOr(specificState.pointerWidth, 4),
                itemStyle: { color: specificState.pointerColor }
              },
              anchor: {
                show: specificState.anchorShow,
                size: numberOr(specificState.anchorSize, 18),
                itemStyle: { color: specificState.anchorColor }
              },
              axisLine: {
                lineStyle: {
                  width: specificState.axisWidth,
                  color: resolveGaugeBands(specificState)
                }
              }
            }
          ]
        });
      case "area":
        {
          const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
          const styleSeries = (sourceSeries.length ? sourceSeries : [{}]).map((series, index) => compactObject({
            type: "line",
            smooth: specificState.smooth,
            showSymbol: resolveLinePreviewSymbolVisibility(specificState.showSymbol, specificState.showLabel),
            symbol: specificState.symbol,
            symbolSize: resolveLinePreviewSymbolSize(specificState.symbolSize, specificState.showSymbol),
            connectNulls: specificState.connectNulls,
            lineStyle: {
              width: specificState.lineWidth,
              type: specificState.lineStyleType
            },
            label: {
              show: specificState.showLabel,
              fontSize: specificState.labelFontSize,
              color: specificState.labelColor
            },
            areaStyle: resolveAreaFill(specificState, commonState, index)
          }));
          return compactObject({
            xAxis: { type: "category" },
            yAxis: { type: "value" },
            series: styleSeries
          });
        }
      case "dualAxis": {
        const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
        const sideCounters = { left: 0, right: 0 };
        const styleSeries = (sourceSeries.length ? sourceSeries : [{}, {}]).map((series, index) => {
          const side = resolveDualAxisSeriesSide(series, specificState, index);
          const sideIndex = sideCounters[side];
          sideCounters[side] += 1;
          return buildDualAxisSeriesConfigForSeries(specificState, series, index, sideIndex, dualAxisTypes, previewState);
        });
        return compactObject({
          xAxis: specificState.horizontal
            ? [
                buildDualAxisValueAxisConfig(commonState, specificState, "left"),
                buildDualAxisValueAxisConfig(commonState, specificState, "right")
              ]
            : buildDualAxisCategoryAxisConfig(commonState, false),
          yAxis: specificState.horizontal
            ? buildDualAxisCategoryAxisConfig(commonState, true)
            : [
                buildDualAxisValueAxisConfig(commonState, specificState, "left"),
                buildDualAxisValueAxisConfig(commonState, specificState, "right")
              ],
          series: styleSeries
        });
      }
      case "scatter":
        return compactObject({
          xAxis: { type: "value" },
          yAxis: { type: "value" },
          series: [
            {
              type: "scatter",
              symbol: specificState.symbol,
              symbolSize: numberOr(specificState.symbolSize, 64),
              itemStyle: {
                opacity: specificState.itemOpacity,
                borderWidth: specificState.borderWidth,
                borderColor: specificState.borderColor
              },
              label: {
                show: specificState.showLabel,
                fontSize: specificState.labelFontSize,
                color: specificState.labelColor
              }
            }
          ]
        });
      case "radar":
        return compactObject({
          radar: {
            shape: specificState.shape,
            splitNumber: specificState.splitNumber,
            center: resolveLayoutCenter(layoutBox, "auto", "auto"),
            radius: resolveRadarRadius(layoutBox, previewViewportSize),
            axisName: {
              fontSize: specificState.axisNameFontSize,
              color: specificState.axisNameColor,
              fontWeight: specificState.axisNameBold ? "bold" : "normal"
            },
            splitLine: {
              lineStyle: {
                color: specificState.splitLineColor,
                width: specificState.splitLineWidth,
                type: normalizeStrokeType(specificState.splitLineType)
              }
            },
            axisLine: {
              lineStyle: {
                color: specificState.axisLineColor,
                width: specificState.axisLineWidth,
                type: specificState.axisLineType
              }
            },
            splitArea: {
              show: false
            }
          },
          series: [
            {
              type: "radar",
              symbol: specificState.symbol,
              showSymbol: specificState.showSymbol,
              symbolSize: specificState.symbolSize,
              label: {
                show: specificState.showLabel,
                formatter: specificState.labelFormatter,
                fontSize: specificState.labelFontSize,
                color: specificState.labelColor
              },
              lineStyle: {
                width: specificState.lineWidth,
                type: specificState.lineStyleType
              },
              areaStyle: { opacity: specificState.areaOpacity }
            }
          ]
        });
      case "funnel":
        return compactObject({
          series: [
            {
              type: "funnel",
              left: `${Math.round(layoutBox.left)}%`,
              top: `${Math.round(layoutBox.top)}%`,
              width: `${Math.round(layoutBox.width)}%`,
              height: `${Math.round(layoutBox.height)}%`,
              sort: specificState.sort,
              gap: specificState.gap,
              minSize: specificState.minSize,
              maxSize: specificState.maxSize,
              label: {
                show: specificState.showLabel,
                position: specificState.labelPosition,
                formatter: specificState.labelFormatter,
                fontSize: specificState.labelFontSize,
                color: specificState.labelColor
              },
              itemStyle: {
                opacity: specificState.itemOpacity,
                borderColor: specificState.borderColor,
                borderWidth: specificState.borderWidth
              }
            }
          ]
        });
      default:
        return {};
    }
  }

  function buildChartArtifacts(params) {
    const chartType = params.chartType;
    const runtimeDefinition = getChartRuntimeDefinition(chartType);
    const commonState = params.commonState;
    const specificState = params.specificState;
    const sourceRawData = deepClone(params.rawData || {});
    const previewState = {
      previewStackMode: false,
      previewBarHorizontal: false,
      previewPieMode: chartType === "pie" ? "donut" : "donut",
      previewSeriesCount: 0,
      previewDualAxisLeftSeriesCount: 0,
      previewDualAxisRightSeriesCount: 0,
      ...(params.previewState || {})
    };
    const rawData = applyPreviewSeriesCount(chartType, sourceRawData, previewState);
    const dualAxisTypes = params.dualAxisTypes || deriveDualAxisTypesFromRawData(rawData, previewState);
    const previewViewportSize = params.previewViewportSize || { width: 960, height: 520 };

    const baseOption = buildCommonOption(commonState, runtimeDefinition);
    const structurePatch = buildStructurePatch(chartType, specificState);
    let rawOption;

    if (chartType === "dualAxis") {
      const baseWithData = compactObject(deepMerge(baseOption, rawData));
      rawOption = compactObject(deepMerge(baseWithData, structurePatch));
      rawOption.series = compactObject(normalizeDualAxisSeriesStructure(baseWithData.series, specificState, dualAxisTypes));
      if (specificState.horizontal) {
        rawOption = compactObject(normalizeDualAxisHorizontalOption(rawOption, baseWithData));
      }
    } else {
      rawOption = compactObject(deepMerge(deepMerge(baseOption, structurePatch), rawData));
    }

    const stylePayload = {
      recommendedStyleFiles: [
        "config/base_style.json",
        `config/${runtimeDefinition.styleFile}`
      ],
      baseStyleConfig: buildBaseStyleConfig(commonState, runtimeDefinition),
      chartStyleConfig: buildChartStyleConfig(chartType, specificState, commonState, rawOption, {
        previewState,
        dualAxisTypes,
        previewViewportSize
      })
    };

    let resolvedOption = applyStyleConfig(rawOption, stylePayload.baseStyleConfig);
    resolvedOption = applyStyleConfig(resolvedOption, stylePayload.chartStyleConfig);
    resolvedOption = applyPreviewOnlyOverrides(chartType, resolvedOption, previewState);
    resolvedOption = compactObject(resolvedOption);

    return {
      rawOption,
      stylePayload,
      resolvedOption,
      dualAxisTypes
    };
  }

  return {
    buildChartArtifacts,
    deriveDualAxisTypesFromRawData
  };
});
