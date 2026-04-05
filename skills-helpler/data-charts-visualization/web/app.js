const CURRENT_LOCALE = document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
const JSON_ERROR_CODES = {
  data: "__DATA_JSON__",
};
const FONT_SIZE_SELECT_OPTIONS = [10, 12, 14, 16, 18, 20, 22, 24];
const DEFAULT_SIZE_SCALE_RATIO = 375 / 658;
const DEFAULT_FONT_SCALE_RATIO = 650 / 375;
const DEFAULT_COMMON_FONT_SIZE_OPTIONS = FONT_SIZE_SELECT_OPTIONS;
const DEFAULT_COMMON_SPLIT_WIDTH_OPTIONS = [0.6, 1, 1.6];
const TYPOGRAPHY_PRESET = Object.freeze({
  titleFontSize: 24,
  subtitleFontSize: 14,
  legendFontSize: 12,
  xAxisLabelFontSize: 12,
  yAxisLabelFontSize: 12,
  dataLabelFontSize: 12,
});
const NON_SCALING_DEFAULT_FIELD_IDS = new Set([
  "minSize",
  "maxSize",
  "barGap",
  "leftBarGap",
  "rightBarGap",
  "gridLeft",
  "gridRight",
  "gridTop",
  "gridBottom",
  "xRotate",
  "startAngle",
  "endAngle",
  "splitNumber",
]);
const FIXED_PREVIEW_VIEWPORT = Object.freeze({
  width: 650,
  height: 360,
});
const PREVIEW_RENDERER = "svg";
const MOBILE_BREAKPOINT = 760;
const MOBILE_LAYOUT_MEDIA = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

function toNumericDefaultValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("%")) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isScaledFontField(fieldId) {
  return /FontSize$/.test(fieldId);
}

function isScaledSizeField(fieldId) {
  return /SymbolSize$/.test(fieldId) || fieldId === "symbolSize" || fieldId === "anchorSize" || fieldId === "progressWidth" || fieldId === "axisWidth";
}

function isScaledSpacingField(fieldId) {
  return /Length$/.test(fieldId) || /Distance$/.test(fieldId) || fieldId === "gap";
}

function shouldScaleDefaultField(fieldId, value) {
  if (NON_SCALING_DEFAULT_FIELD_IDS.has(fieldId)) {
    return false;
  }
  if (toNumericDefaultValue(value) === null) {
    return false;
  }
  return (
    isScaledFontField(fieldId) ||
    isScaledSizeField(fieldId) ||
    isScaledSpacingField(fieldId) ||
    /Width$/.test(fieldId) ||
    /Radius$/.test(fieldId)
  );
}

function collectNumericOptionValues(options) {
  if (!Array.isArray(options) || !options.length) {
    return [];
  }
  return options
    .map((item) => {
      const rawValue = Array.isArray(item) ? item[0] : item;
      const numericValue = toNumericDefaultValue(rawValue);
      if (numericValue === null) {
        return null;
      }
      return { rawValue, numericValue };
    })
    .filter(Boolean);
}

function preserveDefaultValueType(template, value) {
  if (typeof template === "string") {
    return String(value);
  }
  return value;
}

function roundScaledDefaultValue(fieldId, value) {
  if (isScaledFontField(fieldId)) {
    return Math.max(FONT_SIZE_SELECT_OPTIONS[0], Math.round(value));
  }
  if (isScaledSizeField(fieldId)) {
    return Math.max(2, Math.round(value));
  }
  if (isScaledSpacingField(fieldId)) {
    return Math.max(1, Math.round(value));
  }
  return Math.max(0.4, Math.round(value * 10) / 10);
}

function getMinimumScaledFieldValue(fieldId) {
  if (isScaledFontField(fieldId)) {
    return FONT_SIZE_SELECT_OPTIONS[0];
  }
  if (isScaledSizeField(fieldId)) {
    return 2;
  }
  if (isScaledSpacingField(fieldId)) {
    return 1;
  }
  return 0.4;
}

function scaleDefaultValue(fieldId, rawValue, options) {
  if (!shouldScaleDefaultField(fieldId, rawValue)) {
    return rawValue;
  }
  const numericValue = toNumericDefaultValue(rawValue);
  if (numericValue === null || numericValue === 0) {
    return rawValue;
  }

  const scaleRatio = isScaledFontField(fieldId) ? DEFAULT_FONT_SCALE_RATIO : DEFAULT_SIZE_SCALE_RATIO;
  const scaledValue = Math.max(getMinimumScaledFieldValue(fieldId), numericValue * scaleRatio);
  const numericOptions = collectNumericOptionValues(
    Array.isArray(options) && options.length
      ? options
      : (isScaledFontField(fieldId) ? FONT_SIZE_SELECT_OPTIONS : []),
  );
  if (numericOptions.length) {
    let nearest = numericOptions[0];
    let nearestDistance = Math.abs(scaledValue - nearest.numericValue);
    numericOptions.forEach((option) => {
      const distance = Math.abs(scaledValue - option.numericValue);
      if (distance < nearestDistance) {
        nearest = option;
        nearestDistance = distance;
      }
    });
    return preserveDefaultValueType(rawValue, nearest.rawValue);
  }

  return preserveDefaultValueType(rawValue, roundScaledDefaultValue(fieldId, scaledValue));
}

function buildFieldMapFromDefinitions(definitions) {
  const definitionFieldMap = {};
  Object.keys(definitions || {}).forEach((chartType) => {
    const fieldMap = {};
    (definitions[chartType].fields || []).forEach((field) => {
      if (field.type !== "group") {
        fieldMap[field.id] = field;
      }
    });
    definitionFieldMap[chartType] = fieldMap;
  });
  return definitionFieldMap;
}

function buildFieldMapFromGroups(groups) {
  const fieldMap = {};
  (groups || []).forEach((group) => {
    (group.fields || []).forEach((field) => {
      fieldMap[field.id] = field;
    });
  });
  return fieldMap;
}

function applyScaledValuesToLocaleDefaults(defaultsByLocale, commonFieldOptions) {
  Object.keys(defaultsByLocale || {}).forEach((localeKey) => {
    const localeDefaults = defaultsByLocale[localeKey] || {};
    Object.keys(localeDefaults).forEach((fieldId) => {
      localeDefaults[fieldId] = scaleDefaultValue(fieldId, localeDefaults[fieldId], commonFieldOptions[fieldId]);
    });
  });
}

function applyScaledValuesToDefinitions(definitions) {
  Object.keys(definitions || {}).forEach((chartType) => {
    (definitions[chartType].fields || []).forEach((field) => {
      if (field.type === "group" || field.default === undefined) {
        return;
      }
      field.default = scaleDefaultValue(field.id, field.default, field.options);
    });
  });
}

function applyScaledValuesToBeautyDefaults(beautyDefaults, commonFieldOptions, definitionFieldMap) {
  Object.keys(beautyDefaults || {}).forEach((chartType) => {
    const beautyConfig = beautyDefaults[chartType] || {};
    const specificFieldMap = definitionFieldMap[chartType] || {};
    Object.keys(beautyConfig.common || {}).forEach((fieldId) => {
      beautyConfig.common[fieldId] = scaleDefaultValue(fieldId, beautyConfig.common[fieldId], commonFieldOptions[fieldId]);
    });
    Object.keys(beautyConfig.specific || {}).forEach((fieldId) => {
      beautyConfig.specific[fieldId] = scaleDefaultValue(
        fieldId,
        beautyConfig.specific[fieldId],
        specificFieldMap[fieldId] && specificFieldMap[fieldId].options,
      );
    });
  });
}

function setFieldDefault(chartType, fieldId, value) {
  const field = CHART_DEFINITIONS[chartType]?.fields?.find((item) => item.id === fieldId);
  if (field) {
    field.default = value;
  }
}

function setBeautySpecificDefault(chartType, fieldId, value) {
  if (!CHART_BEAUTY_DEFAULTS[chartType]) {
    return;
  }
  if (!CHART_BEAUTY_DEFAULTS[chartType].specific) {
    CHART_BEAUTY_DEFAULTS[chartType].specific = {};
  }
  CHART_BEAUTY_DEFAULTS[chartType].specific[fieldId] = value;
}

function applyTypographyPreset() {
  Object.values(COMMON_DEFAULTS).forEach((localeDefaults) => {
    localeDefaults.titleFontSize = TYPOGRAPHY_PRESET.titleFontSize;
    localeDefaults.subtitleFontSize = TYPOGRAPHY_PRESET.subtitleFontSize;
    localeDefaults.legendFontSize = TYPOGRAPHY_PRESET.legendFontSize;
    localeDefaults.xAxisLabelFontSize = TYPOGRAPHY_PRESET.xAxisLabelFontSize;
    localeDefaults.yAxisLabelFontSize = TYPOGRAPHY_PRESET.yAxisLabelFontSize;
  });

  [
    ["line", "labelFontSize"],
    ["bar", "labelFontSize"],
    ["pie", "labelFontSize"],
    ["area", "labelFontSize"],
    ["scatter", "labelFontSize"],
    ["radar", "labelFontSize"],
    ["funnel", "labelFontSize"],
    ["dualAxis", "leftAxisLabelFontSize"],
    ["dualAxis", "rightAxisLabelFontSize"],
    ["dualAxis", "leftBarLabelFontSize"],
    ["dualAxis", "rightBarLabelFontSize"],
    ["dualAxis", "leftLineLabelFontSize"],
    ["dualAxis", "rightLineLabelFontSize"],
  ].forEach(([chartType, fieldId]) => {
    setFieldDefault(chartType, fieldId, TYPOGRAPHY_PRESET.dataLabelFontSize);
    if (CHART_BEAUTY_DEFAULTS[chartType]?.specific && fieldId in CHART_BEAUTY_DEFAULTS[chartType].specific) {
      CHART_BEAUTY_DEFAULTS[chartType].specific[fieldId] = TYPOGRAPHY_PRESET.dataLabelFontSize;
    }
  });
}

function applyVisualPreset() {
  [
    ["line", "lineWidth", 4],
    ["line", "symbolSize", 8],
    ["area", "lineWidth", 3],
    ["area", "symbolSize", 6],
    ["area", "areaOpacity", 0.24],
    ["bar", "borderRadius", 0],
    ["pie", "labelLineWidth", 1],
    ["gauge", "titleFontSize", 14],
    ["gauge", "detailFontSize", 24],
    ["gauge", "axisLabelFontSize", 12],
    ["scatter", "symbolSize", 64],
    ["radar", "lineWidth", 3],
    ["radar", "symbolSize", 6],
    ["radar", "axisNameFontSize", 12],
    ["radar", "areaOpacity", 0.2],
    ["funnel", "gap", 2],
    ["dualAxis", "leftBarBorderRadius", 0],
    ["dualAxis", "rightBarBorderRadius", 0],
    ["dualAxis", "leftLineWidth", 4],
    ["dualAxis", "rightLineWidth", 4],
    ["dualAxis", "leftLineSymbolSize", 8],
    ["dualAxis", "rightLineSymbolSize", 8],
  ].forEach(([chartType, fieldId, value]) => {
    setFieldDefault(chartType, fieldId, value);
    setBeautySpecificDefault(chartType, fieldId, value);
  });
}

const COMMON_DEFAULTS = {
  en: {
    titleText: "CHARTS-VISUALIZATION",
    subtitleText: "Generated by config helper",
    titleShow: true,
    subtitleShow: true,
    titleAlign: "left",
    titleFontSize: 26,
    titleColor: "#1f2937",
    titleBold: true,
    subtitleFontSize: 11,
    subtitleColor: "#6b7280",
    backgroundColor: "#ffffff",
    legendFontSize: 6,
    legendColor: "#4b5563",
    palette: "#5470c6, #91cc75, #fac858, #ee6666, #73c0de",
    legendShow: true,
    legendPosition: "top-left",
    legendOrient: "horizontal",
    xSplitLineShow: false,
    xSplitLineColor: "#e5e7eb",
    xSplitLineType: "dashed",
    xSplitLineWidth: 1,
    xAxisLabelFontSize: 11,
    xAxisLabelColor: "#4b5563",
    xAxisLineShow: true,
    xAxisTickShow: true,
    xAxisLineColor: "#9ca3af",
    xFormatter: "{value}",
    xRotate: 0,
    yAxisLabelFontSize: 11,
    yAxisLabelColor: "#4b5563",
    yAxisLineShow: false,
    yAxisTickShow: true,
    yAxisLineColor: "#9ca3af",
    yFormatter: "{value}",
    splitLineShow: true,
    splitLineColor: "#e5e7eb",
    splitLineType: "dashed",
    splitLineWidth: 1,
    gridLeft: "12%",
    gridRight: "9%",
    gridTop: "21%",
    gridBottom: "15%",
  },
  zh: {
    titleText: "CHARTS-VISUALIZATION",
    subtitleText: "由配置助手生成",
    titleShow: true,
    subtitleShow: true,
    titleAlign: "left",
    titleFontSize: 26,
    titleColor: "#1f2937",
    titleBold: true,
    subtitleFontSize: 11,
    subtitleColor: "#6b7280",
    backgroundColor: "#ffffff",
    legendFontSize: 6,
    legendColor: "#4b5563",
    palette: "#5470c6, #91cc75, #fac858, #ee6666, #73c0de",
    legendShow: true,
    legendPosition: "top-left",
    legendOrient: "horizontal",
    xSplitLineShow: false,
    xSplitLineColor: "#e5e7eb",
    xSplitLineType: "dashed",
    xSplitLineWidth: 1,
    xAxisLabelFontSize: 11,
    xAxisLabelColor: "#4b5563",
    xAxisLineShow: true,
    xAxisTickShow: true,
    xAxisLineColor: "#9ca3af",
    xFormatter: "{value}",
    xRotate: 0,
    yAxisLabelFontSize: 11,
    yAxisLabelColor: "#4b5563",
    yAxisLineShow: false,
    yAxisTickShow: true,
    yAxisLineColor: "#9ca3af",
    yFormatter: "{value}",
    splitLineShow: true,
    splitLineColor: "#e5e7eb",
    splitLineType: "dashed",
    splitLineWidth: 1,
    gridLeft: "12%",
    gridRight: "9%",
    gridTop: "21%",
    gridBottom: "15%",
  },
};

const UI_TEXT = {
  en: {
    ready: "Ready",
    fixJson: "Fix JSON",
    copied: "Copied",
    copyFailed: "Copy failed",
    dataLabel: "Data",
    jsonInvalidPrefix: "{label} JSON is invalid: ",
    fixStyle: "// Fix JSON errors to regenerate style output.",
    specificFieldsSuffix: "fields",
    stylePayload: "Style Payload",
  },
  zh: {
    ready: "就绪",
    fixJson: "修复 JSON",
    copied: "已复制",
    copyFailed: "复制失败",
    dataLabel: "数据",
    jsonInvalidPrefix: "{label} JSON 格式错误: ",
    fixStyle: "// 请先修复 JSON 错误，再重新生成样式配置。",
    specificFieldsSuffix: "配置",
    stylePayload: "样式配置",
  },
};

const webSchemaModule = globalThis.DataChartsSchema || null;
if (!webSchemaModule) {
  throw new Error("DataChartsSchema is required before app.js");
}
const webRuntimeDefinitionsModule = globalThis.DataChartsRuntimeDefinitions || null;
if (!webRuntimeDefinitionsModule) {
  throw new Error("DataChartsRuntimeDefinitions is required before app.js");
}
const { COMMON_GROUPS, LOCALIZED_DEFINITION_TEXT, CHART_DEFINITIONS, CHART_TYPE_ORDER } = webSchemaModule;
const { CHART_RUNTIME_DEFINITIONS } = webRuntimeDefinitionsModule;
const COMMON_FIELD_MAP = buildFieldMapFromGroups(COMMON_GROUPS);

