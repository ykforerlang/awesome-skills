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
    if (Array.isArray(rawValue)) {
      const parsedArray = rawValue
        .map((segment) => normalizeColorValue(segment))
        .filter(Boolean);
      return parsedArray.length ? parsedArray : fallbackList;
    }
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

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function parseHexColor(color) {
    const source = String(color || "").trim();
    const normalized = source.startsWith("#") ? source.slice(1) : source;
    if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
      return {
        red: Number.parseInt(normalized[0] + normalized[0], 16),
        green: Number.parseInt(normalized[1] + normalized[1], 16),
        blue: Number.parseInt(normalized[2] + normalized[2], 16)
      };
    }
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return {
        red: Number.parseInt(normalized.slice(0, 2), 16),
        green: Number.parseInt(normalized.slice(2, 4), 16),
        blue: Number.parseInt(normalized.slice(4, 6), 16)
      };
    }
    return null;
  }

  function rgbToHsl(red, green, blue) {
    const r = clampNumber(red, 0, 255) / 255;
    const g = clampNumber(green, 0, 255) / 255;
    const b = clampNumber(blue, 0, 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    if (max === min) {
      return { hue: 0, saturation: 0, lightness };
    }
    const delta = max - min;
    const saturation = lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
    let hue;
    switch (max) {
      case r:
        hue = ((g - b) / delta) + (g < b ? 6 : 0);
        break;
      case g:
        hue = ((b - r) / delta) + 2;
        break;
      default:
        hue = ((r - g) / delta) + 4;
        break;
    }
    return {
      hue: (hue * 60) % 360,
      saturation,
      lightness
    };
  }

  function hueToRgb(p, q, t) {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  }

  function hslToHex(hue, saturation, lightness) {
    const safeHue = ((Number(hue) % 360) + 360) % 360;
    const safeSaturation = clampNumber(Number(saturation) || 0, 0, 1);
    const safeLightness = clampNumber(Number(lightness) || 0, 0, 1);
    let red;
    let green;
    let blue;
    if (safeSaturation === 0) {
      red = safeLightness;
      green = safeLightness;
      blue = safeLightness;
    } else {
      const q = safeLightness < 0.5
        ? safeLightness * (1 + safeSaturation)
        : safeLightness + safeSaturation - (safeLightness * safeSaturation);
      const p = (2 * safeLightness) - q;
      red = hueToRgb(p, q, safeHue / 360 + 1 / 3);
      green = hueToRgb(p, q, safeHue / 360);
      blue = hueToRgb(p, q, safeHue / 360 - 1 / 3);
    }
    const toHex = (channel) => Math.round(clampNumber(channel, 0, 1) * 255).toString(16).padStart(2, "0");
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  function buildPaletteVariant(color, passIndex) {
    if (!passIndex) {
      return color;
    }
    const rgb = parseHexColor(color);
    if (!rgb) {
      return color;
    }
    const hsl = rgbToHsl(rgb.red, rgb.green, rgb.blue);
    if (passIndex === 1) {
      return hslToHex(
        hsl.hue + 10,
        clampNumber(hsl.saturation - 0.08, 0, 1),
        clampNumber(hsl.lightness + 0.14, 0, 1)
      );
    }
    return hslToHex(
      hsl.hue - 10,
      clampNumber(hsl.saturation + 0.06, 0, 1),
      clampNumber(hsl.lightness - 0.12, 0, 1)
    );
  }

  function expandPalette(basePalette, targetCount) {
    const palette = parsePalette(basePalette);
    if (!palette.length) {
      return [];
    }
    const size = Math.max(1, Number(targetCount) || 0);
    if (palette.length >= size) {
      return palette.slice(0, size);
    }
    const expanded = [];
    for (let index = 0; index < size; index += 1) {
      const seedColor = palette[index % palette.length];
      const passIndex = Math.floor(index / palette.length);
      expanded.push(buildPaletteVariant(seedColor, passIndex));
    }
    return expanded;
  }

  function coerceNumeric(value) {
    if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
      return Number(value);
    }
    return value;
  }

  function applyCommonHelperConfig(commonState, helperCommon) {
    const nextState = deepClone(commonState);
    const titleMain = helperCommon && helperCommon.title && helperCommon.title.main || {};
    const titleSubtitle = helperCommon && helperCommon.title && helperCommon.title.subtitle || {};
    const canvas = helperCommon && helperCommon.canvas || {};
    const plotArea = canvas.plotArea || {};
    const legend = helperCommon && helperCommon.legend || {};
    const xAxis = helperCommon && helperCommon.axes && helperCommon.axes.x || {};
    const yAxis = helperCommon && helperCommon.axes && helperCommon.axes.y || {};
    const horizontalSplit = helperCommon && helperCommon.splitLines && helperCommon.splitLines.horizontal || {};
    const verticalSplit = helperCommon && helperCommon.splitLines && helperCommon.splitLines.vertical || {};

    if ("show" in titleMain) nextState.titleShow = Boolean(titleMain.show);
    if ("align" in titleMain) nextState.titleAlign = titleMain.align;
    if ("fontSize" in titleMain) nextState.titleFontSize = coerceNumeric(titleMain.fontSize);
    if ("color" in titleMain) nextState.titleColor = titleMain.color;
    if ("bold" in titleMain) nextState.titleBold = Boolean(titleMain.bold);

    if ("show" in titleSubtitle) nextState.subtitleShow = Boolean(titleSubtitle.show);
    if ("fontSize" in titleSubtitle) nextState.subtitleFontSize = coerceNumeric(titleSubtitle.fontSize);
    if ("color" in titleSubtitle) nextState.subtitleColor = titleSubtitle.color;

    if ("backgroundColor" in canvas) nextState.backgroundColor = canvas.backgroundColor;
    if ("palette" in canvas) nextState.palette = deepClone(canvas.palette);
    if ("left" in plotArea) nextState.gridLeft = plotArea.left;
    if ("right" in plotArea) nextState.gridRight = plotArea.right;
    if ("top" in plotArea) nextState.gridTop = plotArea.top;
    if ("bottom" in plotArea) nextState.gridBottom = plotArea.bottom;

    if ("show" in legend) nextState.legendShow = Boolean(legend.show);
    if ("position" in legend) nextState.legendPosition = legend.position;
    if ("orient" in legend) nextState.legendOrient = legend.orient;
    if ("fontSize" in legend) nextState.legendFontSize = coerceNumeric(legend.fontSize);
    if ("color" in legend) nextState.legendColor = legend.color;

    if ("lineShow" in xAxis) nextState.xAxisLineShow = Boolean(xAxis.lineShow);
    if ("tickShow" in xAxis) nextState.xAxisTickShow = Boolean(xAxis.tickShow);
    if ("rotate" in xAxis) nextState.xRotate = coerceNumeric(xAxis.rotate);
    if ("labelFontSize" in xAxis) nextState.xAxisLabelFontSize = coerceNumeric(xAxis.labelFontSize);
    if ("labelColor" in xAxis) nextState.xAxisLabelColor = xAxis.labelColor;
    if ("lineColor" in xAxis) nextState.xAxisLineColor = xAxis.lineColor;
    if ("formatter" in xAxis) nextState.xFormatter = xAxis.formatter;

    if ("lineShow" in yAxis) nextState.yAxisLineShow = Boolean(yAxis.lineShow);
    if ("tickShow" in yAxis) nextState.yAxisTickShow = Boolean(yAxis.tickShow);
    if ("labelFontSize" in yAxis) nextState.yAxisLabelFontSize = coerceNumeric(yAxis.labelFontSize);
    if ("labelColor" in yAxis) nextState.yAxisLabelColor = yAxis.labelColor;
    if ("lineColor" in yAxis) nextState.yAxisLineColor = yAxis.lineColor;
    if ("formatter" in yAxis) nextState.yFormatter = yAxis.formatter;

    if ("show" in horizontalSplit) nextState.splitLineShow = Boolean(horizontalSplit.show);
    if ("display" in horizontalSplit) nextState.splitLineDisplay = horizontalSplit.display;
    if ("color" in horizontalSplit) nextState.splitLineColor = horizontalSplit.color;
    if ("type" in horizontalSplit) nextState.splitLineType = horizontalSplit.type;
    if ("width" in horizontalSplit) nextState.splitLineWidth = coerceNumeric(horizontalSplit.width);

    if ("show" in verticalSplit) nextState.xSplitLineShow = Boolean(verticalSplit.show);
    if ("color" in verticalSplit) nextState.xSplitLineColor = verticalSplit.color;
    if ("type" in verticalSplit) nextState.xSplitLineType = verticalSplit.type;
    if ("width" in verticalSplit) nextState.xSplitLineWidth = coerceNumeric(verticalSplit.width);

    return nextState;
  }

  function buildBuilderConfigFromHelperConfig(chartType, helperConfig) {
    if (!helperConfig || !isObject(helperConfig)) {
      throw new Error("Helper config must be a JSON object.");
    }
    if (helperConfig.chartType && helperConfig.chartType !== chartType) {
      throw new Error(`Helper config chartType mismatch: expected ${chartType}, got ${helperConfig.chartType}`);
    }
    if (!isObject(helperConfig.common) || !isObject(helperConfig.specific)) {
      throw new Error("Helper config must include both common and specific objects.");
    }

    const commonState = applyCommonHelperConfig({}, helperConfig.common);
    const helperSpecific = helperConfig.specific;

    if (
      chartType !== "line"
      && chartType !== "bar"
      && chartType !== "area"
      && chartType !== "dualAxis"
      && chartType !== "scatter"
      && chartType !== "pie"
      && chartType !== "gauge"
      && chartType !== "radar"
      && chartType !== "funnel"
    ) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }

    return {
      common: commonState,
      specific: deepClone(helperSpecific),
      dualAxisTypes: undefined
    };
  }

  function countSeriesList(seriesList) {
    return Array.isArray(seriesList) ? seriesList.filter(Boolean).length : 0;
  }

  function countSeriesDataItems(seriesList) {
    if (!Array.isArray(seriesList) || !seriesList.length) {
      return 0;
    }
    return seriesList.reduce((maxCount, series) => {
      const dataCount = Array.isArray(series && series.data) ? series.data.length : 0;
      return Math.max(maxCount, dataCount);
    }, 0);
  }

  function resolveCommonPaletteTargetCount(chartType, rawOption) {
    const seriesList = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
    if (chartType === "pie" || chartType === "funnel") {
      return Math.max(1, countSeriesDataItems(seriesList));
    }
    return Math.max(1, countSeriesList(seriesList));
  }

  function resolveExpandedCommonPalette(commonState, chartType, rawOption) {
    const basePalette = Array.isArray(commonState && commonState.palette)
      ? commonState.palette
      : parsePalette(commonState && commonState.palette);
    return expandPalette(basePalette, resolveCommonPaletteTargetCount(chartType, rawOption));
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

  function getRawTitleConfig(rawOption) {
    if (Array.isArray(rawOption && rawOption.title)) {
      return rawOption.title[0] || {};
    }
    return rawOption && rawOption.title || {};
  }

  function buildResolvedTitleState(commonState, rawOption) {
    const sourceTitle = getRawTitleConfig(rawOption);
    const resolvedText = commonState.titleShow ? (sourceTitle.text || "") : "";
    const resolvedSubtext = commonState.subtitleShow ? (sourceTitle.subtext || "") : "";
    return {
      show: Boolean(resolvedText || resolvedSubtext),
      text: resolvedText,
      subtext: resolvedSubtext
    };
  }

  function buildResolvedTitleBlocks(commonState, rawOption) {
    const resolvedTitle = buildResolvedTitleState(commonState, rawOption);
    if (!resolvedTitle.show) {
      return [];
    }

    const blocks = [];
    const sharedPosition = {
      left: commonState.titleAlign
    };

    if (resolvedTitle.text) {
      blocks.push({
        ...sharedPosition,
        top: 10,
        text: resolvedTitle.text,
        textStyle: {
          fontSize: commonState.titleFontSize,
          fontWeight: commonState.titleBold ? "bold" : "normal",
          color: commonState.titleColor
        }
      });
    }

    if (resolvedTitle.subtext) {
      blocks.push({
        ...sharedPosition,
        top: resolvedTitle.text ? 44 : 10,
        text: resolvedTitle.subtext,
        textStyle: {
          fontSize: commonState.subtitleFontSize,
          fontWeight: "normal",
          color: commonState.subtitleColor
        }
      });
    }

    return blocks;
  }

  function buildCommonOption(commonState, runtimeDefinition, chartType, rawOption) {
    const palette = resolveExpandedCommonPalette(commonState, chartType, rawOption);
    const resolvedTitle = buildResolvedTitleState(commonState, rawOption);
    const option = {
      title: {
        show: resolvedTitle.show,
        left: commonState.titleAlign,
        text: resolvedTitle.text,
        subtext: resolvedTitle.subtext
      },
      backgroundColor: commonState.backgroundColor,
      color: palette
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

  function buildBaseStyleConfig(commonState, runtimeDefinition, chartType, rawOption) {
    const palette = resolveExpandedCommonPalette(commonState, chartType, rawOption);
    const resolvedTitleBlocks = buildResolvedTitleBlocks(commonState, rawOption);
    const base = {
      color: palette,
      backgroundColor: commonState.backgroundColor,
      title: resolvedTitleBlocks
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

  function getLineSpecificConfig(specificConfig) {
    const line = isObject(specificConfig && specificConfig.line) ? specificConfig.line : {};
    const dataLabels = isObject(specificConfig && specificConfig.dataLabels) ? specificConfig.dataLabels : {};
    return { line, dataLabels };
  }

  function getBarSpecificConfig(specificConfig) {
    const bar = isObject(specificConfig && specificConfig.bar) ? specificConfig.bar : {};
    const dataLabels = isObject(specificConfig && specificConfig.dataLabels) ? specificConfig.dataLabels : {};
    return { bar, dataLabels };
  }

  function getAreaSpecificConfig(specificConfig) {
    const area = isObject(specificConfig && specificConfig.area) ? specificConfig.area : {};
    const dataLabels = isObject(specificConfig && specificConfig.dataLabels) ? specificConfig.dataLabels : {};
    return { area, dataLabels };
  }

  function getScatterSpecificConfig(specificConfig) {
    const point = isObject(specificConfig && specificConfig.point) ? specificConfig.point : {};
    const dataLabels = isObject(specificConfig && specificConfig.dataLabels) ? specificConfig.dataLabels : {};
    return { point, dataLabels };
  }

  function getDualAxisLayoutConfig(specificConfig, layoutOverrides) {
    const layout = {};
    if (!isObject(layoutOverrides)) {
      return layout;
    }
    return { ...layoutOverrides };
  }

  function isDualAxisHorizontal(specificConfig, layoutOverrides) {
    const layout = getDualAxisLayoutConfig(specificConfig, layoutOverrides);
    return "horizontal" in layout ? Boolean(layout.horizontal) : false;
  }

  function getDualAxisAxisConfig(specificConfig, side) {
    return isObject(specificConfig && specificConfig[`${side}Axis`]) ? specificConfig[`${side}Axis`] : {};
  }

  function getDualAxisBarConfig(specificConfig, side) {
    return isObject(specificConfig && specificConfig[`${side}Bar`]) ? specificConfig[`${side}Bar`] : {};
  }

  function getDualAxisLineConfig(specificConfig, side) {
    return isObject(specificConfig && specificConfig[`${side}Line`]) ? specificConfig[`${side}Line`] : {};
  }

  function readOptionalBoolean(config, fieldName) {
    if (!isObject(config) || !(fieldName in config)) {
      return undefined;
    }
    return Boolean(config[fieldName]);
  }

  function readOptionalNumber(config, fieldName) {
    if (!isObject(config) || !(fieldName in config)) {
      return undefined;
    }
    return coerceNumeric(config[fieldName]);
  }

  function readOptionalValue(config, fieldName) {
    if (!isObject(config) || !(fieldName in config)) {
      return undefined;
    }
    return config[fieldName];
  }

  function buildStructurePatch(chartType, specificConfig, dualAxisLayoutOverrides) {
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
        return isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides)
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

  function resolveGaugeBands(specificConfig) {
    const colors = parseGaugeBandColorsText(readOptionalValue(specificConfig, "bandStops"));
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

  function resolveAreaFill(specificConfig, palette, seriesIndex) {
    const nextSeriesIndex = seriesIndex || 0;
    const area = getAreaSpecificConfig(specificConfig).area;
    const availablePalette = Array.isArray(palette) && palette.length ? palette : ["#5470c6"];
    const baseColor = availablePalette[nextSeriesIndex % availablePalette.length] || availablePalette[0];
    const topAlpha = Math.max(0, Math.min(1, numberOr(readOptionalNumber(area, "areaOpacity"), 0.24)));
    const bottomAlpha = Math.min(topAlpha, Math.max(0.02, Number((topAlpha * 0.18).toFixed(3))));
    if (readOptionalValue(area, "areaFillMode") === "gradient") {
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
      opacity: readOptionalNumber(area, "areaOpacity")
    };
  }

  function resolveSeriesPaletteColor(palette, seriesIndex) {
    const availablePalette = Array.isArray(palette) && palette.length ? palette : ["#5470c6"];
    const nextSeriesIndex = seriesIndex || 0;
    return availablePalette[nextSeriesIndex % availablePalette.length] || availablePalette[0];
  }

  function resolveLinePreviewSymbolVisibility(showSymbol, showLabel) {
    return showSymbol || showLabel;
  }

  function resolveLinePreviewSymbolSize(symbolSize, showSymbol) {
    return showSymbol ? symbolSize : 0.01;
  }

  function deriveDualAxisTypesFromRawData(rawData, previewState) {
    return {
      leftType: (previewState && previewState.dualAxisPreviewLeftType) || "bar",
      rightType: (previewState && previewState.dualAxisPreviewRightType) || "line"
    };
  }

  function buildDualAxisValueAxisConfig(commonState, specificConfig, side, dualAxisLayoutOverrides) {
    const axisConfig = getDualAxisAxisConfig(specificConfig, side);
    const formatter = readOptionalValue(axisConfig, "formatter");
    const labelFontSize = readOptionalNumber(axisConfig, "labelFontSize");
    const labelColor = readOptionalValue(axisConfig, "labelColor");
    const axisLineShow = readOptionalBoolean(axisConfig, "lineShow");
    const axisLineColor = readOptionalValue(axisConfig, "lineColor");
    const axisTickShow = readOptionalBoolean(axisConfig, "tickShow");
    const horizontal = isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides);
    const sharedSplitLineShow = horizontal ? commonState.xSplitLineShow : commonState.splitLineShow;
    const sharedSplitLineDisplay = commonState.splitLineDisplay === "right" ? "right" : "left";
    const sharedSplitLineColor = horizontal ? commonState.xSplitLineColor : commonState.splitLineColor;
    const sharedSplitLineType = normalizeStrokeType(horizontal ? commonState.xSplitLineType : commonState.splitLineType);
    const sharedSplitLineWidth = horizontal ? commonState.xSplitLineWidth : commonState.splitLineWidth;
    const effectiveSplitLineShow = sharedSplitLineShow ? side === sharedSplitLineDisplay : false;

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

  function buildDualAxisSeriesAxisRef(specificConfig, side, dualAxisLayoutOverrides) {
    const axisIndex = side === "left" ? 0 : 1;
    return isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides) ? { xAxisIndex: axisIndex, yAxisIndex: 0 } : { yAxisIndex: axisIndex };
  }

  function resolveDualAxisSeriesSide(series, specificConfig, index, dualAxisLayoutOverrides) {
    const nextIndex = index || 0;
    const horizontal = isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides);
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

  function buildDualAxisSeriesStructure(specificConfig, side, dualAxisTypes, dualAxisLayoutOverrides) {
    const isLeft = side === "left";
    return compactObject({
      type: isLeft ? dualAxisTypes.leftType : dualAxisTypes.rightType,
      ...buildDualAxisSeriesAxisRef(specificConfig, side, dualAxisLayoutOverrides)
    });
  }

  function normalizeDualAxisSeriesStructure(sourceSeries, specificConfig, dualAxisTypes, dualAxisLayoutOverrides) {
    const seriesList = Array.isArray(sourceSeries) ? sourceSeries : [];
    if (!seriesList.length) {
      return [
        buildDualAxisSeriesStructure(specificConfig, "left", dualAxisTypes, dualAxisLayoutOverrides),
        buildDualAxisSeriesStructure(specificConfig, "right", dualAxisTypes, dualAxisLayoutOverrides)
      ];
    }
    return seriesList.map((series, index) => {
      const side = resolveDualAxisSeriesSide(series, specificConfig, index, dualAxisLayoutOverrides);
      return compactObject(deepMerge(series, buildDualAxisSeriesStructure(specificConfig, side, dualAxisTypes, dualAxisLayoutOverrides)));
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

  function countDualAxisSeriesBySide(seriesList, specificConfig, dualAxisLayoutOverrides) {
    const counts = { left: 0, right: 0 };
    (Array.isArray(seriesList) ? seriesList : []).forEach((series, index) => {
      const side = resolveDualAxisSeriesSide(series, specificConfig, index, dualAxisLayoutOverrides);
      counts[side] += 1;
    });
    return counts;
  }

  function buildDualAxisSeriesConfig(specificConfig, side, dualAxisTypes, previewState, sideSeriesCount, dualAxisLayoutOverrides) {
    const isLeft = side === "left";
    const barConfig = getDualAxisBarConfig(specificConfig, side);
    const lineConfig = getDualAxisLineConfig(specificConfig, side);
    const seriesType = isLeft ? dualAxisTypes.leftType : dualAxisTypes.rightType;
    const axisRef = buildDualAxisSeriesAxisRef(specificConfig, side, dualAxisLayoutOverrides);
    if (seriesType === "bar") {
      const isSingleBarVisual = Number(sideSeriesCount) === 1
        || Boolean(previewState && previewState.previewStackMode);
      const previewBarWidth = isSingleBarVisual ? "40%" : undefined;
      return compactObject({
        type: "bar",
        ...axisRef,
        barWidth: previewBarWidth,
        barGap: readOptionalValue(barConfig, "barGap"),
        itemStyle: {
          opacity: readOptionalNumber(barConfig, "opacity"),
          borderRadius: readOptionalNumber(barConfig, "borderRadius"),
          borderWidth: readOptionalNumber(barConfig, "borderWidth"),
          borderColor: readOptionalValue(barConfig, "borderColor")
        },
        label: {
          show: readOptionalBoolean(barConfig, "showLabel"),
          position: readOptionalValue(barConfig, "labelPosition"),
          fontSize: readOptionalNumber(barConfig, "labelFontSize"),
          color: readOptionalValue(barConfig, "labelColor")
        }
      });
    }
    return compactObject({
      type: "line",
      ...axisRef,
      smooth: readOptionalBoolean(lineConfig, "smooth"),
      showSymbol: readOptionalBoolean(lineConfig, "showSymbol"),
      connectNulls: readOptionalBoolean(lineConfig, "connectNulls"),
      lineStyle: {
        width: readOptionalNumber(lineConfig, "lineWidth"),
        type: readOptionalValue(lineConfig, "lineStyleType")
      },
      symbol: readOptionalValue(lineConfig, "symbol"),
      symbolSize: readOptionalNumber(lineConfig, "symbolSize"),
      label: {
        show: readOptionalBoolean(lineConfig, "showLabel"),
        fontSize: readOptionalNumber(lineConfig, "labelFontSize"),
        color: readOptionalValue(lineConfig, "labelColor")
      },
      areaStyle: readOptionalBoolean(lineConfig, "area")
        ? {
            opacity: 0.22
          }
        : undefined
    });
  }

  function getDualAxisColorListFallback(fieldId) {
    return DUAL_AXIS_COLOR_LIST_FALLBACKS[fieldId] || ["#5470c6", "#91cc75", "#fac858"];
  }

  function resolveDualAxisSeriesPalette(specificConfig, side, seriesType, targetCount) {
    const fieldId = `${side}${seriesType === "bar" ? "Bar" : "Line"}Colors`;
    const sideConfig = seriesType === "bar"
      ? getDualAxisBarConfig(specificConfig, side)
      : getDualAxisLineConfig(specificConfig, side);
    const basePalette = parseColorListText(readOptionalValue(sideConfig, "colors"), getDualAxisColorListFallback(fieldId));
    return expandPalette(basePalette, Math.max(1, Number(targetCount) || 1));
  }

  function resolveDualAxisSeriesColor(specificConfig, side, seriesType, sideIndex, targetCount) {
    const nextSideIndex = sideIndex || 0;
    const palette = resolveDualAxisSeriesPalette(specificConfig, side, seriesType, targetCount);
    return palette[nextSideIndex % palette.length] || palette[0];
  }

  function buildDualAxisSeriesConfigForSeries(specificConfig, series, index, sideIndex, dualAxisTypes, previewState, sideSeriesCount, dualAxisLayoutOverrides) {
    const nextIndex = index || 0;
    const nextSideIndex = sideIndex || 0;
    const side = resolveDualAxisSeriesSide(series, specificConfig, nextIndex, dualAxisLayoutOverrides);
    const seriesType = side === "left" ? dualAxisTypes.leftType : dualAxisTypes.rightType;
    const sideColor = resolveDualAxisSeriesColor(specificConfig, side, seriesType, nextSideIndex, sideSeriesCount);
    const baseConfig = buildDualAxisSeriesConfig(specificConfig, side, dualAxisTypes, previewState, sideSeriesCount, dualAxisLayoutOverrides);
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

  function buildChartStyleConfig(chartType, specificConfig, commonState, rawOption, options) {
    const cfg = options || {};
    const previewState = cfg.previewState || {};
    const dualAxisTypes = cfg.dualAxisTypes || { leftType: "bar", rightType: "line" };
    const dualAxisLayoutOverrides = cfg.dualAxisLayoutOverrides;
    const previewViewportSize = cfg.previewViewportSize || { width: 650, height: 360 };
    const layoutBox = buildLayoutBox(commonState);
    const effectivePalette = resolveExpandedCommonPalette(commonState, chartType, rawOption);

    switch (chartType) {
      case "line":
        {
          const { line, dataLabels } = getLineSpecificConfig(specificConfig);
          const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
          const styleSeries = (sourceSeries.length ? sourceSeries : [{}]).map((series, index) => {
            const seriesColor = resolveSeriesPaletteColor(effectivePalette, index);
            return compactObject({
              type: "line",
              symbol: readOptionalValue(line, "symbol"),
              symbolSize: resolveLinePreviewSymbolSize(readOptionalNumber(line, "symbolSize"), readOptionalBoolean(line, "showSymbol")),
              smooth: readOptionalBoolean(line, "smooth"),
              showSymbol: resolveLinePreviewSymbolVisibility(readOptionalBoolean(line, "showSymbol"), readOptionalBoolean(dataLabels, "show")),
              connectNulls: readOptionalBoolean(line, "connectNulls"),
              itemStyle: {
                color: seriesColor
              },
              lineStyle: {
                color: seriesColor,
                width: readOptionalNumber(line, "lineWidth"),
                type: readOptionalValue(line, "lineStyleType")
              },
              label: {
                show: readOptionalBoolean(dataLabels, "show"),
                fontSize: readOptionalNumber(dataLabels, "fontSize"),
                color: readOptionalValue(dataLabels, "color")
              }
            });
          });
          return compactObject({
            xAxis: { type: "category" },
            yAxis: { type: "value" },
            series: styleSeries
          });
        }
      case "bar":
        {
          const { bar, dataLabels } = getBarSpecificConfig(specificConfig);
          const sourceSeriesCount = countSeriesList(rawOption && rawOption.series);
          const isSingleBarVisual = sourceSeriesCount === 1 || Boolean(previewState.previewStackMode);
          const previewBarWidth = isSingleBarVisual ? "40%" : undefined;
          const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
          const styleSeries = (sourceSeries.length ? sourceSeries : [{}]).map((series, index) => compactObject({
            type: "bar",
            barWidth: previewBarWidth,
            barGap: readOptionalValue(bar, "barGap"),
            itemStyle: {
              color: resolveSeriesPaletteColor(effectivePalette, index),
              opacity: readOptionalNumber(bar, "itemOpacity"),
              borderRadius: readOptionalNumber(bar, "borderRadius"),
              borderWidth: readOptionalNumber(bar, "borderWidth"),
              borderColor: readOptionalValue(bar, "borderColor")
            },
            label: {
              show: readOptionalBoolean(dataLabels, "show"),
              position: readOptionalValue(dataLabels, "position"),
              fontSize: readOptionalNumber(dataLabels, "fontSize"),
              color: readOptionalValue(dataLabels, "color")
            }
          }));
          return compactObject({
            xAxis: { type: "category" },
            yAxis: { type: "value" },
            series: styleSeries
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
              startAngle: readOptionalNumber(specificConfig, "startAngle"),
              label: {
                show: readOptionalBoolean(specificConfig, "showLabel"),
                position: readOptionalValue(specificConfig, "labelPosition"),
                fontSize: readOptionalNumber(specificConfig, "labelFontSize"),
                color: readOptionalValue(specificConfig, "labelColor"),
                formatter: readOptionalValue(specificConfig, "labelFormatter")
              },
              labelLine: {
                show: readOptionalBoolean(specificConfig, "labelLineShow"),
                lineStyle: {
                  color: readOptionalValue(specificConfig, "labelLineColor"),
                  width: readOptionalNumber(specificConfig, "labelLineWidth")
                }
              },
              itemStyle: {
                opacity: readOptionalNumber(specificConfig, "itemOpacity"),
                borderWidth: readOptionalNumber(specificConfig, "borderWidth"),
                borderColor: readOptionalValue(specificConfig, "borderColor")
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
              startAngle: readOptionalNumber(specificConfig, "startAngle"),
              endAngle: readOptionalNumber(specificConfig, "endAngle"),
              center: resolveGaugeLayoutCenter(layoutBox, "auto", "auto"),
              radius: resolveGaugeRadius(layoutBox, previewViewportSize),
              progress: {
                show: readOptionalBoolean(specificConfig, "progressShow"),
                width: readOptionalNumber(specificConfig, "progressWidth"),
                itemStyle: { color: readOptionalValue(specificConfig, "progressColor") }
              },
              title: {
                show: readOptionalBoolean(specificConfig, "titleShow"),
                fontSize: readOptionalNumber(specificConfig, "titleFontSize"),
                color: readOptionalValue(specificConfig, "titleColor")
              },
              detail: {
                show: readOptionalBoolean(specificConfig, "detailShow"),
                fontSize: readOptionalNumber(specificConfig, "detailFontSize"),
                fontWeight: "bold",
                color: readOptionalValue(specificConfig, "detailColor"),
                formatter: normalizeGaugeFormatter(readOptionalValue(specificConfig, "detailFormatter"))
              },
              axisLabel: {
                show: readOptionalBoolean(specificConfig, "axisLabelShow"),
                distance: readOptionalNumber(specificConfig, "axisLabelDistance"),
                fontSize: readOptionalNumber(specificConfig, "axisLabelFontSize"),
                color: readOptionalValue(specificConfig, "axisLabelColor")
              },
              splitLine: {
                show: readOptionalBoolean(specificConfig, "splitLineShow"),
                length: readOptionalNumber(specificConfig, "splitLineLength"),
                lineStyle: {
                  width: readOptionalNumber(specificConfig, "splitLineWidth"),
                  color: readOptionalValue(specificConfig, "splitLineColor")
                }
              },
              axisTick: {
                show: readOptionalBoolean(specificConfig, "axisTickShow"),
                length: readOptionalNumber(specificConfig, "axisTickLength"),
                lineStyle: {
                  width: readOptionalNumber(specificConfig, "axisTickWidth"),
                  color: readOptionalValue(specificConfig, "axisTickColor")
                }
              },
              pointer: {
                show: readOptionalBoolean(specificConfig, "pointerShow"),
                width: numberOr(readOptionalNumber(specificConfig, "pointerWidth"), 4),
                itemStyle: { color: readOptionalValue(specificConfig, "pointerColor") }
              },
              anchor: {
                show: readOptionalBoolean(specificConfig, "anchorShow"),
                size: numberOr(readOptionalNumber(specificConfig, "anchorSize"), 18),
                itemStyle: { color: readOptionalValue(specificConfig, "anchorColor") }
              },
              axisLine: {
                lineStyle: {
                  width: readOptionalNumber(specificConfig, "axisWidth"),
                  color: resolveGaugeBands(specificConfig)
                }
              }
            }
          ]
        });
      case "area":
        {
          const { area, dataLabels } = getAreaSpecificConfig(specificConfig);
          const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
          const styleSeries = (sourceSeries.length ? sourceSeries : [{}]).map((series, index) => {
            const seriesColor = resolveSeriesPaletteColor(effectivePalette, index);
            return compactObject({
              type: "line",
              smooth: readOptionalBoolean(area, "smooth"),
              showSymbol: resolveLinePreviewSymbolVisibility(readOptionalBoolean(area, "showSymbol"), readOptionalBoolean(dataLabels, "show")),
              symbol: readOptionalValue(area, "symbol"),
              symbolSize: resolveLinePreviewSymbolSize(readOptionalNumber(area, "symbolSize"), readOptionalBoolean(area, "showSymbol")),
              connectNulls: readOptionalBoolean(area, "connectNulls"),
              itemStyle: {
                color: seriesColor
              },
              lineStyle: {
                color: seriesColor,
                width: readOptionalNumber(area, "lineWidth"),
                type: readOptionalValue(area, "lineStyleType")
              },
              label: {
                show: readOptionalBoolean(dataLabels, "show"),
                fontSize: readOptionalNumber(dataLabels, "fontSize"),
                color: readOptionalValue(dataLabels, "color")
              },
              areaStyle: resolveAreaFill(specificConfig, effectivePalette, index)
            });
          });
          return compactObject({
            xAxis: { type: "category" },
            yAxis: { type: "value" },
            series: styleSeries
          });
        }
      case "dualAxis": {
        const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
        const sideSeriesCounts = countDualAxisSeriesBySide(sourceSeries, specificConfig, dualAxisLayoutOverrides);
        const sideCounters = { left: 0, right: 0 };
        const styleSeries = (sourceSeries.length ? sourceSeries : [{}, {}]).map((series, index) => {
          const side = resolveDualAxisSeriesSide(series, specificConfig, index, dualAxisLayoutOverrides);
          const sideIndex = sideCounters[side];
          sideCounters[side] += 1;
          return buildDualAxisSeriesConfigForSeries(
            specificConfig,
            series,
            index,
            sideIndex,
            dualAxisTypes,
            previewState,
            sideSeriesCounts[side],
            dualAxisLayoutOverrides
          );
        });
        return compactObject({
          xAxis: isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides)
            ? [
                buildDualAxisValueAxisConfig(commonState, specificConfig, "left", dualAxisLayoutOverrides),
                buildDualAxisValueAxisConfig(commonState, specificConfig, "right", dualAxisLayoutOverrides)
              ]
            : buildDualAxisCategoryAxisConfig(commonState, false),
          yAxis: isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides)
            ? buildDualAxisCategoryAxisConfig(commonState, true)
            : [
                buildDualAxisValueAxisConfig(commonState, specificConfig, "left", dualAxisLayoutOverrides),
                buildDualAxisValueAxisConfig(commonState, specificConfig, "right", dualAxisLayoutOverrides)
              ],
          series: styleSeries
        });
      }
      case "scatter":
        {
          const { point, dataLabels } = getScatterSpecificConfig(specificConfig);
          const sourceSeries = Array.isArray(rawOption && rawOption.series) ? rawOption.series : [];
          const styleSeries = (sourceSeries.length ? sourceSeries : [{}]).map((series, index) => compactObject({
            type: "scatter",
            symbol: readOptionalValue(point, "symbol"),
            symbolSize: numberOr(readOptionalNumber(point, "symbolSize"), 64),
            itemStyle: {
              color: resolveSeriesPaletteColor(effectivePalette, index),
              opacity: readOptionalNumber(point, "itemOpacity"),
              borderWidth: readOptionalNumber(point, "borderWidth"),
              borderColor: readOptionalValue(point, "borderColor")
            },
            label: {
              show: readOptionalBoolean(dataLabels, "show"),
              fontSize: readOptionalNumber(dataLabels, "fontSize"),
              color: readOptionalValue(dataLabels, "color")
            }
          }));
          return compactObject({
            xAxis: { type: "value" },
            yAxis: { type: "value" },
            series: styleSeries
          });
        }
      case "radar":
        return compactObject({
          radar: {
            shape: readOptionalValue(specificConfig, "shape"),
            splitNumber: readOptionalNumber(specificConfig, "splitNumber"),
            center: resolveLayoutCenter(layoutBox, "auto", "auto"),
            radius: resolveRadarRadius(layoutBox, previewViewportSize),
            axisName: {
              fontSize: readOptionalNumber(specificConfig, "axisNameFontSize"),
              color: readOptionalValue(specificConfig, "axisNameColor"),
              fontWeight: readOptionalBoolean(specificConfig, "axisNameBold") ? "bold" : "normal"
            },
            splitLine: {
              lineStyle: {
                color: readOptionalValue(specificConfig, "splitLineColor"),
                width: readOptionalNumber(specificConfig, "splitLineWidth"),
                type: normalizeStrokeType(readOptionalValue(specificConfig, "splitLineType"))
              }
            },
            axisLine: {
              lineStyle: {
                color: readOptionalValue(specificConfig, "axisLineColor"),
                width: readOptionalNumber(specificConfig, "axisLineWidth"),
                type: readOptionalValue(specificConfig, "axisLineType")
              }
            },
            splitArea: {
              show: false
            }
          },
          series: [
            {
              type: "radar",
              symbol: readOptionalValue(specificConfig, "symbol"),
              showSymbol: readOptionalBoolean(specificConfig, "showSymbol"),
              symbolSize: readOptionalNumber(specificConfig, "symbolSize"),
              label: {
                show: readOptionalBoolean(specificConfig, "showLabel"),
                formatter: readOptionalValue(specificConfig, "labelFormatter"),
                fontSize: readOptionalNumber(specificConfig, "labelFontSize"),
                color: readOptionalValue(specificConfig, "labelColor")
              },
              lineStyle: {
                width: readOptionalNumber(specificConfig, "lineWidth"),
                type: readOptionalValue(specificConfig, "lineStyleType")
              },
              areaStyle: { opacity: readOptionalNumber(specificConfig, "areaOpacity") }
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
              sort: readOptionalValue(specificConfig, "sort"),
              gap: readOptionalNumber(specificConfig, "gap"),
              minSize: readOptionalValue(specificConfig, "minSize"),
              maxSize: readOptionalValue(specificConfig, "maxSize"),
              label: {
                show: readOptionalBoolean(specificConfig, "showLabel"),
                position: readOptionalValue(specificConfig, "labelPosition"),
                formatter: readOptionalValue(specificConfig, "labelFormatter"),
                fontSize: readOptionalNumber(specificConfig, "labelFontSize"),
                color: readOptionalValue(specificConfig, "labelColor")
              },
              itemStyle: {
                opacity: readOptionalNumber(specificConfig, "itemOpacity"),
                borderColor: readOptionalValue(specificConfig, "borderColor"),
                borderWidth: readOptionalNumber(specificConfig, "borderWidth")
              }
            }
          ]
        });
      default:
        return {};
    }
  }

  function buildChartArtifactsFromBuilderConfig(params) {
    const chartType = params.chartType;
    const runtimeDefinition = getChartRuntimeDefinition(chartType);
    const builderConfig = isObject(params.builderConfig) ? params.builderConfig : {};
    const commonState = isObject(builderConfig.common) ? builderConfig.common : {};
    const specificConfig = isObject(builderConfig.specific) ? builderConfig.specific : {};
    const sourceRawData = deepClone(params.rawData || {});
    const previewState = {
      previewStackMode: false,
      previewBarHorizontal: false,
      previewPieMode: chartType === "pie" ? "donut" : "donut",
      ...(params.previewState || {})
    };
    const rawData = sourceRawData;
    const dualAxisTypes = params.dualAxisTypes || deriveDualAxisTypesFromRawData(rawData, previewState);
    const dualAxisLayoutOverrides = isObject(params.dualAxisLayoutOverrides) ? params.dualAxisLayoutOverrides : undefined;
    const previewViewportSize = params.previewViewportSize || { width: 650, height: 360 };

    const baseOption = buildCommonOption(commonState, runtimeDefinition, chartType, rawData);
    const structurePatch = buildStructurePatch(chartType, specificConfig, dualAxisLayoutOverrides);
    let rawOption;

    if (chartType === "dualAxis") {
      const baseWithData = compactObject(deepMerge(baseOption, rawData));
      rawOption = compactObject(deepMerge(baseWithData, structurePatch));
      rawOption.series = compactObject(normalizeDualAxisSeriesStructure(baseWithData.series, specificConfig, dualAxisTypes, dualAxisLayoutOverrides));
      if (isDualAxisHorizontal(specificConfig, dualAxisLayoutOverrides)) {
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
      baseStyleConfig: buildBaseStyleConfig(commonState, runtimeDefinition, chartType, rawOption),
      chartStyleConfig: buildChartStyleConfig(chartType, specificConfig, commonState, rawOption, {
        previewState,
        dualAxisTypes,
        dualAxisLayoutOverrides,
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

  function buildChartArtifactsFromHelperConfig(params) {
    const chartType = params.chartType;
    const builderConfig = buildBuilderConfigFromHelperConfig(chartType, params.helperConfig);
    return buildChartArtifactsFromBuilderConfig({
      chartType: chartType,
      builderConfig,
      rawData: params.rawData,
      previewState: params.previewState,
      previewViewportSize: params.previewViewportSize,
      dualAxisTypes: params.dualAxisTypes || builderConfig.dualAxisTypes,
      dualAxisLayoutOverrides: params.dualAxisLayoutOverrides
    });
  }

  return {
    buildChartArtifactsFromHelperConfig,
    deriveDualAxisTypesFromRawData
  };
});