const COMMON_FIELD_DOM_IDS = {
  titleShow: "title-show",
  subtitleShow: "subtitle-show",
  titleAlign: "title-align",
  titleFontSize: "title-font-size",
  titleColor: "title-color",
  titleBold: "title-bold",
  subtitleFontSize: "subtitle-font-size",
  subtitleColor: "subtitle-color",
  backgroundColor: "background-color",
  legendFontSize: "legend-font-size",
  legendColor: "legend-color",
  palette: "palette-input",
  legendShow: "legend-show",
  legendPosition: "legend-position",
  legendOrient: "legend-orient",
  xSplitLineShow: "x-split-line-show",
  xSplitLineColor: "x-split-line-color",
  xSplitLineType: "x-split-line-type",
  xSplitLineWidth: "x-split-line-width",
  xAxisLabelFontSize: "x-axis-label-font-size",
  xAxisLabelColor: "x-axis-label-color",
  xAxisLineShow: "x-axis-line-show",
  xAxisTickShow: "x-axis-tick-show",
  xAxisLineColor: "x-axis-line-color",
  xFormatter: "x-formatter",
  xRotate: "x-rotate",
  yAxisLabelFontSize: "y-axis-label-font-size",
  yAxisLabelColor: "y-axis-label-color",
  yAxisLineShow: "y-axis-line-show",
  yAxisTickShow: "y-axis-tick-show",
  yAxisLineColor: "y-axis-line-color",
  yFormatter: "y-formatter",
  splitLineShow: "split-line-show",
  splitLineColor: "split-line-color",
  splitLineType: "split-line-type",
  splitLineWidth: "split-line-width",
  gridLeft: "grid-left",
  gridRight: "grid-right",
  gridTop: "grid-top",
  gridBottom: "grid-bottom",
};

const COMMON_FIELD_LABEL_DOM_IDS = {
  xAxisLineShow: "x-axis-line-show-label",
  xAxisTickShow: "x-axis-tick-show-label",
  xRotate: "x-rotate-label",
  xAxisLabelFontSize: "x-axis-label-font-size-label",
  xAxisLabelColor: "x-axis-label-color-label",
  xAxisLineColor: "x-axis-line-color-label",
  xFormatter: "x-formatter-label",
  yAxisLineShow: "y-axis-line-show-label",
  yAxisTickShow: "y-axis-tick-show-label",
  yAxisLabelFontSize: "y-axis-label-font-size-label",
  yAxisLabelColor: "y-axis-label-color-label",
  yAxisLineColor: "y-axis-line-color-label",
  yFormatter: "y-formatter-label",
};

const COMMON_FIELD_WRAPPER_IDS = {
  palette: "palette-field",
  xSplitLineShow: "x-split-line-show-field",
  xSplitLineColor: "x-split-line-color-field",
  xSplitLineType: "x-split-line-type-field",
  xSplitLineWidth: "x-split-line-width-field",
};

const COMMON_GROUP_FIELD_IDS = {
  titleMain: ["titleShow", "titleAlign", "titleFontSize", "titleColor", "titleBold"],
  titleSubtitle: ["subtitleShow", "subtitleFontSize", "subtitleColor"],
  canvasStyle: ["backgroundColor", "palette"],
  canvasSpacing: ["gridLeft", "gridRight", "gridTop", "gridBottom"],
  axesX: ["xAxisLineShow", "xAxisTickShow", "xRotate", "xAxisLabelFontSize", "xAxisLabelColor", "xAxisLineColor", "xFormatter"],
  axesY: ["yAxisLineShow", "yAxisTickShow", "yAxisLabelFontSize", "yAxisLabelColor", "yFormatter", "yAxisLineColor"],
};

const COMMON_GROUP_RENDER_TEXT = {
  zh: {
    groups: {
      title: { title: "标题", help: "这里对应图表顶部的标题区域，包括主标题和副标题。" },
      legend: { title: "图例" },
      canvas: { title: "画布" },
      axes: { title: "坐标轴" },
      splitLines: { title: "分割线" },
    },
    subgroups: {
      titleMain: "主标题",
      titleSubtitle: "副标题",
      canvasStyle: "画布样式",
      canvasSpacing: "绘图区",
      axesX: "X 轴",
      axesY: "Y 轴",
    },
    descriptions: {
      canvasSpacing: "这里的值表示绘图区四边留白占画布宽度或高度的百分比。",
    },
    fields: {
      titleShow: "显示主标题",
      titleAlign: "标题对齐",
      titleFontSize: "标题字号",
      titleColor: "标题颜色",
      titleBold: "标题加粗",
      subtitleShow: "显示副标题",
      subtitleFontSize: "副标题字号",
      subtitleColor: "副标题颜色",
      legendShow: "显示图例",
      legendPosition: "图例位置",
      legendOrient: "图例方向",
      legendFontSize: "图例字号",
      legendColor: "图例颜色",
      backgroundColor: "背景色",
      palette: "配色板",
      gridLeft: "左边距",
      gridRight: "右边距",
      gridTop: "上边距",
      gridBottom: "下边距",
      xAxisLineShow: "显示 X 轴线",
      xAxisTickShow: "显示 X 轴刻度",
      xRotate: "X 轴标签旋转",
      xAxisLabelFontSize: "X 轴标签字号",
      xAxisLabelColor: "X 轴标签颜色",
      xAxisLineColor: "X 轴线颜色",
      xFormatter: "X 轴格式",
      yAxisLineShow: "显示 Y 轴线",
      yAxisTickShow: "显示 Y 轴刻度",
      yAxisLabelFontSize: "Y 轴标签字号",
      yAxisLabelColor: "Y 轴标签颜色",
      yAxisLineColor: "Y 轴线颜色",
      yFormatter: "Y 轴格式",
      splitLineShow: "显示水平分割线",
      splitLineColor: "水平分割线颜色",
      splitLineType: "水平分割线样式",
      splitLineWidth: "水平分割线宽度",
      xSplitLineShow: "显示垂直分割线",
      xSplitLineColor: "垂直分割线颜色",
      xSplitLineType: "垂直分割线样式",
      xSplitLineWidth: "垂直分割线宽度",
    },
    options: {
      titleAlign: { left: "左对齐", center: "居中", right: "右对齐" },
      legendPosition: {
        "top-left": "左上",
        "top-center": "上中",
        "top-right": "右上",
        "middle-left": "左中",
        "middle-right": "右中",
        "bottom-left": "左下",
        "bottom-center": "下中",
        "bottom-right": "右下",
      },
      legendOrient: { horizontal: "水平", vertical: "垂直" },
      splitLineType: { solid: "实线", dashed: "虚线", dotted: "点线" },
      xSplitLineType: { solid: "实线", dashed: "虚线", dotted: "点线" },
    },
    actions: {
      customPalette: "自定义配色",
      addColor: "添加颜色",
      removeColor: "移除颜色",
    },
  },
  en: {
    groups: {
      title: { title: "Title", help: "This section controls the title area at the top of the chart, including the main title and subtitle." },
      legend: { title: "Legend" },
      canvas: { title: "Canvas" },
      axes: { title: "Axes" },
      splitLines: { title: "Split Lines" },
    },
    subgroups: {
      titleMain: "Main Title",
      titleSubtitle: "Subtitle",
      canvasStyle: "Canvas Style",
      canvasSpacing: "Plot Area",
      axesX: "X Axis",
      axesY: "Y Axis",
    },
    descriptions: {
      canvasSpacing: "These values control plot-area margins as a percentage of the canvas width or height.",
    },
    fields: {
      titleShow: "Show Title",
      titleAlign: "Title Align",
      titleFontSize: "Title Size",
      titleColor: "Title Color",
      titleBold: "Bold Title",
      subtitleShow: "Show Subtitle",
      subtitleFontSize: "Subtitle Size",
      subtitleColor: "Subtitle Color",
      legendShow: "Show Legend",
      legendPosition: "Legend Position",
      legendOrient: "Legend Orient",
      legendFontSize: "Legend Size",
      legendColor: "Legend Color",
      backgroundColor: "Background",
      palette: "Palette",
      gridLeft: "Left",
      gridRight: "Right",
      gridTop: "Top",
      gridBottom: "Bottom",
      xAxisLineShow: "Show X Axis Line",
      xAxisTickShow: "Show X Ticks",
      xRotate: "X Label Rotate",
      xAxisLabelFontSize: "X Label Size",
      xAxisLabelColor: "X Label Color",
      xAxisLineColor: "X Axis Line Color",
      xFormatter: "X Formatter",
      yAxisLineShow: "Show Y Axis Line",
      yAxisTickShow: "Show Y Ticks",
      yAxisLabelFontSize: "Y Label Size",
      yAxisLabelColor: "Y Label Color",
      yAxisLineColor: "Y Axis Line Color",
      yFormatter: "Y Formatter",
      splitLineShow: "Show Horizontal Split Lines",
      splitLineColor: "Horizontal Split Line Color",
      splitLineType: "Horizontal Split Line Style",
      splitLineWidth: "Horizontal Split Line Width",
      xSplitLineShow: "Show Vertical Split Lines",
      xSplitLineColor: "Vertical Split Line Color",
      xSplitLineType: "Vertical Split Line Style",
      xSplitLineWidth: "Vertical Split Line Width",
    },
    options: {},
    actions: {
      customPalette: "Custom Palette",
      addColor: "Add Color",
      removeColor: "Remove Color",
    },
  },
};

const appState = {
  chartType: "line",
  templateId: "series",
  layoutMode: MOBILE_LAYOUT_MEDIA.matches ? "mobile" : "desktop",
  activeMobileSectionId: "",
  dualAxisPreviewLeftType: null,
  dualAxisPreviewRightType: null,
  previewDualAxisLeftSeriesCount: 2,
  previewDualAxisRightSeriesCount: 2,
  previewStackMode: false,
  previewBarHorizontal: false,
  previewPieMode: "donut",
  previewSeriesCount: 2,
  latestResolvedOption: null,
  commonValuesCache: null,
  specificValuesCache: null,
  hasInitialized: false,
};

const DUAL_AXIS_COLOR_LIST_FIELD_IDS = new Set([
  "leftBarColors",
  "leftLineColors",
  "rightBarColors",
  "rightLineColors",
]);

const DUAL_AXIS_COLOR_LIST_FALLBACKS = {
  leftBarColors: ["#5470c6", "#73c0de", "#91cc75"],
  leftLineColors: ["#5470c6", "#3b82f6", "#06b6d4"],
  rightBarColors: ["#ef4444", "#f97316", "#f59e0b"],
  rightLineColors: ["#ef4444", "#f97316", "#f59e0b"],
};

function paletteToText(colors) {
  return colors.join(", ");
}

function gaugeBandColorsToText(colors) {
  return colors.join(", ");
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

  if (!parsed.length) {
    return fallback;
  }

  return parsed;
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

function renderPaletteColorInputs(colors) {
  const container = $("palette-custom-colors");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  colors.forEach((color) => {
    const input = document.createElement("input");
    input.className = "palette-color-input";
    input.type = "color";
    input.value = color;
    container.appendChild(input);
  });
}

function normalizeColorValue(color) {
  return String(color || "#ffffff").trim().toLowerCase();
}

function normalizeStrokeType(value) {
  return value === "solid" || value === "dashed" || value === "dotted" ? value : "dashed";
}

function getNextDistinctPaletteColor(colors) {
  const normalized = new Set((colors || []).map((color) => normalizeColorValue(color)));
  const candidates = [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
    "#2f4554",
    "#61a0a8",
    "#d48265",
  ];
  const next = candidates.find((color) => !normalized.has(normalizeColorValue(color)));
  return next || "#2f4554";
}

function setPalette(colors) {
  const input = $("palette-input");
  if (input) {
    input.value = paletteToText(colors);
  }
  renderPaletteColorInputs(colors);
}

function syncPaletteInput() {
  const input = $("palette-input");
  if (!input) {
    return;
  }
  const colors = Array.from($("palette-custom-colors")?.querySelectorAll(".palette-color-input") || [])
    .map((colorInput) => normalizeColorValue(colorInput.value))
    .filter(Boolean);
  input.value = paletteToText(colors);
}

function getCurrentGaugeBandColors() {
  const input = document.querySelector('[data-specific-field="bandStops"]');
  return parseGaugeBandColorsText(input?.value);
}

function getDualAxisColorListFallback(fieldId) {
  return DUAL_AXIS_COLOR_LIST_FALLBACKS[fieldId] || ["#5470c6", "#91cc75", "#fac858"];
}

function getCurrentSpecificColorList(fieldId) {
  const input = document.querySelector(`[data-specific-field="${fieldId}"]`);
  return parseColorListText(input?.value, getDualAxisColorListFallback(fieldId));
}

function syncSpecificColorListInput(fieldId) {
  const hiddenInput = document.querySelector(`[data-specific-field="${fieldId}"]`);
  if (!hiddenInput) {
    return;
  }
  const colors = Array.from(document.querySelectorAll(`[data-color-list-color="${fieldId}"]`))
    .map((input) => normalizeColorValue(input.value || "#5470c6"))
    .filter(Boolean);
  hiddenInput.value = paletteToText(colors.length ? colors : getDualAxisColorListFallback(fieldId));
}

function renderSpecificColorListInputs(fieldId, colors) {
  const container = document.querySelector(`[data-color-list-colors="${fieldId}"]`);
  if (!container) {
    return;
  }
  container.innerHTML = "";
  colors.forEach((color) => {
    const input = document.createElement("input");
    input.className = "palette-color-input";
    input.type = "color";
    input.value = color;
    input.dataset.colorListColor = fieldId;
    container.appendChild(input);
  });
}

function syncGaugeBandStopsInput() {
  const hiddenInput = document.querySelector('[data-specific-field="bandStops"]');
  if (!hiddenInput) {
    return;
  }
  const colors = Array.from(document.querySelectorAll("[data-gauge-band-color]"))
    .map((input) => normalizeColorValue(input.value || "#91cc75"))
    .filter(Boolean);

  hiddenInput.value = gaugeBandColorsToText(colors.length ? colors : parseGaugeBandColorsText(""));
}

function renderGaugeBandColorInputs(colors) {
  const container = document.querySelector("[data-gauge-band-colors]");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  colors.forEach((color) => {
    const input = document.createElement("input");
    input.className = "palette-color-input";
    input.dataset.gaugeBandColor = "true";
    input.type = "color";
    input.value = color;
    container.appendChild(input);
  });
}

function setBackgroundColorValue(color) {
  const normalized = normalizeColorValue(color);
  const hiddenInput = $("background-color");
  if (hiddenInput) {
    hiddenInput.value = normalized;
  }
  const customInput = $("background-custom-input");
  if (customInput) {
    customInput.value = normalized;
  }
}

const CHART_BEAUTY_DEFAULTS = {
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
    specific: { smooth: true, showSymbol: true, connectNulls: false, showLabel: true },
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
    specific: { showLabel: true, barGap: "10%" },
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
    specific: { labelPosition: "outside", startAngle: 90 },
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
      detailFontSize: 12,
      axisLabelShow: true,
      axisTickShow: true,
      splitLineShow: true,
      axisLabelDistance: 25,
      anchorSize: "20",
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
    specific: { smooth: true, showSymbol: true, connectNulls: false, showLabel: true, areaOpacity: 0.24, areaFillMode: "gradient" },
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
      splitLineType: "dashed",
      xSplitLineShow: false,
      gridLeft: "12%",
      gridRight: "12%",
      gridTop: "21%",
      gridBottom: "15%",
    },
    specific: {
      horizontal: false,
      splitLineFollowAxis: "left",
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
    specific: { showLabel: false, symbolSize: 64 },
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
      labelFontSize: 6,
      labelFormatter: "{b}: {c}",
      areaOpacity: 0.18,
      axisNameBold: true,
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

const WEB_COMMON_FIELD_OPTIONS = {
  titleFontSize: DEFAULT_COMMON_FONT_SIZE_OPTIONS,
  subtitleFontSize: DEFAULT_COMMON_FONT_SIZE_OPTIONS,
  legendFontSize: DEFAULT_COMMON_FONT_SIZE_OPTIONS,
  xAxisLabelFontSize: DEFAULT_COMMON_FONT_SIZE_OPTIONS,
  yAxisLabelFontSize: DEFAULT_COMMON_FONT_SIZE_OPTIONS,
  splitLineWidth: DEFAULT_COMMON_SPLIT_WIDTH_OPTIONS,
  xSplitLineWidth: DEFAULT_COMMON_SPLIT_WIDTH_OPTIONS,
};
const WEB_DEFINITION_FIELD_MAP = buildFieldMapFromDefinitions(CHART_DEFINITIONS);

applyScaledValuesToLocaleDefaults(COMMON_DEFAULTS, WEB_COMMON_FIELD_OPTIONS);
applyScaledValuesToDefinitions(CHART_DEFINITIONS);
applyScaledValuesToBeautyDefaults(CHART_BEAUTY_DEFAULTS, WEB_COMMON_FIELD_OPTIONS, WEB_DEFINITION_FIELD_MAP);
applyTypographyPreset();
applyVisualPreset();

function getLocaleText() {
  return UI_TEXT[CURRENT_LOCALE] || UI_TEXT.en;
}

function getSharedDefaultConfigModule() {
  return globalThis.DataChartsDefaultConfig || null;
}

function getSharedDefaultDataModule() {
  return globalThis.DataChartsDefaultData || null;
}

function getCommonDefaults() {
  const sharedConfig = getSharedDefaultConfigModule();
  if (sharedConfig && typeof sharedConfig.getCommonDefaults === "function") {
    return sharedConfig.getCommonDefaults(CURRENT_LOCALE);
  }
  return COMMON_DEFAULTS[CURRENT_LOCALE] || COMMON_DEFAULTS.en;
}

function getChartBeautyDefaults(chartType) {
  const sharedConfig = getSharedDefaultConfigModule();
  if (sharedConfig && typeof sharedConfig.getBeautyDefaults === "function") {
    return sharedConfig.getBeautyDefaults(chartType);
  }
  return deepClone(CHART_BEAUTY_DEFAULTS[chartType] || null);
}

function getDefaultRawDataForChart(chartType) {
  const sharedData = getSharedDefaultDataModule();
  if (sharedData && typeof sharedData.getDefaultRawData === "function") {
    return sharedData.getDefaultRawData(chartType);
  }
  const definition = getCurrentDefinition();
  const template = definition.templates.find((item) => item.id === appState.templateId) || definition.templates[0];
  return deepClone(template?.data || {});
}

function getDefinitionLocaleConfig(chartType) {
  return LOCALIZED_DEFINITION_TEXT[CURRENT_LOCALE]?.[chartType] || null;
}

function getLocalizedDefinition(chartType) {
  const base = CHART_DEFINITIONS[chartType];
  const localized = getDefinitionLocaleConfig(chartType);
  if (!localized) {
    return base;
  }

  return {
    ...base,
    label: localized.label || base.label,
    blurb: localized.blurb || base.blurb,
    tags: localized.tags || base.tags,
    fields: base.fields.map((field) => ({
      ...field,
      label: localized.fields?.[field.id] || field.label,
      options: field.options
        ? field.options.map(([value, label]) => [value, localized.options?.[field.id]?.[value] || label])
        : field.options,
    })),
    templates: base.templates.map((template) => ({
      ...template,
      label: localized.templates?.[template.id]?.label || template.label,
      help: localized.templates?.[template.id]?.help || template.help,
    })),
  };
}

function getText(key) {
  return getLocaleText()[key] || UI_TEXT.en[key] || "";
}

function $(id) {
  return document.getElementById(id);
}

function getLayoutMode() {
  return MOBILE_LAYOUT_MEDIA.matches ? "mobile" : "desktop";
}

function isMobileLayout() {
  return getLayoutMode() === "mobile";
}

function getActivePreviewContainerId() {
  return appState.layoutMode === "mobile" ? "mobile-preview-canvas" : "preview-canvas";
}

function getInactivePreviewContainerId() {
  return appState.layoutMode === "mobile" ? "preview-canvas" : "mobile-preview-canvas";
}

function setTextIfExists(id, value) {
  const node = $(id);
  if (node) {
    node.textContent = value;
  }
}

function booleanSelectValue(value) {
  return value ? "true" : "false";
}

function readBooleanControl(node, fallback = false) {
  if (!node) {
    return fallback;
  }
  if (node.type === "checkbox") {
    return node.checked;
  }
  if (node.value === "true") {
    return true;
  }
  if (node.value === "false") {
    return false;
  }
  return fallback;
}

function setValueIfExists(id, value) {
  const node = $(id);
  if (!node || value === undefined) {
    return;
  }
  if (node.type === "checkbox" || node.dataset.booleanSelect === "true") {
    node.value = booleanSelectValue(Boolean(value));
    if (node.type === "checkbox") {
      node.checked = Boolean(value);
    }
  } else {
    node.value = value;
  }
}

function normalizeGridPercentValue(value, fallback = "10%") {
  if (typeof value === "string" && value.trim().endsWith("%")) {
    return value.trim();
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const rounded = Math.max(0, Math.min(42, Math.round((numeric / 10) / 3) * 3));
    return `${rounded}%`;
  }
  return fallback;
}

function getCommonRenderText() {
  return COMMON_GROUP_RENDER_TEXT[CURRENT_LOCALE] || COMMON_GROUP_RENDER_TEXT.en;
}

function getCommonGroupDefinition(groupId) {
  return (COMMON_GROUPS || []).find((group) => group.id === groupId) || null;
}

function getCommonFieldDefinition(fieldId) {
  return COMMON_FIELD_MAP[fieldId] || null;
}

function getCommonFieldLabel(fieldId) {
  const localeText = getCommonRenderText();
  return localeText.fields[fieldId] || getCommonFieldDefinition(fieldId)?.label || fieldId;
}

function getCommonOptionLabel(fieldId, value, fallbackLabel) {
  const localeText = getCommonRenderText();
  const scoped = localeText.options[fieldId];
  if (!scoped) {
    return fallbackLabel;
  }
  return scoped[String(value)] || scoped[value] || fallbackLabel;
}

function getCommonFieldWrapperId(fieldId) {
  return COMMON_FIELD_WRAPPER_IDS[fieldId] || "";
}

function getCommonFieldLabelId(fieldId) {
  return COMMON_FIELD_LABEL_DOM_IDS[fieldId] || "";
}

function renderCommonBooleanSelect(fieldId, value) {
  const yesText = CURRENT_LOCALE === "zh" ? "是" : "Yes";
  const noText = CURRENT_LOCALE === "zh" ? "否" : "No";
  const selectedValue = booleanSelectValue(Boolean(value));
  return `
    <select id="${COMMON_FIELD_DOM_IDS[fieldId]}" data-boolean-select="true">
      <option value="true" ${selectedValue === "true" ? "selected" : ""}>${yesText}</option>
      <option value="false" ${selectedValue === "false" ? "selected" : ""}>${noText}</option>
    </select>
  `;
}

function renderCommonSelect(fieldId, field, value) {
  const selectedValue = String(value ?? "");
  return `
    <select id="${COMMON_FIELD_DOM_IDS[fieldId]}">
      ${(field.options || [])
        .map(([optionValue, optionLabel]) => {
          const label = getCommonOptionLabel(fieldId, optionValue, optionLabel);
          return `<option value="${optionValue}" ${String(optionValue) === selectedValue ? "selected" : ""}>${label}</option>`;
        })
        .join("")}
    </select>
  `;
}

function renderCommonInput(fieldId, field, value) {
  if (field.type === "checkbox") {
    return renderCommonBooleanSelect(fieldId, value);
  }
  if (field.type === "select") {
    return renderCommonSelect(fieldId, field, value);
  }
  if (field.type === "number") {
    const step = field.step !== undefined ? ` step="${field.step}"` : "";
    return `<input id="${COMMON_FIELD_DOM_IDS[fieldId]}" type="number" value="${value ?? ""}"${step} />`;
  }
  if (field.type === "color") {
    return `<input id="${COMMON_FIELD_DOM_IDS[fieldId]}" type="color" value="${value ?? "#ffffff"}" />`;
  }
  return `<input id="${COMMON_FIELD_DOM_IDS[fieldId]}" type="text" value="${value ?? ""}" />`;
}

function renderBackgroundField(value) {
  return `
    <label class="field">
      <span>${getCommonFieldLabel("backgroundColor")}</span>
      <input id="background-color" class="background-hidden-input" type="color" value="${value || "#ffffff"}" />
      <div class="background-picker">
        <div class="background-customizer">
          <div class="background-custom-row">
            <input id="background-custom-input" class="background-color-input" type="color" value="${value || "#ffffff"}" />
          </div>
        </div>
      </div>
    </label>
  `;
}

function renderPaletteField(value) {
  const localeText = getCommonRenderText();
  return `
    <label id="palette-field" class="field field-wide">
      <span>${getCommonFieldLabel("palette")}</span>
      <textarea id="palette-input" class="palette-hidden-input" rows="3">${value || ""}</textarea>
      <div class="palette-picker">
        <div class="palette-customizer">
          <div class="palette-customizer-head">
            <strong>${localeText.actions.customPalette}</strong>
            <div class="template-actions">
              <button id="add-custom-palette" class="secondary-button small" type="button">${localeText.actions.addColor}</button>
              <button id="remove-custom-palette" class="secondary-button small" type="button">${localeText.actions.removeColor}</button>
            </div>
          </div>
          <div id="palette-custom-colors" class="palette-custom-colors"></div>
        </div>
      </div>
    </label>
  `;
}

function renderCommonFieldControl(fieldId, values) {
  const field = getCommonFieldDefinition(fieldId);
  if (!field) {
    return "";
  }
  const value = values[fieldId];
  if (fieldId === "backgroundColor") {
    return renderBackgroundField(value);
  }
  if (fieldId === "palette") {
    return renderPaletteField(value);
  }
  const wrapperId = getCommonFieldWrapperId(fieldId);
  const labelId = getCommonFieldLabelId(fieldId);
  return `
    <label${wrapperId ? ` id="${wrapperId}"` : ""} class="field">
      <span${labelId ? ` id="${labelId}"` : ""}>${getCommonFieldLabel(fieldId)}</span>
      ${renderCommonInput(fieldId, field, value)}
    </label>
  `;
}

function renderCommonFieldGrid(fieldIds, values) {
  return fieldIds
    .map((fieldId) => renderCommonFieldControl(fieldId, values))
    .filter(Boolean)
    .join("");
}

function renderCommonFoundationSections() {
  const localeText = getCommonRenderText();
  const defaults = getCommonDefaults();
  const titleGroup = $("title-group");
  const legendGroup = $("legend-group");
  const canvasGroup = $("layout-group");
  const axesGroup = $("axes-group");
  const splitLinesGroup = $("split-lines-group");

  if (titleGroup && getCommonGroupDefinition("title")) {
    titleGroup.innerHTML = `
      <div class="foundation-group-head">
        <h4>${localeText.groups.title.title}</h4>
        <p>${localeText.groups.title.help}</p>
      </div>
      <div class="foundation-subgroup">
        <div class="foundation-subgroup-head">${localeText.subgroups.titleMain}</div>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.titleMain, defaults)}</div>
      </div>
      <div class="foundation-subgroup">
        <div class="foundation-subgroup-head">${localeText.subgroups.titleSubtitle}</div>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.titleSubtitle, defaults)}</div>
      </div>
    `;
  }

  if (legendGroup && getCommonGroupDefinition("legend")) {
    const legendFieldIds = (getCommonGroupDefinition("legend").fields || []).map((field) => field.id);
    legendGroup.innerHTML = `
      <div class="foundation-group-head">
        <h4>${localeText.groups.legend.title}</h4>
      </div>
      <div class="field-grid">${renderCommonFieldGrid(legendFieldIds, defaults)}</div>
    `;
  }

  if (canvasGroup && getCommonGroupDefinition("canvas")) {
    canvasGroup.innerHTML = `
      <div class="foundation-group-head">
        <h4>${localeText.groups.canvas.title}</h4>
      </div>
      <div class="foundation-subgroup">
        <div class="foundation-subgroup-head">${localeText.subgroups.canvasStyle}</div>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.canvasStyle, defaults)}</div>
      </div>
      <div id="layout-spacing-group" class="foundation-subgroup">
        <div class="foundation-subgroup-head">${localeText.subgroups.canvasSpacing}</div>
        <p>${localeText.descriptions.canvasSpacing}</p>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.canvasSpacing, defaults)}</div>
      </div>
    `;
  }

  if (axesGroup && getCommonGroupDefinition("axes")) {
    axesGroup.innerHTML = `
      <div class="foundation-group-head">
        <h4 id="axes-group-title">${localeText.groups.axes.title}</h4>
      </div>
      <div id="x-axis-subgroup" class="foundation-subgroup">
        <div id="x-axis-subgroup-head" class="foundation-subgroup-head">${localeText.subgroups.axesX}</div>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.axesX, defaults)}</div>
      </div>
      <div id="y-axis-subgroup" class="foundation-subgroup">
        <div id="y-axis-subgroup-head" class="foundation-subgroup-head">${localeText.subgroups.axesY}</div>
        <div class="field-grid">${renderCommonFieldGrid(COMMON_GROUP_FIELD_IDS.axesY, defaults)}</div>
      </div>
      <div id="dual-axis-extra-axes" class="hidden"></div>
    `;
  }

  if (splitLinesGroup && getCommonGroupDefinition("splitLines")) {
    const splitFieldIds = (getCommonGroupDefinition("splitLines").fields || []).map((field) => field.id);
    splitLinesGroup.innerHTML = `
      <div class="foundation-group-head">
        <h4>${localeText.groups.splitLines.title}</h4>
      </div>
      <div class="field-grid">${renderCommonFieldGrid(splitFieldIds, defaults)}</div>
    `;
  }
}

function applyCommonFieldValues(values) {
  Object.entries(values || {}).forEach(([key, value]) => {
    setValueIfExists(COMMON_FIELD_DOM_IDS[key], value);
  });
  if (values?.palette) {
    setPalette(parsePalette(values.palette));
  }
  if (values?.backgroundColor) {
    setBackgroundColorValue(values.backgroundColor);
  }
}

function applySpecificFieldValues(values) {
  Object.entries(values || {}).forEach(([key, value]) => {
    const node = document.querySelector(`[data-specific-field="${key}"]`);
    if (!node) {
      return;
    }
    if (node.type === "checkbox" || node.dataset.booleanSelect === "true") {
      node.value = booleanSelectValue(Boolean(value));
      if (node.type === "checkbox") {
        node.checked = Boolean(value);
      }
    } else {
      node.value = value;
    }
  });
}

function applyChartBeautyDefaults(chartType) {
  const config = getChartBeautyDefaults(chartType);
  appState.commonValuesCache = { ...getCommonDefaults() };
  appState.specificValuesCache = buildSpecificDefaultState(getCurrentDefinition());
  resetCommonFields();
  if (chartType === "pie") {
    appState.previewPieMode = "donut";
  }
  if (config) {
    appState.commonValuesCache = {
      ...appState.commonValuesCache,
      ...config.common,
      palette: config.common?.palette ? parsePalette(config.common.palette) : appState.commonValuesCache.palette,
    };
    appState.specificValuesCache = {
      ...appState.specificValuesCache,
      ...config.specific,
    };
    applyCommonFieldValues(config.common);
    applySpecificFieldValues(config.specific);
  }
  updateOutputs();
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

function parsePalette(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCurrentDefinition() {
  return getLocalizedDefinition(appState.chartType);
}

function getCurrentRuntimeDefinition() {
  return CHART_RUNTIME_DEFINITIONS[appState.chartType] || null;
}

function buildChartCards() {
  const container = $("chart-grid");
  container.innerHTML = "";
  CHART_TYPE_ORDER.filter((key) => CHART_DEFINITIONS[key]).forEach((key) => {
    const localizedDefinition = getLocalizedDefinition(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chart-card${key === appState.chartType ? " active" : ""}`;
    button.dataset.chartType = key;
    button.innerHTML = `
      <div class="chart-card-head">
        <span class="chart-card-title">${localizedDefinition.label}</span>
      </div>
    `;
    container.appendChild(button);
  });
}

function renderChartSummary() {
  const definition = getCurrentDefinition();
  $("chart-summary").innerHTML = `
    <p>${definition.blurb}</p>
    <div class="pill-row">${definition.tags
      .map((tag) => `<span class="pill">${tag}</span>`)
      .join("")}</div>
  `;
}

function getCachedCommonValues() {
  return appState.commonValuesCache || getCommonDefaults();
}

function getCachedSpecificValues() {
  const definition = getCurrentDefinition();
  const fallback = {};
  definition.fields.forEach((field) => {
    if (field.type !== "group") {
      fallback[field.id] = field.default;
    }
  });
  return appState.specificValuesCache || fallback;
}

function shouldShowMobileCommonGroup(groupId, definition) {
  const runtimeDefinition = CHART_RUNTIME_DEFINITIONS[appState.chartType] || {};
  if (groupId === "legend") {
    return runtimeDefinition.supportsLegend !== false;
  }
  if (groupId === "axes" || groupId === "splitLines") {
    return Boolean(runtimeDefinition.usesCartesian);
  }
  return true;
}

function buildMobileCommonSections(values) {
  const definition = getCurrentDefinition();
  const localeText = getCommonRenderText();
  return (COMMON_GROUPS || [])
    .filter((group) => shouldShowMobileCommonGroup(group.id, definition))
    .map((group) => ({
      id: `common:${group.id}`,
      scope: "common",
      tabLabel: localeText.groups[group.id]?.title || group.label,
      panelTitle: localeText.groups[group.id]?.title || group.label,
      help: localeText.groups[group.id]?.help || "",
      fieldIds: (group.fields || [])
        .map((field) => field.id)
        .filter((fieldId) => fieldId !== "titleText" && fieldId !== "subtitleText"),
      values,
    }))
    .filter((section) => section.fieldIds.length);
}

function buildMobileSpecificSections(values) {
  const definition = getCurrentDefinition();
  const sections = [];
  let current = {
    id: "specific:default",
    scope: "specific",
    tabLabel: definition.label,
    panelTitle: definition.label,
    help: definition.blurb || "",
    fieldIds: [],
    values,
  };

  definition.fields.forEach((field) => {
    if (field.type === "group") {
      if (current.fieldIds.length) {
        sections.push(current);
      }
      current = {
        id: `specific:${field.id}`,
        scope: "specific",
        tabLabel: field.label,
        panelTitle: field.label,
        help: field.help || "",
        fieldIds: [],
        values,
      };
      return;
    }
    current.fieldIds.push(field.id);
  });

  if (current.fieldIds.length) {
    sections.push(current);
  }

  return sections;
}

function getMobileConfigSections() {
  const commonValues = getCachedCommonValues();
  const specificValues = getCachedSpecificValues();
  return [
    ...buildMobileCommonSections(commonValues),
    ...buildMobileSpecificSections(specificValues),
  ];
}

function ensureActiveMobileSectionId(sections, preferredId = "") {
  if (!sections.length) {
    appState.activeMobileSectionId = "";
    return null;
  }
  const candidate = preferredId || appState.activeMobileSectionId;
  const active = sections.find((section) => section.id === candidate) || sections[0];
  appState.activeMobileSectionId = active.id;
  return active;
}

function buildMobileCommonFieldCard(fieldId, values) {
  const field = getCommonFieldDefinition(fieldId);
  if (!field) {
    return "";
  }
  const isWide = fieldId === "palette" || fieldId === "backgroundColor";
  return `
    <div class="mobile-field-card${isWide ? " mobile-field-card-wide" : ""}">
      ${renderCommonFieldControl(fieldId, values)}
    </div>
  `;
}

function buildMobileSpecificFieldCard(field, value) {
  const isWide = field.id === "bandStops" || DUAL_AXIS_COLOR_LIST_FIELD_IDS.has(field.id);
  const wrapper = document.createElement("div");
  wrapper.className = `mobile-field-card${isWide ? " mobile-field-card-wide" : ""}`;
  wrapper.appendChild(buildSpecificFieldControl(field, value));
  return wrapper;
}

function renderMobileChartTabs() {
  const container = $("mobile-chart-tabs");
  if (!container) {
    return;
  }
  container.innerHTML = CHART_TYPE_ORDER.filter((key) => CHART_DEFINITIONS[key]).map((key) => {
    const localizedDefinition = getLocalizedDefinition(key);
    return `
      <button type="button" class="mobile-chart-tab${key === appState.chartType ? " active" : ""}" data-chart-type="${key}">
        ${localizedDefinition.label}
      </button>
    `;
  }).join("");
}

function renderMobileConfigPanel(preferredSectionId = "") {
  const container = $("mobile-config-panel");
  const tabsContainer = $("mobile-config-tabs");
  const titleNode = $("mobile-config-panel-title");
  const helpNode = $("mobile-config-panel-help");
  const fieldsContainer = $("mobile-config-fields");
  const chip = $("mobile-config-chip");
  const previewTitle = $("mobile-preview-title");
  const sections = getMobileConfigSections();
  const activeSection = ensureActiveMobileSectionId(sections, preferredSectionId);

  if (previewTitle) {
    previewTitle.textContent = getCurrentDefinition().label;
  }
  if (chip) {
    chip.textContent = getCurrentDefinition().label;
  }
  if (tabsContainer) {
    tabsContainer.innerHTML = sections.map((section) => `
      <button
        type="button"
        class="mobile-section-tab${section.id === appState.activeMobileSectionId ? " active" : ""}"
        data-mobile-section-id="${section.id}"
      >
        ${section.tabLabel}
      </button>
    `).join("");
  }

  if (!container || !titleNode || !helpNode || !fieldsContainer) {
    return;
  }

  if (!activeSection) {
    container.classList.add("hidden");
    titleNode.textContent = "";
    helpNode.textContent = "";
    helpNode.classList.add("hidden");
    fieldsContainer.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");
  titleNode.textContent = activeSection.panelTitle;
  helpNode.textContent = activeSection.help || "";
  helpNode.classList.toggle("hidden", !activeSection.help);

  if (activeSection.scope === "common") {
    fieldsContainer.innerHTML = activeSection.fieldIds
      .map((fieldId) => buildMobileCommonFieldCard(fieldId, activeSection.values))
      .join("");
    return;
  }

  fieldsContainer.innerHTML = "";
  const definition = getCurrentDefinition();
  const fieldsById = new Map(definition.fields.filter((field) => field.type !== "group").map((field) => [field.id, field]));
  activeSection.fieldIds.forEach((fieldId) => {
    const field = fieldsById.get(fieldId);
    if (!field) {
      return;
    }
    fieldsContainer.appendChild(buildMobileSpecificFieldCard(field, activeSection.values[field.id]));
  });
}

function resetMobileConfigViewport() {
  const tabsScroll = $("mobile-config-tabs-scroll");
  const chartTabsScroll = $("mobile-chart-tabs-scroll");
  const panelScroll = $("mobile-config-panel-scroll");
  if (chartTabsScroll) {
    chartTabsScroll.scrollLeft = 0;
  }
  if (tabsScroll) {
    tabsScroll.scrollLeft = 0;
  }
  if (panelScroll) {
    panelScroll.scrollTop = 0;
  }
}

function buildPreviewToggleButtons(buttons, datasetKey) {
  return buttons
    .map((button) => `
      <button
        type="button"
        class="dual-axis-preview-button${button.active ? " active" : ""}"
        ${Object.entries(button.dataset || {})
          .map(([key, value]) => `data-${datasetKey || key}="${value}"`)
          .join(" ")}
      >${button.label}</button>
    `)
    .join("");
}

function buildPreviewControlCard(label, buttons, options = {}) {
  const cardClassName = `dual-axis-preview-control${options.wide ? " dual-axis-preview-control-wide" : ""}`;
  const toggleClassName = `dual-axis-preview-toggle${options.wrap ? " dual-axis-preview-toggle-wrap" : ""}`;
  return `
    <div class="${cardClassName}">
      <div class="dual-axis-preview-label">${label}</div>
      <div class="${toggleClassName}">
        ${buttons}
      </div>
    </div>
  `;
}

function supportsSeriesCountPreview(chartType) {
  return chartType === "line"
    || chartType === "bar"
    || chartType === "area"
    || chartType === "scatter";
}

function getPreviewControlGroupsModel() {
  const chartType = appState.chartType;
  const isDualAxis = chartType === "dualAxis";
  const isLinePreviewChart = chartType === "line";
  const isBarPreviewChart = chartType === "bar";
  const isAreaPreviewChart = chartType === "area";
  const isScatterPreviewChart = chartType === "scatter";
  const isPiePreviewChart = chartType === "pie";
  const panelTitle = CURRENT_LOCALE === "zh" ? "预览配置" : "Preview Config";
  const panelNote = CURRENT_LOCALE === "zh"
    ? "这里只切换预览展示方式，不影响复制出的配置结构，Agent会自动选择合适的图形方式。"
    : "These switches only change the preview presentation and do not change the copied config structure. The agent will choose an appropriate chart form automatically.";
  if (!isDualAxis && !isLinePreviewChart && !isBarPreviewChart && !isAreaPreviewChart && !isScatterPreviewChart && !isPiePreviewChart) {
    return { visible: false, panelTitle, panelNote, groups: [] };
  }

  const seriesCountTitle = CURRENT_LOCALE === "zh" ? "预览数量" : "Mock Data Count";
  const seriesCountButtons = [1, 2, 5, 8].map((count) => ({
    label: String(count),
    active: Number(appState.previewSeriesCount) === count,
    dataset: { "preview-series-count": String(count) },
  }));

  if (isLinePreviewChart || isScatterPreviewChart) {
    return {
      visible: true,
      panelTitle,
      panelNote,
      groups: [{ id: "seriesCount", title: seriesCountTitle, buttons: seriesCountButtons }],
    };
  }

  if (isBarPreviewChart) {
    const layoutLabel = CURRENT_LOCALE === "zh" ? "布局预览" : "Layout Preview";
    const verticalText = CURRENT_LOCALE === "zh" ? "纵向" : "Vertical";
    const horizontalText = CURRENT_LOCALE === "zh" ? "横向" : "Horizontal";
    const modeLabel = CURRENT_LOCALE === "zh" ? "预览方式" : "Preview Mode";
    const normalText = CURRENT_LOCALE === "zh" ? "普通" : "Normal";
    const stackedText = CURRENT_LOCALE === "zh" ? "堆叠" : "Stacked";
    return {
      visible: true,
      panelTitle,
      panelNote,
      groups: [
        { id: "seriesCount", title: seriesCountTitle, buttons: seriesCountButtons },
        {
          id: "barLayout",
          title: layoutLabel,
          buttons: [
            { label: verticalText, active: !appState.previewBarHorizontal, dataset: { "preview-bar-layout": "vertical" } },
            { label: horizontalText, active: appState.previewBarHorizontal, dataset: { "preview-bar-layout": "horizontal" } },
          ],
        },
        {
          id: "stackMode",
          title: modeLabel,
          buttons: [
            { label: normalText, active: !appState.previewStackMode, dataset: { "preview-stack-mode": "normal" } },
            { label: stackedText, active: appState.previewStackMode, dataset: { "preview-stack-mode": "stacked" } },
          ],
        },
      ],
    };
  }

  if (isAreaPreviewChart) {
    const modeLabel = CURRENT_LOCALE === "zh" ? "预览方式" : "Preview Mode";
    const normalText = CURRENT_LOCALE === "zh" ? "普通" : "Normal";
    const stackedText = CURRENT_LOCALE === "zh" ? "堆叠" : "Stacked";
    return {
      visible: true,
      panelTitle,
      panelNote,
      groups: [
        { id: "seriesCount", title: seriesCountTitle, buttons: seriesCountButtons },
        {
          id: "stackMode",
          title: modeLabel,
          buttons: [
            { label: normalText, active: !appState.previewStackMode, dataset: { "preview-stack-mode": "normal" } },
            { label: stackedText, active: appState.previewStackMode, dataset: { "preview-stack-mode": "stacked" } },
          ],
        },
      ],
    };
  }

  if (isPiePreviewChart) {
    const label = CURRENT_LOCALE === "zh" ? "预览图形" : "Preview Shape";
    const pieText = CURRENT_LOCALE === "zh" ? "饼图" : "Pie";
    const donutText = CURRENT_LOCALE === "zh" ? "环图" : "Donut";
    const roseAreaText = CURRENT_LOCALE === "zh" ? "玫瑰面积" : "Rose Area";
    const roseRadiusText = CURRENT_LOCALE === "zh" ? "玫瑰半径" : "Rose Radius";
    return {
      visible: true,
      panelTitle,
      panelNote,
      groups: [
        {
          id: "pieMode",
          title: label,
          buttons: [
            { label: pieText, active: appState.previewPieMode === "pie", dataset: { "preview-pie-mode": "pie" } },
            { label: donutText, active: appState.previewPieMode === "donut", dataset: { "preview-pie-mode": "donut" } },
            { label: roseAreaText, active: appState.previewPieMode === "roseArea", dataset: { "preview-pie-mode": "roseArea" } },
            { label: roseRadiusText, active: appState.previewPieMode === "roseRadius", dataset: { "preview-pie-mode": "roseRadius" } },
          ],
        },
      ],
    };
  }

  const { leftType, rightType } = resolveDualAxisSeriesTypes();
  const dualAxisLeftCountLabel = CURRENT_LOCALE === "zh" ? "左侧数量" : "Left Count";
  const dualAxisRightCountLabel = CURRENT_LOCALE === "zh" ? "右侧数量" : "Right Count";
  const leftLabel = CURRENT_LOCALE === "zh" ? "左侧预览类型" : "Left Preview Type";
  const rightLabel = CURRENT_LOCALE === "zh" ? "右侧预览类型" : "Right Preview Type";
  const barText = CURRENT_LOCALE === "zh" ? "柱" : "Bar";
  const lineText = CURRENT_LOCALE === "zh" ? "线" : "Line";
  const dualAxisCountButtons = (side) => [1, 2, 4].map((count) => ({
    label: String(count),
    active: Number(side === "left" ? appState.previewDualAxisLeftSeriesCount : appState.previewDualAxisRightSeriesCount) === count,
    dataset: {
      "preview-dual-axis-series-side": side,
      "preview-dual-axis-series-count": String(count),
    },
  }));

  return {
    visible: true,
    panelTitle,
    panelNote,
    groups: [
      { id: "dualAxisLeftCount", title: dualAxisLeftCountLabel, buttons: dualAxisCountButtons("left") },
      { id: "dualAxisRightCount", title: dualAxisRightCountLabel, buttons: dualAxisCountButtons("right") },
      {
        id: "dualAxisLeftType",
        title: leftLabel,
        buttons: [
          { label: barText, active: leftType === "bar", dataset: { "dual-axis-side": "left", "dual-axis-type": "bar" } },
          { label: lineText, active: leftType === "line", dataset: { "dual-axis-side": "left", "dual-axis-type": "line" } },
        ],
      },
      {
        id: "dualAxisRightType",
        title: rightLabel,
        buttons: [
          { label: barText, active: rightType === "bar", dataset: { "dual-axis-side": "right", "dual-axis-type": "bar" } },
          { label: lineText, active: rightType === "line", dataset: { "dual-axis-side": "right", "dual-axis-type": "line" } },
        ],
      },
    ],
  };
}

function renderDualAxisPreviewControls() {
  const container = $("dual-axis-preview-controls");
  const model = getPreviewControlGroupsModel();
  const seriesCountDesktopLabel = CURRENT_LOCALE === "zh" ? "模拟数据数量" : "Mock Data Count";
  if (!container) {
    return;
  }
  if (!model.visible) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }
  container.innerHTML = `
    <div class="dual-axis-preview-head">
      <div class="dual-axis-preview-title">${model.panelTitle}</div>
      <p class="dual-axis-preview-note">${model.panelNote}</p>
    </div>
    <div class="dual-axis-preview-grid">
      ${model.groups.map((group) => buildPreviewControlCard(
        group.title === (CURRENT_LOCALE === "zh" ? "预览数量" : "Mock Data Count") ? seriesCountDesktopLabel : group.title,
        buildPreviewToggleButtons(group.buttons),
        { wide: group.buttons.length > 2, wrap: group.buttons.length > 2 },
      )).join("")}
    </div>
  `;
  container.classList.remove("hidden");
}

function renderMobilePreviewControls() {
  const container = $("mobile-preview-controls");
  const model = getPreviewControlGroupsModel();
  const fixedLabel = CURRENT_LOCALE === "zh" ? "预览配置（不会导出）：" : "Preview Only:";
  if (!container) {
    return;
  }
  if (!model.visible) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }
  container.innerHTML = `
    <div class="mobile-preview-config-layout">
      <div class="mobile-preview-config-fixed-label">${fixedLabel}</div>
      <div class="mobile-preview-config-scroll">
        <div class="mobile-preview-config-row">
          ${model.groups.map((group) => `
            <div class="mobile-preview-config-group">
              <div class="mobile-preview-config-group-label">${group.title}</div>
              <div class="mobile-preview-config-buttons">
                ${group.buttons.map((button) => `
                  <button
                    type="button"
                    class="mobile-preview-config-button${button.active ? " active" : ""}"
                    ${Object.entries(button.dataset || {}).map(([key, value]) => `data-${key}="${value}"`).join(" ")}
                  >${button.label}</button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  container.classList.remove("hidden");
}

function renderPreviewControls() {
  renderDualAxisPreviewControls();
  renderMobilePreviewControls();
}

const DUAL_AXIS_FOUNDATION_AXIS_FIELD_IDS = new Set([
  "splitLineFollowAxis",
  "leftAxisLabelFontSize",
  "leftAxisLabelColor",
  "leftAxisLineShow",
  "leftAxisLineColor",
  "leftAxisTickShow",
  "leftAxisFormatter",
  "rightAxisLabelFontSize",
  "rightAxisLabelColor",
  "rightAxisLineShow",
  "rightAxisLineColor",
  "rightAxisTickShow",
  "rightAxisFormatter",
]);

const DUAL_AXIS_FOUNDATION_AXIS_GROUP_IDS = new Set(["splitLineAxisGroup", "leftAxisGroup", "rightAxisGroup"]);

function getLabelSectionConfig(chartType) {
  const text = {
    zh: {
      title: "标签",
      description: "这里集中当前图表的标签相关配置；不同图表会显示各自合适的标签能力。",
      line: [{ id: "lineLabels", title: "数据标签", help: "控制折线数据标签是否显示以及文字样式。", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      bar: [{ id: "barLabels", title: "数据标签", help: "控制柱标签显示、位置和文字样式。", fields: ["showLabel", "labelPosition", "labelFontSize", "labelColor"] }],
      pie: [{ id: "pieLabels", title: "扇区标签", help: "控制饼图标签、格式，以及外侧标签引导线。", fields: ["showLabel", "labelPosition", "labelFormatter", "labelFontSize", "labelColor", "labelLineShow", "labelLineColor", "labelLineWidth"] }],
      area: [{ id: "areaLabels", title: "数据标签", help: "控制面积图数据标签是否显示以及文字样式。", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      scatter: [{ id: "scatterLabels", title: "点标签", help: "控制散点标签是否显示以及文字样式。", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      radar: [
        { id: "radarSeriesLabels", title: "数据标签", help: "控制雷达图数据标签是否显示、格式和文字样式。", fields: ["showLabel", "labelFormatter", "labelFontSize", "labelColor"] },
        { id: "radarAxisNames", title: "维度名", help: "控制雷达图外圈维度名的文字样式。", fields: ["axisNameFontSize", "axisNameColor", "axisNameBold"] },
      ],
      funnel: [{ id: "funnelLabels", title: "阶段标签", help: "控制漏斗标签显示、位置、formatter 和文字样式。", fields: ["showLabel", "labelPosition", "labelFormatter", "labelFontSize", "labelColor"] }],
      dualAxis: [
        { id: "leftBarLabels", title: "左侧柱标签", help: "控制左侧系列作为柱时的标签显示、位置和文字样式。", fields: ["leftBarShowLabel", "leftBarLabelPosition", "leftBarLabelFontSize", "leftBarLabelColor"] },
        { id: "leftLineLabels", title: "左侧线标签", help: "控制左侧系列作为线时的标签显示和文字样式。", fields: ["leftLineShowLabel", "leftLineLabelFontSize", "leftLineLabelColor"] },
        { id: "rightBarLabels", title: "右侧柱标签", help: "控制右侧系列作为柱时的标签显示、位置和文字样式。", fields: ["rightBarShowLabel", "rightBarLabelPosition", "rightBarLabelFontSize", "rightBarLabelColor"] },
        { id: "rightLineLabels", title: "右侧线标签", help: "控制右侧系列作为线时的标签显示和文字样式。", fields: ["rightLineShowLabel", "rightLineLabelFontSize", "rightLineLabelColor"] },
      ],
    },
    en: {
      title: "Labels",
      description: "This section keeps chart-specific label controls together. Different chart types expose different label capabilities here.",
      line: [{ id: "lineLabels", title: "Data Labels", help: "Control whether line labels show and how the text is styled.", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      bar: [{ id: "barLabels", title: "Data Labels", help: "Control bar label visibility, position, and text styling.", fields: ["showLabel", "labelPosition", "labelFontSize", "labelColor"] }],
      pie: [{ id: "pieLabels", title: "Slice Labels", help: "Control pie labels, formatter, and outside label guide lines.", fields: ["showLabel", "labelPosition", "labelFormatter", "labelFontSize", "labelColor", "labelLineShow", "labelLineColor", "labelLineWidth"] }],
      area: [{ id: "areaLabels", title: "Data Labels", help: "Control whether area-chart labels show and how the text is styled.", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      scatter: [{ id: "scatterLabels", title: "Point Labels", help: "Control scatter label visibility and text styling.", fields: ["showLabel", "labelFontSize", "labelColor"] }],
      radar: [
        { id: "radarSeriesLabels", title: "Data Labels", help: "Control radar data-label visibility, formatter, and text styling.", fields: ["showLabel", "labelFormatter", "labelFontSize", "labelColor"] },
        { id: "radarAxisNames", title: "Indicator Names", help: "Control the text styling of radar indicator names around the outside.", fields: ["axisNameFontSize", "axisNameColor", "axisNameBold"] },
      ],
      funnel: [{ id: "funnelLabels", title: "Stage Labels", help: "Control funnel label visibility, position, formatter, and text styling.", fields: ["showLabel", "labelPosition", "labelFormatter", "labelFontSize", "labelColor"] }],
      dualAxis: [
        { id: "leftBarLabels", title: "Left Bar Labels", help: "Control labels when the left series is rendered as bars.", fields: ["leftBarShowLabel", "leftBarLabelPosition", "leftBarLabelFontSize", "leftBarLabelColor"] },
        { id: "leftLineLabels", title: "Left Line Labels", help: "Control labels when the left series is rendered as a line.", fields: ["leftLineShowLabel", "leftLineLabelFontSize", "leftLineLabelColor"] },
        { id: "rightBarLabels", title: "Right Bar Labels", help: "Control labels when the right series is rendered as bars.", fields: ["rightBarShowLabel", "rightBarLabelPosition", "rightBarLabelFontSize", "rightBarLabelColor"] },
        { id: "rightLineLabels", title: "Right Line Labels", help: "Control labels when the right series is rendered as a line.", fields: ["rightLineShowLabel", "rightLineLabelFontSize", "rightLineLabelColor"] },
      ],
    },
  };
  const localeText = text[CURRENT_LOCALE] || text.en;
  return {
    title: localeText.title,
    groups: localeText[chartType] || [],
  };
}

function isLabelFieldForChart(chartType, fieldId) {
  const config = getLabelSectionConfig(chartType);
  return config.groups.some((group) => group.fields.includes(fieldId));
}

function renderLabelSection(snapshot) {
  const section = $("labels-group");
  const content = $("labels-group-content");
  const title = $("labels-group-title");
  if (!section || !content || !title) {
    return;
  }

  const config = getLabelSectionConfig(appState.chartType);
  title.textContent = config.title;
  content.innerHTML = "";

  if (!config.groups.length) {
    section.classList.add("hidden");
    return;
  }

  const definition = getCurrentDefinition();
  const fieldsById = new Map(definition.fields.map((field) => [field.id, field]));
  const needsSubgroups = appState.chartType === "dualAxis" || appState.chartType === "radar";
  if (!needsSubgroups && config.groups.length === 1) {
    const flatGrid = document.createElement("div");
    flatGrid.className = "field-grid";
    config.groups[0].fields.forEach((fieldId) => {
      const field = fieldsById.get(fieldId);
      if (field) {
        flatGrid.appendChild(buildSpecificFieldControl(field, snapshot[field.id]));
      }
    });
    if (flatGrid.childElementCount) {
      content.appendChild(flatGrid);
    }
    section.classList.toggle("hidden", !content.childElementCount);
    return;
  }
  config.groups.forEach((groupConfig) => {
    const subgroup = document.createElement("div");
    subgroup.className = "foundation-subgroup";
    subgroup.innerHTML = `
      <div class="foundation-subgroup-head">${groupConfig.title}</div>
    `;
    const grid = document.createElement("div");
    grid.className = "field-grid";
    groupConfig.fields.forEach((fieldId) => {
      const field = fieldsById.get(fieldId);
      if (field) {
        grid.appendChild(buildSpecificFieldControl(field, snapshot[field.id]));
      }
    });
    if (grid.childElementCount) {
      subgroup.appendChild(grid);
      content.appendChild(subgroup);
    }
  });

  section.classList.toggle("hidden", !content.childElementCount);
}

function captureSpecificFieldState(definition) {
  const snapshot = {};
  definition.fields.forEach((field) => {
    const input = document.querySelector(`[data-specific-field="${field.id}"]`);
    if (!input) {
      snapshot[field.id] = field.default;
      return;
    }
    if (field.type === "checkbox") {
      snapshot[field.id] = readBooleanControl(input, Boolean(field.default));
    } else if (field.type === "number") {
      snapshot[field.id] = input.value === "" ? field.default : numberOr(input.value, field.default);
    } else {
      snapshot[field.id] = input.value;
    }
  });
  return snapshot;
}

function buildSpecificDefaultState(definition) {
  const snapshot = {};
  definition.fields.forEach((field) => {
    snapshot[field.id] = field.default;
  });
  return snapshot;
}

function isDualAxisSpecificGroupVisible(groupId, state) {
  if (groupId === "layoutGroup" || groupId === "splitLineAxisGroup") {
    return true;
  }
  if (groupId === "leftBarGroup") {
    return true;
  }
  if (groupId === "leftLineGroup") {
    return true;
  }
  if (groupId === "rightBarGroup") {
    return true;
  }
  if (groupId === "rightLineGroup") {
    return true;
  }
  return true;
}

function isDualAxisSpecificFieldVisible(fieldId, state) {
  const { leftType, rightType } = resolveDualAxisSeriesTypesFromState();
  const bothBar = leftType === "bar" && rightType === "bar";
  const anyBar = leftType === "bar" || rightType === "bar";

  if (fieldId === "horizontal") {
    return true;
  }
  if (fieldId.startsWith("leftBar")) {
    return true;
  }
  if (fieldId.startsWith("leftLine")) {
    return true;
  }
  if (fieldId.startsWith("rightBar")) {
    return true;
  }
  if (fieldId.startsWith("rightLine")) {
    return true;
  }
  return true;
}

function buildSpecificFieldControl(field, value = field.default) {
  if (field.id === "bandStops" && appState.chartType === "gauge") {
    const label = document.createElement("label");
    label.className = "field field-wide";
    label.dataset.specificWrapper = field.id;
    const colors = parseGaugeBandColorsText(value);
    label.innerHTML = `
      <span class="field-label-row">
        <span>${field.label}</span>
      </span>
      <input data-specific-field="${field.id}" class="palette-hidden-input" type="text" value="${gaugeBandColorsToText(colors)}" />
      <div class="palette-customizer gauge-band-editor">
        <div class="palette-customizer-head">
          <strong>${CURRENT_LOCALE === "zh" ? "自定义颜色" : "Custom Colors"}</strong>
          <div class="template-actions">
            <button data-gauge-band-add class="secondary-button small" type="button">
              ${CURRENT_LOCALE === "zh" ? "添加颜色" : "Add Color"}
            </button>
            <button data-gauge-band-remove-last class="secondary-button small" type="button">
              ${CURRENT_LOCALE === "zh" ? "移除颜色" : "Remove Color"}
            </button>
          </div>
        </div>
        <div data-gauge-band-colors class="palette-custom-colors"></div>
      </div>
    `;
    queueMicrotask(() => {
      renderGaugeBandColorInputs(colors);
      syncGaugeBandStopsInput();
    });
    return label;
  }

  if (DUAL_AXIS_COLOR_LIST_FIELD_IDS.has(field.id) && appState.chartType === "dualAxis") {
    const label = document.createElement("label");
    label.className = "field field-wide";
    label.dataset.specificWrapper = field.id;
    const colors = parseColorListText(value, getDualAxisColorListFallback(field.id));
    label.innerHTML = `
      <span class="field-label-row">
        <span>${field.label}</span>
      </span>
      <input data-specific-field="${field.id}" class="palette-hidden-input" type="text" value="${paletteToText(colors)}" />
      <div class="palette-customizer gauge-band-editor">
        <div class="palette-customizer-head">
          <strong>${CURRENT_LOCALE === "zh" ? "自定义颜色" : "Custom Colors"}</strong>
          <div class="template-actions">
            <button data-color-list-add="${field.id}" class="secondary-button small" type="button">
              ${CURRENT_LOCALE === "zh" ? "添加颜色" : "Add Color"}
            </button>
            <button data-color-list-remove-last="${field.id}" class="secondary-button small" type="button">
              ${CURRENT_LOCALE === "zh" ? "移除颜色" : "Remove Color"}
            </button>
          </div>
        </div>
        <div data-color-list-colors="${field.id}" class="palette-custom-colors"></div>
      </div>
    `;
    queueMicrotask(() => {
      renderSpecificColorListInputs(field.id, colors);
      syncSpecificColorListInput(field.id);
    });
    return label;
  }

  const label = document.createElement("label");
  label.className = "field";
  label.dataset.specificWrapper = field.id;

  const input = renderFieldInput(field, value);
  label.innerHTML = `
    <span class="field-label-row">
      <span>${field.label}</span>
    </span>
    ${input}
  `;
  return label;
}

function renderDualAxisFoundationAxes(snapshot) {
  const container = $("dual-axis-extra-axes");
  if (!container) {
    return;
  }
  if (appState.chartType !== "dualAxis") {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  const definition = getCurrentDefinition();
  const fieldsById = new Map(definition.fields.map((field) => [field.id, field]));
  const groups = [
    {
      id: "splitLineAxisGroup",
      fields: ["splitLineFollowAxis"],
    },
    {
      id: "leftAxisGroup",
      fields: [
        "leftAxisLabelFontSize",
        "leftAxisLabelColor",
        "leftAxisLineShow",
        "leftAxisLineColor",
        "leftAxisTickShow",
        "leftAxisFormatter",
      ],
    },
    {
      id: "rightAxisGroup",
      fields: [
        "rightAxisLabelFontSize",
        "rightAxisLabelColor",
        "rightAxisLineShow",
        "rightAxisLineColor",
        "rightAxisTickShow",
        "rightAxisFormatter",
      ],
    },
  ];

  container.innerHTML = "";
  groups.forEach((groupConfig) => {
    const groupField = fieldsById.get(groupConfig.id);
    if (!groupField) {
      return;
    }
    const group = document.createElement("div");
    group.className = "foundation-subgroup";
    const resolvedTitle =
      groupConfig.id === "leftAxisGroup"
        ? (CURRENT_LOCALE === "zh" ? "左轴" : "Left Axis")
        : groupConfig.id === "rightAxisGroup"
          ? (CURRENT_LOCALE === "zh" ? "右轴" : "Right Axis")
          : groupField.label;
    group.innerHTML = `
      <div class="foundation-subgroup-head">${resolvedTitle}</div>
    `;
    const grid = document.createElement("div");
    grid.className = "field-grid";
    groupConfig.fields.forEach((fieldId) => {
      const field = fieldsById.get(fieldId);
      if (field) {
        grid.appendChild(buildSpecificFieldControl(field, snapshot[field.id]));
      }
    });
    group.appendChild(grid);
    container.appendChild(group);
  });
  container.classList.remove("hidden");
}

function renderSpecificFields(options = {}) {
  const definition = getCurrentDefinition();
  const snapshot = options.values
    ? { ...options.values }
    : options.source === "defaults"
      ? buildSpecificDefaultState(definition)
      : captureSpecificFieldState(definition);
  const container = $("specific-fields");
  container.innerHTML = "";
  $("specific-caption").textContent = `${definition.label} ${getText("specificFieldsSuffix")}`;
  let activeGroupGrid = null;
  let ungroupedGrid = null;

  function ensureUngroupedGrid() {
    if (ungroupedGrid) {
      return ungroupedGrid;
    }
    ungroupedGrid = document.createElement("div");
    ungroupedGrid.className = "field-grid specific-ungrouped-grid";
    container.appendChild(ungroupedGrid);
    return ungroupedGrid;
  }

  definition.fields.forEach((field) => {
    if (appState.chartType === "dualAxis") {
      if (DUAL_AXIS_FOUNDATION_AXIS_GROUP_IDS.has(field.id) || DUAL_AXIS_FOUNDATION_AXIS_FIELD_IDS.has(field.id)) {
        return;
      }
    }
    if (isLabelFieldForChart(appState.chartType, field.id)) {
      return;
    }
    if (field.type === "group") {
      if (appState.chartType === "dualAxis" && !isDualAxisSpecificGroupVisible(field.id, snapshot)) {
        return;
      }
      if (appState.chartType === "funnel" && field.id === "funnelLabelGroup") {
        return;
      }
      let groupLabel = field.label;
      if (appState.chartType === "dualAxis") {
        if (field.id === "leftBarGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "左侧柱配置" : "Left Bar Style";
        } else if (field.id === "leftLineGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "左侧线配置" : "Left Line Style";
        } else if (field.id === "rightBarGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "右侧柱配置" : "Right Bar Style";
        } else if (field.id === "rightLineGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "右侧线配置" : "Right Line Style";
        }
      } else if (appState.chartType === "funnel") {
        if (field.id === "funnelBaseGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "基础" : "Foundation";
        } else if (field.id === "funnelLabelGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "标签" : "Labels";
        }
      } else if (appState.chartType === "gauge") {
        if (field.id === "gaugeFoundationGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "基础" : "Foundation";
        } else if (field.id === "gaugeTitleGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "标题" : "Title";
        } else if (field.id === "gaugeDetailGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "明细" : "Detail";
        } else if (field.id === "gaugeTicksGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "刻度线" : "Ticks";
        } else if (field.id === "gaugePointerGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "指针与圆心" : "Pointer And Anchor";
        }
      } else if (appState.chartType === "radar") {
        if (field.id === "radarFoundationGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "基础" : "Foundation";
        } else if (field.id === "radarGridGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "网格与轴线" : "Grid And Axis Lines";
        } else if (field.id === "radarSeriesGroup") {
          groupLabel = CURRENT_LOCALE === "zh" ? "数据面样式" : "Series Style";
        }
      }
      const group = document.createElement("div");
      group.className = "specific-subgroup";
      group.dataset.specificGroup = field.id;
      group.innerHTML = `
        <div class="specific-group-title">${groupLabel}</div>
      `;
      activeGroupGrid = document.createElement("div");
      activeGroupGrid.className = "field-grid specific-subgroup-grid";
      group.appendChild(activeGroupGrid);
      container.appendChild(group);
      return;
    }
    if (appState.chartType === "dualAxis" && !isDualAxisSpecificFieldVisible(field.id, snapshot)) {
      return;
    }
    const targetGrid = activeGroupGrid || ensureUngroupedGrid();
    targetGrid.appendChild(buildSpecificFieldControl(field, snapshot[field.id]));
  });

  renderDualAxisFoundationAxes(snapshot);
  renderLabelSection(snapshot);
}

function clearDesktopInteractiveContainers() {
  [
    "title-group",
    "legend-group",
    "labels-group-content",
    "layout-group",
    "axes-group",
    "split-lines-group",
    "specific-fields",
    "dual-axis-preview-controls",
  ].forEach((id) => {
    const node = $(id);
    if (node) {
      node.innerHTML = "";
    }
  });
}

function clearMobileInteractiveContainers() {
  [
    "mobile-preview-controls",
    "mobile-chart-tabs",
    "mobile-config-tabs",
    "mobile-config-fields",
  ].forEach((id) => {
    const node = $(id);
    if (node) {
      node.innerHTML = "";
    }
  });
}

function preserveCurrentFormState() {
  const hasCommonFields = Boolean($("title-show"));
  const hasSpecificFields = Boolean(document.querySelector("[data-specific-field]"));
  if (hasCommonFields) {
    appState.commonValuesCache = getCommonState();
  }
  if (hasSpecificFields) {
    appState.specificValuesCache = getSpecificState();
  }
}

function applyCachedValuesToRenderedForm() {
  if (appState.commonValuesCache) {
    applyCommonFieldValues(appState.commonValuesCache);
  } else {
    resetCommonFields();
  }
  if (appState.specificValuesCache) {
    applySpecificFieldValues(appState.specificValuesCache);
  }
}

function renderLayoutShell(options = {}) {
  const preferredSectionId = options.preferredSectionId || "";
  if (appState.layoutMode === "mobile") {
    clearDesktopInteractiveContainers();
    renderMobileChartTabs();
    renderMobilePreviewControls();
    renderMobileConfigPanel(preferredSectionId);
    applyCachedValuesToRenderedForm();
    renderFoundationVisibility();
    if (preferredSectionId) {
      resetMobileConfigViewport();
    }
    return;
  }

  clearMobileInteractiveContainers();
  renderCommonFoundationSections();
  buildChartCards();
  renderChartSummary();
  renderDualAxisPreviewControls();
  renderSpecificFields(appState.specificValuesCache
    ? { values: appState.specificValuesCache }
    : { source: "defaults" });
  applyCachedValuesToRenderedForm();
  renderFoundationVisibility();
}

function updateLayoutVisibility() {
  const desktopLayout = $("desktop-layout");
  const mobileLayout = $("mobile-layout");
  if (desktopLayout) {
    desktopLayout.classList.toggle("hidden", appState.layoutMode !== "desktop");
  }
  if (mobileLayout) {
    mobileLayout.classList.toggle("hidden", appState.layoutMode !== "mobile");
  }
}

function switchLayoutMode(nextMode) {
  if (nextMode === appState.layoutMode && appState.hasInitialized) {
    updateLayoutVisibility();
    return;
  }
  if (appState.hasInitialized) {
    preserveCurrentFormState();
    disposePreviewInstance($(getActivePreviewContainerId()));
  }
  appState.layoutMode = nextMode;
  updateLayoutVisibility();
  renderLayoutShell();
  syncPreviewCanvasDimensions();
  updateOutputs();
}

function normalizeSpecificFieldId(fieldId) {
  const aliasMap = {
    leftBarLabelPosition: "labelPosition",
    rightBarLabelPosition: "labelPosition",
    leftBarLabelFontSize: "labelFontSize",
    rightBarLabelFontSize: "labelFontSize",
    leftBarLabelColor: "labelColor",
    rightBarLabelColor: "labelColor",
    leftBarOpacity: "itemOpacity",
    rightBarOpacity: "itemOpacity",
    leftBarBorderRadius: "borderRadius",
    rightBarBorderRadius: "borderRadius",
    leftBarBorderWidth: "borderWidth",
    rightBarBorderWidth: "borderWidth",
    leftBarBorderColor: "borderColor",
    rightBarBorderColor: "borderColor",
    leftBarColors: "barColor",
    rightBarColors: "barColor",
    leftLineSmooth: "smooth",
    rightLineSmooth: "smooth",
    leftLineArea: "area",
    rightLineArea: "area",
    leftLineShowSymbol: "showSymbol",
    rightLineShowSymbol: "showSymbol",
    leftLineConnectNulls: "connectNulls",
    rightLineConnectNulls: "connectNulls",
    leftLineShowLabel: "showLineLabel",
    rightLineShowLabel: "showLineLabel",
    leftLineColors: "lineColor",
    rightLineColors: "lineColor",
    leftLineStyleType: "lineStyleType",
    rightLineStyleType: "lineStyleType",
    leftLineWidth: "lineWidth",
    rightLineWidth: "lineWidth",
    leftLineSymbol: "symbol",
    rightLineSymbol: "symbol",
    leftLineSymbolSize: "symbolSize",
    rightLineSymbolSize: "symbolSize",
    leftLineLabelFontSize: "labelFontSize",
    rightLineLabelFontSize: "labelFontSize",
    leftLineLabelColor: "labelColor",
    rightLineLabelColor: "labelColor",
  };
  return aliasMap[fieldId] || fieldId;
}

function getSpecificFieldUnitBadge(field) {
  return "";
}

function getSpecificFieldHelper(field, chartType) {
  return "";
}

const FONT_SIZE_PRESETS = FONT_SIZE_SELECT_OPTIONS;

function isFontSizeField(field) {
  return typeof field?.id === "string" && field.id.endsWith("FontSize");
}

function normalizeFontSizePresetValue(value, fallback = 12) {
  const resolved = numberOr(value, fallback);
  let nearest = FONT_SIZE_PRESETS[0];
  let nearestDistance = Math.abs(resolved - nearest);
  FONT_SIZE_PRESETS.forEach((preset) => {
    const distance = Math.abs(resolved - preset);
    if (distance < nearestDistance || (distance === nearestDistance && preset > nearest)) {
      nearest = preset;
      nearestDistance = distance;
    }
  });
  return String(nearest);
}

function buildFontSizeOptions(selectedValue) {
  return FONT_SIZE_PRESETS.map(
    (preset) => `<option value="${preset}" ${String(preset) === String(selectedValue) ? "selected" : ""}>${preset}</option>`,
  ).join("");
}

function renderFieldInput(field, value = field.default) {
  if (field.type === "checkbox") {
    const selectedValue = booleanSelectValue(Boolean(value));
    const yesText = CURRENT_LOCALE === "zh" ? "是" : "Yes";
    const noText = CURRENT_LOCALE === "zh" ? "否" : "No";
    return `
      <select data-specific-field="${field.id}" data-boolean-select="true">
        <option value="true" ${selectedValue === "true" ? "selected" : ""}>${yesText}</option>
        <option value="false" ${selectedValue === "false" ? "selected" : ""}>${noText}</option>
      </select>
    `;
  }
  if (field.type === "select") {
    const selectedValue = String(value ?? field.default);
    return `
      <select data-specific-field="${field.id}">
        ${field.options
          .map(
            ([optionValue, label]) =>
              `<option value="${optionValue}" ${String(optionValue) === selectedValue ? "selected" : ""}>${label}</option>`,
          )
          .join("")}
      </select>
    `;
  }
  if (field.type === "number" && isFontSizeField(field)) {
    const selectedValue = normalizeFontSizePresetValue(value, field.default);
    return `
      <select data-specific-field="${field.id}">
        ${buildFontSizeOptions(selectedValue)}
      </select>
    `;
  }
  if (field.type === "number") {
    const step = field.step !== undefined ? `step="${field.step}"` : "";
    return `<input data-specific-field="${field.id}" type="number" value="${value}" ${step} />`;
  }
  if (field.type === "color") {
    return `<input data-specific-field="${field.id}" type="color" value="${value}" />`;
  }
  return `<input data-specific-field="${field.id}" type="text" value="${value}" />`;
}

function getCurrentTemplate() {
  const definition = getCurrentDefinition();
  return definition.templates.find((template) => template.id === appState.templateId) || definition.templates[0];
}

function getTemplateDualAxisSeriesTypes() {
  if (appState.chartType !== "dualAxis") {
    return { leftType: "bar", rightType: "line" };
  }
  const rawData = getDefaultRawDataForChart("dualAxis");
  const seriesList = Array.isArray(rawData?.series) ? rawData.series : [];
  const xAxes = Array.isArray(rawData?.xAxis) ? rawData.xAxis : [rawData?.xAxis || {}];
  const yAxes = Array.isArray(rawData?.yAxis) ? rawData.yAxis : [rawData?.yAxis || {}];
  const horizontal = (xAxes[0]?.type === "value" || xAxes[1]?.type === "value") && yAxes[0]?.type === "category";
  let leftType = null;
  let rightType = null;

  seriesList.forEach((series, index) => {
    const axisIndex = horizontal ? series?.xAxisIndex : series?.yAxisIndex;
    const side = axisIndex === 1 ? "right" : (axisIndex === 0 ? "left" : (index === 1 ? "right" : "left"));
    const type = series?.type === "line" ? "line" : "bar";
    if (side === "left" && !leftType) {
      leftType = type;
    }
    if (side === "right" && !rightType) {
      rightType = type;
    }
  });

  return {
    leftType: leftType || "bar",
    rightType: rightType || "line",
  };
}

function resolveDualAxisSeriesTypes() {
  const templateTypes = getTemplateDualAxisSeriesTypes();
  return {
    leftType: appState.dualAxisPreviewLeftType || templateTypes.leftType,
    rightType: appState.dualAxisPreviewRightType || templateTypes.rightType,
  };
}

function resolveDualAxisSeriesTypesFromState() {
  return resolveDualAxisSeriesTypes();
}

function syncDualAxisPreviewTypesWithTemplate() {
  if (appState.chartType !== "dualAxis") {
    appState.dualAxisPreviewLeftType = null;
    appState.dualAxisPreviewRightType = null;
    return;
  }
  const { leftType, rightType } = getTemplateDualAxisSeriesTypes();
  appState.dualAxisPreviewLeftType = leftType;
  appState.dualAxisPreviewRightType = rightType;
}

function renderFoundationVisibility() {
  const runtimeDefinition = getCurrentRuntimeDefinition() || {};
  const axesGroup = $("axes-group");
  const splitLinesGroup = $("split-lines-group");
  const xSplitLineShowField = $("x-split-line-show-field");
  const xSplitLineColorField = $("x-split-line-color-field");
  const xSplitLineTypeField = $("x-split-line-type-field");
  const xSplitLineWidthField = $("x-split-line-width-field");
  const legendGroup = $("legend-group");
  const canvasGroup = $("layout-group");
  const paletteField = $("palette-field");
  const plotAreaGroup = $("layout-spacing-group");
  const xAxisSubgroup = $("x-axis-subgroup");
  const yAxisSubgroup = $("y-axis-subgroup");
  const axesGroupTitle = $("axes-group-title");
  const xAxisSubgroupHead = $("x-axis-subgroup-head");
  const yAxisSubgroupHead = $("y-axis-subgroup-head");
  const showCartesian = Boolean(runtimeDefinition.usesCartesian);
  const showLegend = runtimeDefinition.supportsLegend !== false;
  const showLayoutSpacing = runtimeDefinition.usesGrid !== false || runtimeDefinition.supportsPlotArea === true;
  const isDualAxis = appState.chartType === "dualAxis";
  const dualAxisHorizontal = readBooleanControl(document.querySelector('[data-specific-field="horizontal"]'));
  if (axesGroup) {
    axesGroup.classList.toggle("hidden", !showCartesian);
  }
  if (splitLinesGroup) {
    splitLinesGroup.classList.toggle("hidden", !showCartesian);
  }
  if (xSplitLineShowField) xSplitLineShowField.classList.remove("hidden");
  if (xSplitLineColorField) xSplitLineColorField.classList.remove("hidden");
  if (xSplitLineTypeField) xSplitLineTypeField.classList.remove("hidden");
  if (xSplitLineWidthField) xSplitLineWidthField.classList.remove("hidden");
  if (legendGroup) {
    legendGroup.classList.toggle("hidden", !showLegend);
  }
  if (canvasGroup) {
    canvasGroup.classList.remove("hidden");
  }
  if (paletteField) {
    paletteField.classList.toggle("hidden", appState.chartType === "gauge" || appState.chartType === "dualAxis");
  }
  if (plotAreaGroup) {
    plotAreaGroup.classList.toggle("hidden", !showLayoutSpacing);
  }

  const axisFieldLabels = CURRENT_LOCALE === "zh"
    ? {
        x: {
          lineShow: "显示 X 轴线",
          tickShow: "显示 X 轴刻度",
          rotate: "X 轴标签旋转",
          labelSize: "X 轴标签字号",
          labelColor: "X 轴标签颜色",
          lineColor: "X 轴线颜色",
          formatter: "X 轴格式",
        },
        y: {
          lineShow: "显示 Y 轴线",
          tickShow: "显示 Y 轴刻度",
          labelSize: "Y 轴标签字号",
          labelColor: "Y 轴标签颜色",
          lineColor: "Y 轴线颜色",
          formatter: "Y 轴格式",
        },
        category: {
          lineShow: "显示类目轴线",
          tickShow: "显示类目轴刻度",
          rotate: "类目标签旋转",
          labelSize: "类目标签字号",
          labelColor: "类目标签颜色",
          lineColor: "类目轴线颜色",
          formatter: "类目格式",
        },
      }
    : {
        x: {
          lineShow: "Show X Axis Line",
          tickShow: "Show X Ticks",
          rotate: "X Label Rotate",
          labelSize: "X Label Size",
          labelColor: "X Label Color",
          lineColor: "X Axis Line Color",
          formatter: "X Formatter",
        },
        y: {
          lineShow: "Show Y Axis Line",
          tickShow: "Show Y Ticks",
          labelSize: "Y Label Size",
          labelColor: "Y Label Color",
          lineColor: "Y Axis Line Color",
          formatter: "Y Formatter",
        },
        category: {
          lineShow: "Show Category Axis Line",
          tickShow: "Show Category Ticks",
          rotate: "Category Label Rotate",
          labelSize: "Category Label Size",
          labelColor: "Category Label Color",
          lineColor: "Category Axis Line Color",
          formatter: "Category Formatter",
        },
      };

  function applyAxisFieldLabels(axisKey, labels) {
    setTextIfExists(`${axisKey}-axis-line-show-label`, labels.lineShow);
    setTextIfExists(`${axisKey}-axis-tick-show-label`, labels.tickShow);
    setTextIfExists(`${axisKey}-axis-label-font-size-label`, labels.labelSize);
    setTextIfExists(`${axisKey}-axis-label-color-label`, labels.labelColor);
    setTextIfExists(`${axisKey}-axis-line-color-label`, labels.lineColor);
    setTextIfExists(`${axisKey}-formatter-label`, labels.formatter);
    if (axisKey === "x") {
      setTextIfExists("x-rotate-label", labels.rotate);
    }
  }

  if (isDualAxis) {
    applyAxisFieldLabels("x", axisFieldLabels.category);
    applyAxisFieldLabels("y", axisFieldLabels.category);
    if (axesGroupTitle) {
      axesGroupTitle.textContent = CURRENT_LOCALE === "zh" ? "坐标轴" : "Axes";
    }
    if (dualAxisHorizontal) {
      if (xAxisSubgroup) xAxisSubgroup.classList.add("hidden");
      if (yAxisSubgroup) yAxisSubgroup.classList.remove("hidden");
      if (yAxisSubgroupHead) {
        yAxisSubgroupHead.textContent = CURRENT_LOCALE === "zh" ? "类目轴" : "Category Axis";
      }
    } else {
      if (xAxisSubgroup) xAxisSubgroup.classList.remove("hidden");
      if (yAxisSubgroup) yAxisSubgroup.classList.add("hidden");
      if (xAxisSubgroupHead) {
        xAxisSubgroupHead.textContent = CURRENT_LOCALE === "zh" ? "类目轴" : "Category Axis";
      }
    }
    return;
  }

  applyAxisFieldLabels("x", axisFieldLabels.x);
  applyAxisFieldLabels("y", axisFieldLabels.y);

  if (axesGroupTitle) {
    axesGroupTitle.textContent = CURRENT_LOCALE === "zh" ? "坐标轴" : "Axes";
  }
  if (xAxisSubgroup) xAxisSubgroup.classList.remove("hidden");
  if (yAxisSubgroup) yAxisSubgroup.classList.remove("hidden");
  if (xAxisSubgroupHead) xAxisSubgroupHead.textContent = CURRENT_LOCALE === "zh" ? "X 轴" : "X Axis";
  if (yAxisSubgroupHead) yAxisSubgroupHead.textContent = CURRENT_LOCALE === "zh" ? "Y 轴" : "Y Axis";
}

function resetCommonFields() {
  const defaults = getCommonDefaults();
  setValueIfExists("title-show", defaults.titleShow);
  setValueIfExists("subtitle-show", defaults.subtitleShow);
  setValueIfExists("title-align", defaults.titleAlign);
  setValueIfExists("title-font-size", normalizeFontSizePresetValue(defaults.titleFontSize, TYPOGRAPHY_PRESET.titleFontSize));
  setValueIfExists("title-color", defaults.titleColor);
  setValueIfExists("title-bold", defaults.titleBold);
  setValueIfExists("subtitle-font-size", normalizeFontSizePresetValue(defaults.subtitleFontSize, TYPOGRAPHY_PRESET.subtitleFontSize));
  setValueIfExists("subtitle-color", defaults.subtitleColor);
  setValueIfExists("legend-font-size", normalizeFontSizePresetValue(defaults.legendFontSize, TYPOGRAPHY_PRESET.legendFontSize));
  setValueIfExists("legend-color", defaults.legendColor);
  setValueIfExists("palette-input", Array.isArray(defaults.palette) ? defaults.palette.join(", ") : defaults.palette);
  setValueIfExists("legend-show", defaults.legendShow);
  setValueIfExists("legend-position", defaults.legendPosition);
  setValueIfExists("legend-orient", defaults.legendOrient);
  setValueIfExists("x-split-line-show", defaults.xSplitLineShow);
  setValueIfExists("x-split-line-color", defaults.xSplitLineColor);
  setValueIfExists("x-split-line-type", defaults.xSplitLineType);
  setValueIfExists("x-split-line-width", defaults.xSplitLineWidth);
  setValueIfExists("x-axis-label-font-size", normalizeFontSizePresetValue(defaults.xAxisLabelFontSize, TYPOGRAPHY_PRESET.xAxisLabelFontSize));
  setValueIfExists("x-axis-label-color", defaults.xAxisLabelColor);
  setValueIfExists("x-axis-line-show", defaults.xAxisLineShow);
  setValueIfExists("x-axis-tick-show", defaults.xAxisTickShow);
  setValueIfExists("x-axis-line-color", defaults.xAxisLineColor);
  setValueIfExists("x-formatter", defaults.xFormatter);
  setValueIfExists("x-rotate", defaults.xRotate);
  setValueIfExists("y-axis-label-font-size", normalizeFontSizePresetValue(defaults.yAxisLabelFontSize, TYPOGRAPHY_PRESET.yAxisLabelFontSize));
  setValueIfExists("y-axis-label-color", defaults.yAxisLabelColor);
  setValueIfExists("y-axis-line-show", defaults.yAxisLineShow);
  setValueIfExists("y-axis-tick-show", defaults.yAxisTickShow);
  setValueIfExists("y-axis-line-color", defaults.yAxisLineColor);
  setValueIfExists("y-formatter", defaults.yFormatter);
  setValueIfExists("split-line-show", defaults.splitLineShow);
  setValueIfExists("split-line-color", defaults.splitLineColor);
  setValueIfExists("split-line-type", defaults.splitLineType);
  setValueIfExists("split-line-width", defaults.splitLineWidth);
  setValueIfExists("grid-left", normalizeGridPercentValue(defaults.gridLeft, "12%"));
  setValueIfExists("grid-right", normalizeGridPercentValue(defaults.gridRight, "9%"));
  setValueIfExists("grid-top", normalizeGridPercentValue(defaults.gridTop, "21%"));
  setValueIfExists("grid-bottom", normalizeGridPercentValue(defaults.gridBottom, "15%"));
  setPalette(parsePalette(defaults.palette));
  setBackgroundColorValue(defaults.backgroundColor);
}

function getCommonState() {
  const defaults = appState.commonValuesCache || getCommonDefaults();
  const fallbackPalette = Array.isArray(defaults.palette) ? defaults.palette : parsePalette(String(defaults.palette || ""));
  return {
    titleText: defaults.titleText,
    subtitleText: defaults.subtitleText,
    titleShow: readBooleanControl($("title-show"), defaults.titleShow),
    subtitleShow: readBooleanControl($("subtitle-show"), defaults.subtitleShow),
    titleAlign: $("title-align") ? $("title-align").value : defaults.titleAlign,
    titleFontSize: numberOr($("title-font-size")?.value, defaults.titleFontSize),
    titleColor: $("title-color") ? $("title-color").value : defaults.titleColor,
    titleBold: readBooleanControl($("title-bold"), defaults.titleBold),
    subtitleFontSize: numberOr($("subtitle-font-size")?.value, defaults.subtitleFontSize),
    subtitleColor: $("subtitle-color") ? $("subtitle-color").value : defaults.subtitleColor,
    backgroundColor: $("background-color") ? $("background-color").value : defaults.backgroundColor,
    legendFontSize: numberOr($("legend-font-size")?.value, defaults.legendFontSize),
    legendColor: $("legend-color") ? $("legend-color").value : defaults.legendColor,
    palette: $("palette-input") ? parsePalette($("palette-input").value) : fallbackPalette,
    legendShow: readBooleanControl($("legend-show"), defaults.legendShow),
    legendPosition: $("legend-position") ? $("legend-position").value : defaults.legendPosition,
    legendOrient: $("legend-orient") ? $("legend-orient").value : defaults.legendOrient,
    xSplitLineShow: readBooleanControl($("x-split-line-show"), defaults.xSplitLineShow),
    xSplitLineColor: $("x-split-line-color") ? $("x-split-line-color").value : defaults.xSplitLineColor,
    xSplitLineType: normalizeStrokeType($("x-split-line-type") ? $("x-split-line-type").value : defaults.xSplitLineType),
    xSplitLineWidth: numberOr($("x-split-line-width")?.value, defaults.xSplitLineWidth),
    xAxisLabelFontSize: numberOr($("x-axis-label-font-size")?.value, defaults.xAxisLabelFontSize),
    xAxisLabelColor: $("x-axis-label-color") ? $("x-axis-label-color").value : defaults.xAxisLabelColor,
    xAxisLineShow: readBooleanControl($("x-axis-line-show"), defaults.xAxisLineShow),
    xAxisTickShow: readBooleanControl($("x-axis-tick-show"), defaults.xAxisTickShow),
    xAxisLineColor: $("x-axis-line-color") ? $("x-axis-line-color").value : defaults.xAxisLineColor,
    xFormatter: ($("x-formatter") ? $("x-formatter").value.trim() : defaults.xFormatter) || "{value}",
    xRotate: numberOr($("x-rotate")?.value, defaults.xRotate ?? 0),
    yAxisLabelFontSize: numberOr($("y-axis-label-font-size")?.value, defaults.yAxisLabelFontSize),
    yAxisLabelColor: $("y-axis-label-color") ? $("y-axis-label-color").value : defaults.yAxisLabelColor,
    yAxisLineShow: readBooleanControl($("y-axis-line-show"), defaults.yAxisLineShow),
    yAxisTickShow: readBooleanControl($("y-axis-tick-show"), defaults.yAxisTickShow),
    yAxisLineColor: $("y-axis-line-color") ? $("y-axis-line-color").value : defaults.yAxisLineColor,
    yFormatter: ($("y-formatter") ? $("y-formatter").value.trim() : defaults.yFormatter) || "{value}",
    splitLineShow: readBooleanControl($("split-line-show"), defaults.splitLineShow),
    splitLineColor: $("split-line-color") ? $("split-line-color").value : defaults.splitLineColor,
    splitLineType: normalizeStrokeType($("split-line-type") ? $("split-line-type").value : defaults.splitLineType),
    splitLineWidth: numberOr($("split-line-width")?.value, defaults.splitLineWidth),
    gridLeft: normalizeGridPercentValue($("grid-left") ? $("grid-left").value : defaults.gridLeft, "12%"),
    gridRight: normalizeGridPercentValue($("grid-right") ? $("grid-right").value : defaults.gridRight, "9%"),
    gridTop: normalizeGridPercentValue($("grid-top") ? $("grid-top").value : defaults.gridTop, "21%"),
    gridBottom: normalizeGridPercentValue($("grid-bottom") ? $("grid-bottom").value : defaults.gridBottom, "15%"),
  };
}

function getSpecificState() {
  const state = {};
  const cachedValues = appState.specificValuesCache || {};
  getCurrentDefinition().fields.forEach((field) => {
    if (field.type === "group") {
      return;
    }
    const input = document.querySelector(`[data-specific-field="${field.id}"]`);
    if (!input) {
      state[field.id] = cachedValues[field.id] !== undefined ? cachedValues[field.id] : field.default;
      return;
    }
    if (field.type === "checkbox") {
      state[field.id] = readBooleanControl(input, cachedValues[field.id] !== undefined ? Boolean(cachedValues[field.id]) : Boolean(field.default));
    } else if (field.type === "number") {
      state[field.id] = numberOr(input.value, cachedValues[field.id] !== undefined ? cachedValues[field.id] : field.default);
    } else {
      state[field.id] = input.value;
    }
  });
  return state;
}

function getPreviewViewportSize() {
  return FIXED_PREVIEW_VIEWPORT;
}

function syncPreviewCanvasDimensions() {
  const canvas = $(getActivePreviewContainerId());
  if (!canvas) {
    return;
  }
  const stage = canvas.parentElement;
  if (appState.layoutMode === "mobile") {
    const containerWidth = stage?.clientWidth || window.innerWidth || FIXED_PREVIEW_VIEWPORT.width;
    const availableWidth = Math.max(0, containerWidth);
    const scale = Math.min(1, availableWidth / FIXED_PREVIEW_VIEWPORT.width);
    canvas.style.width = `${FIXED_PREVIEW_VIEWPORT.width}px`;
    canvas.style.minWidth = `${FIXED_PREVIEW_VIEWPORT.width}px`;
    canvas.style.height = `${FIXED_PREVIEW_VIEWPORT.height}px`;
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = "top center";
    if (stage) {
      stage.style.height = `${Math.round(FIXED_PREVIEW_VIEWPORT.height * scale)}px`;
    }
    return;
  }
  canvas.style.width = `${FIXED_PREVIEW_VIEWPORT.width}px`;
  canvas.style.minWidth = `${FIXED_PREVIEW_VIEWPORT.width}px`;
  canvas.style.height = `${FIXED_PREVIEW_VIEWPORT.height}px`;
  canvas.style.transform = "";
  canvas.style.transformOrigin = "";
  if (stage) {
    stage.style.height = "";
  }
}

function setStatusReady() {
  const badge = $("status-badge");
  if (!badge) {
    return;
  }
  badge.textContent = getText("ready");
  badge.classList.remove("error");
}

function setStatusError() {
  const badge = $("status-badge");
  if (!badge) {
    return;
  }
  badge.textContent = getText("fixJson");
  badge.classList.add("error");
}

function showError(message) {
  const box = $("error-box");
  if (!box) {
    return;
  }
  box.textContent = message;
  box.classList.remove("hidden");
}

function hideError() {
  const box = $("error-box");
  if (!box) {
    return;
  }
  box.classList.add("hidden");
  box.textContent = "";
}

function disposePreviewInstance(element) {
  if (window.echarts && element) {
    const instance = window.echarts.getInstanceByDom(element);
    if (instance) {
      instance.dispose();
    }
  }
}

function renderPreviewInto(containerId, option) {
  const container = $(containerId);
  if (!container) {
    return;
  }
  if (!window.echarts) {
    container.innerHTML = "";
    return;
  }
  if (!container.offsetWidth || !container.offsetHeight) {
    return;
  }

  let chart = window.echarts.getInstanceByDom(container);
  const activeRenderer = chart?.getZr?.()?.painter?.getType?.();
  if (chart && activeRenderer !== PREVIEW_RENDERER) {
    chart.dispose();
    chart = null;
  }
  chart = chart || window.echarts.init(container, null, {
    renderer: PREVIEW_RENDERER,
  });
  chart.setOption(option, true);
  chart.resize();
}

function renderPreview(option) {
  syncPreviewCanvasDimensions();
  appState.latestResolvedOption = option || null;
  if (!option) {
    disposePreviewInstance($(getActivePreviewContainerId()));
    return;
  }
  if (!window.echarts) {
    return;
  }

  disposePreviewInstance($(getInactivePreviewContainerId()));
  renderPreviewInto(getActivePreviewContainerId(), option);
}

function updateOutputs() {
  renderFoundationVisibility();
  renderPreviewControls();
  try {
    const sharedOptionBuilder = globalThis.DataChartsOptionBuilder;
    if (!sharedOptionBuilder || typeof sharedOptionBuilder.buildChartArtifacts !== "function") {
      throw new Error("Shared option builder failed to load.");
    }

    const commonState = getCommonState();
    const specificState = getSpecificState();
    appState.commonValuesCache = commonState;
    appState.specificValuesCache = specificState;
    const rawData = getDefaultRawDataForChart(appState.chartType);
    const { stylePayload, resolvedOption: resolved } = sharedOptionBuilder.buildChartArtifacts({
      chartType: appState.chartType,
      commonState,
      specificState,
      rawData,
      previewState: {
        previewStackMode: appState.previewStackMode,
        previewBarHorizontal: appState.previewBarHorizontal,
        previewPieMode: appState.previewPieMode,
        previewSeriesCount: appState.previewSeriesCount,
        previewDualAxisLeftSeriesCount: appState.previewDualAxisLeftSeriesCount,
        previewDualAxisRightSeriesCount: appState.previewDualAxisRightSeriesCount,
        dualAxisPreviewLeftType: appState.dualAxisPreviewLeftType,
        dualAxisPreviewRightType: appState.dualAxisPreviewRightType,
      },
      previewViewportSize: getPreviewViewportSize(),
    });

    setTextIfExists("style-output", JSON.stringify(stylePayload, null, 2));
    renderPreview(resolved);

    hideError();
    setStatusReady();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setTextIfExists("style-output", getText("fixStyle"));
    renderPreview(null);
    showError(message);
    setStatusError();
  }
}

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 1800);
}

function wireCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = $(button.dataset.copyTarget);
      try {
        await copyText(target.textContent);
        showToast(getText("copied"));
      } catch (error) {
        showToast(getText("copyFailed"));
      }
    });
  });
}

function wirePreviewControls() {
  window.addEventListener("resize", () => {
    syncPreviewCanvasDimensions();
    const previewChart = window.echarts?.getInstanceByDom($(getActivePreviewContainerId()));
    if (previewChart) {
      previewChart.resize();
    }
  });
  MOBILE_LAYOUT_MEDIA.addEventListener("change", (event) => {
    switchLayoutMode(event.matches ? "mobile" : "desktop");
  });
}

function switchChart(chartType) {
  appState.chartType = chartType;
  appState.templateId = CHART_DEFINITIONS[chartType].templates[0].id;
  appState.previewStackMode = false;
  appState.previewBarHorizontal = false;
  appState.previewPieMode = chartType === "pie" ? "donut" : appState.previewPieMode;
  appState.previewSeriesCount = supportsSeriesCountPreview(chartType) ? 2 : 1;
  appState.previewDualAxisLeftSeriesCount = 2;
  appState.previewDualAxisRightSeriesCount = 2;
  appState.commonValuesCache = { ...getCommonDefaults() };
  appState.specificValuesCache = buildSpecificDefaultState(getCurrentDefinition());
  appState.activeMobileSectionId = "";
  syncDualAxisPreviewTypesWithTemplate();
  renderLayoutShell({ preferredSectionId: "common:title" });
  applyChartBeautyDefaults(chartType);
}

function wireEvents() {
  document.addEventListener("input", (event) => {
    const chartTab = event.target.closest?.("[data-chart-type]");
    if (chartTab) {
      return;
    }
    if (event.target.matches("[data-gauge-band-color]")) {
      syncGaugeBandStopsInput();
    }
    if (event.target.matches("[data-color-list-color]")) {
      syncSpecificColorListInput(event.target.dataset.colorListColor);
    }
    if (event.target.matches(".palette-color-input") && !event.target.matches("[data-gauge-band-color]") && !event.target.matches("[data-color-list-color]")) {
      syncPaletteInput();
    }
    if (event.target.matches("#background-custom-input")) {
      setBackgroundColorValue(event.target.value);
    }
    if (event.target.matches("input, textarea, select")) {
      updateOutputs();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-gauge-band-color]")) {
      syncGaugeBandStopsInput();
    }
    if (event.target.matches("[data-color-list-color]")) {
      syncSpecificColorListInput(event.target.dataset.colorListColor);
    }
    if (event.target.matches(".palette-color-input") && !event.target.matches("[data-gauge-band-color]") && !event.target.matches("[data-color-list-color]")) {
      syncPaletteInput();
    }
    if (event.target.matches("#background-custom-input")) {
      setBackgroundColorValue(event.target.value);
    }
    if (event.target.matches("[data-specific-field]")) {
      updateOutputs();
    }
  });

  document.addEventListener("click", (event) => {
    const chartTypeButton = event.target.closest("[data-chart-type]");
    if (chartTypeButton) {
      const nextChartType = chartTypeButton.dataset.chartType;
      if (nextChartType && nextChartType !== appState.chartType) {
        switchChart(nextChartType);
      }
      return;
    }

    const mobileConfigTab = event.target.closest("[data-mobile-section-id]");
    if (mobileConfigTab) {
      const nextSectionId = mobileConfigTab.dataset.mobileSectionId || "";
      if (nextSectionId && nextSectionId !== appState.activeMobileSectionId) {
        preserveCurrentFormState();
        appState.activeMobileSectionId = nextSectionId;
        renderMobileConfigPanel();
        renderFoundationVisibility();
      }
      return;
    }

    const addCustomPalette = event.target.closest("#add-custom-palette");
    if (addCustomPalette) {
      const colors = Array.from($("palette-custom-colors")?.querySelectorAll(".palette-color-input") || []).map((input) => input.value);
      const nextColor = getNextDistinctPaletteColor(colors);
      setPalette(colors.concat(nextColor));
      updateOutputs();
      return;
    }

    const removeCustomPalette = event.target.closest("#remove-custom-palette");
    if (removeCustomPalette) {
      const colors = Array.from($("palette-custom-colors")?.querySelectorAll(".palette-color-input") || []).map((input) => input.value);
      if (colors.length <= 1) {
        return;
      }
      setPalette(colors.slice(0, -1));
      updateOutputs();
      return;
    }

    const addGaugeBand = event.target.closest("[data-gauge-band-add]");
    if (addGaugeBand) {
      const colors = getCurrentGaugeBandColors();
      const nextColor = colors[colors.length - 1] || "#91cc75";
      renderGaugeBandColorInputs(colors.concat(nextColor));
      syncGaugeBandStopsInput();
      updateOutputs();
      return;
    }

    const removeGaugeBand = event.target.closest("[data-gauge-band-remove-last]");
    if (removeGaugeBand) {
      const colors = getCurrentGaugeBandColors();
      if (colors.length <= 1) {
        return;
      }
      renderGaugeBandColorInputs(colors.slice(0, -1));
      syncGaugeBandStopsInput();
      updateOutputs();
      return;
    }

    const addColorList = event.target.closest("[data-color-list-add]");
    if (addColorList) {
      const fieldId = addColorList.dataset.colorListAdd;
      const colors = getCurrentSpecificColorList(fieldId);
      const nextColor = getNextDistinctPaletteColor(colors);
      renderSpecificColorListInputs(fieldId, colors.concat(nextColor));
      syncSpecificColorListInput(fieldId);
      updateOutputs();
      return;
    }

    const removeColorList = event.target.closest("[data-color-list-remove-last]");
    if (removeColorList) {
      const fieldId = removeColorList.dataset.colorListRemoveLast;
      const colors = getCurrentSpecificColorList(fieldId);
      if (colors.length <= 1) {
        return;
      }
      renderSpecificColorListInputs(fieldId, colors.slice(0, -1));
      syncSpecificColorListInput(fieldId);
      updateOutputs();
      return;
    }

    const previewStackButton = event.target.closest("[data-preview-stack-mode]");
    if (previewStackButton && (appState.chartType === "bar" || appState.chartType === "area")) {
      appState.previewStackMode = previewStackButton.dataset.previewStackMode === "stacked";
      renderPreviewControls();
      updateOutputs();
      return;
    }

    const previewSeriesCountButton = event.target.closest("[data-preview-series-count]");
    if (previewSeriesCountButton && supportsSeriesCountPreview(appState.chartType)) {
      appState.previewSeriesCount = Number(previewSeriesCountButton.dataset.previewSeriesCount) || 2;
      renderPreviewControls();
      updateOutputs();
      return;
    }

    const previewDualAxisSeriesCountButton = event.target.closest("[data-preview-dual-axis-series-count][data-preview-dual-axis-series-side]");
    if (previewDualAxisSeriesCountButton && appState.chartType === "dualAxis") {
      const side = previewDualAxisSeriesCountButton.dataset.previewDualAxisSeriesSide;
      const count = Number(previewDualAxisSeriesCountButton.dataset.previewDualAxisSeriesCount) || 2;
      if (side === "left") {
        appState.previewDualAxisLeftSeriesCount = count;
      } else if (side === "right") {
        appState.previewDualAxisRightSeriesCount = count;
      }
      renderPreviewControls();
      updateOutputs();
      return;
    }

    const previewBarLayoutButton = event.target.closest("[data-preview-bar-layout]");
    if (previewBarLayoutButton && appState.chartType === "bar") {
      appState.previewBarHorizontal = previewBarLayoutButton.dataset.previewBarLayout === "horizontal";
      renderPreviewControls();
      updateOutputs();
      return;
    }

    const previewPieModeButton = event.target.closest("[data-preview-pie-mode]");
    if (previewPieModeButton && appState.chartType === "pie") {
      appState.previewPieMode = previewPieModeButton.dataset.previewPieMode || "donut";
      renderPreviewControls();
      updateOutputs();
      return;
    }

    const button = event.target.closest("[data-dual-axis-side][data-dual-axis-type]");
    if (!button || appState.chartType !== "dualAxis") {
      return;
    }
    const side = button.dataset.dualAxisSide;
    const type = button.dataset.dualAxisType;
    if (side === "left") {
      appState.dualAxisPreviewLeftType = type;
    } else if (side === "right") {
      appState.dualAxisPreviewRightType = type;
    }
    renderPreviewControls();
    updateOutputs();
  });
}

function init() {
  appState.layoutMode = getLayoutMode();
  appState.commonValuesCache = { ...getCommonDefaults() };
  appState.specificValuesCache = buildSpecificDefaultState(getCurrentDefinition());
  updateLayoutVisibility();
  syncDualAxisPreviewTypesWithTemplate();
  renderLayoutShell({ preferredSectionId: "common:title" });
  wireEvents();
  wireCopyButtons();
  wirePreviewControls();
  appState.hasInitialized = true;
  applyChartBeautyDefaults(appState.chartType);
}

document.addEventListener("DOMContentLoaded", init);
