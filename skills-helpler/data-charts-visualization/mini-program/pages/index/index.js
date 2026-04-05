const echarts = require("../../ec-canvas/echarts");
const {
  COMMON_GROUPS,
  CHART_ORDER,
  CHART_DEFINITIONS
} = require("../../lib/schema");
const { CHART_RUNTIME_DEFINITIONS } = require("../../lib/chart-runtime-definitions");
const { buildChartArtifactsFromHelperConfig } = require("../../lib/option-builder");
const DEFAULT_DATA_MODULE = require("../../lib/charts-default-data");
const DEFAULT_CONFIG_MODULE = require("../../lib/charts-default-config");
const PREVIEW_VIEWPORT_SIZE = { width: 650, height: 360 };
const PREVIEW_HORIZONTAL_PADDING_RPX = 96;

const DEFAULT_COLOR_SWATCHES = [
  "#1f2937",
  "#4b5563",
  "#9ca3af",
  "#e5e7eb",
  "#ffffff",
  "#2563eb",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6"
];

const DEFAULT_PALETTE_COLORS = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"];

const COMMON_GROUP_HELP = {
  title: "这里对应图表顶部的标题区域，包括主标题和副标题。",
  legend: "控制图例的显示、位置、方向和文字样式。",
  canvas: "控制画布背景、调色板和绘图区留白。",
  axes: "控制坐标轴线、刻度、标签、范围和格式化。",
  splitLines: "控制横向和纵向分割线的显示和样式。"
};

const COMMON_FIELD_LABELS = {
  titleText: "主标题",
  titleShow: "显示主标题",
  titleAlign: "标题对齐",
  titleFontSize: "标题字号",
  titleColor: "标题颜色",
  titleBold: "标题加粗",
  subtitleText: "副标题",
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
  gridLeft: "绘图区左边距",
  gridRight: "绘图区右边距",
  gridTop: "绘图区上边距",
  gridBottom: "绘图区下边距",
  xAxisLineShow: "显示 X 轴线",
  xAxisTickShow: "显示 X 轴刻度",
  xRotate: "X 标签旋转",
  xAxisLabelFontSize: "X 标签字号",
  xAxisLabelColor: "X 标签颜色",
  xAxisLineColor: "X 轴线颜色",
  xFormatter: "X 轴格式",
  yAxisLineShow: "显示 Y 轴线",
  yAxisTickShow: "显示 Y 轴刻度",
  yAxisLabelFontSize: "Y 标签字号",
  yAxisLabelColor: "Y 标签颜色",
  yAxisLineColor: "Y 轴线颜色",
  yFormatter: "Y 轴格式",
  splitLineShow: "显示横向分割线",
  splitLineColor: "横向分割线颜色",
  splitLineType: "横向分割线样式",
  splitLineWidth: "横向分割线宽度",
  xSplitLineShow: "显示纵向分割线",
  xSplitLineColor: "纵向分割线颜色",
  xSplitLineType: "纵向分割线样式",
  xSplitLineWidth: "纵向分割线宽度"
};

const COMMON_OPTION_LABELS = {
  titleAlign: { left: "左对齐", center: "居中", right: "右对齐" },
  legendPosition: {
    "top-left": "左上",
    "top-center": "上中",
    "top-right": "右上",
    "middle-left": "左中",
    "middle-right": "右中",
    "bottom-left": "左下",
    "bottom-center": "下中",
    "bottom-right": "右下"
  },
  legendOrient: { horizontal: "水平", vertical: "垂直" },
  splitLineType: { solid: "实线", dashed: "虚线", dotted: "点线" },
  xSplitLineType: { solid: "实线", dashed: "虚线", dotted: "点线" }
};

const SPECIFIC_FIELD_LABELS = {
  line: {
    smooth: "平滑曲线",
    showSymbol: "显示拐点",
    connectNulls: "连接空值",
    showLabel: "显示标签",
    symbol: "拐点形状",
    symbolSize: "拐点大小",
    lineStyleType: "线条样式",
    lineWidth: "线条宽度",
    labelFontSize: "标签字号",
    labelColor: "标签颜色"
  },
  bar: {
    showLabel: "显示标签",
    barGap: "柱间距",
    labelPosition: "标签位置",
    labelFontSize: "标签字号",
    labelColor: "标签颜色",
    itemOpacity: "柱透明度",
    borderRadius: "圆角半径",
    borderWidth: "描边宽度",
    borderColor: "描边颜色"
  },
  area: {
    smooth: "平滑曲线",
    showSymbol: "显示拐点",
    connectNulls: "连接空值",
    showLabel: "显示标签",
    areaOpacity: "面积透明度",
    areaFillMode: "填充样式",
    symbol: "拐点形状",
    symbolSize: "拐点大小",
    lineStyleType: "线条样式",
    lineWidth: "线条宽度",
    labelFontSize: "标签字号",
    labelColor: "标签颜色"
  },
  dualAxis: {
    layoutGroup: "结构",
    horizontal: "横向布局",
    splitLineAxisGroup: "分割线归属",
    splitLineFollowAxis: "分割线跟随",
    leftAxisGroup: "左轴",
    leftAxisLabelFontSize: "左轴字号",
    leftAxisLabelColor: "左轴颜色",
    leftAxisLineShow: "显示左轴线",
    leftAxisLineColor: "左轴线颜色",
    leftAxisTickShow: "显示左轴刻度",
    leftAxisFormatter: "左轴格式",
    leftBarGroup: "左柱",
    leftBarShowLabel: "显示左柱标签",
    leftBarLabelPosition: "左柱标签位置",
    leftBarLabelFontSize: "左柱标签字号",
    leftBarLabelColor: "左柱标签颜色",
    leftBarOpacity: "左柱透明度",
    leftBarGap: "左柱间距",
    leftBarBorderRadius: "左柱圆角半径",
    leftBarBorderWidth: "左柱描边宽度",
    leftBarBorderColor: "左柱描边颜色",
    leftBarColors: "左柱配色",
    leftLineGroup: "左线",
    leftLineSmooth: "左线平滑",
    leftLineArea: "左线带面积",
    leftLineShowSymbol: "显示左线拐点",
    leftLineConnectNulls: "连接左线空值",
    leftLineShowLabel: "显示左线标签",
    leftLineColors: "左线配色",
    leftLineStyleType: "左线样式",
    leftLineWidth: "左线宽度",
    leftLineSymbol: "左线拐点形状",
    leftLineSymbolSize: "左线拐点大小",
    leftLineLabelFontSize: "左线标签字号",
    leftLineLabelColor: "左线标签颜色",
    rightAxisGroup: "右轴",
    rightAxisLabelFontSize: "右轴字号",
    rightAxisLabelColor: "右轴颜色",
    rightAxisLineShow: "显示右轴线",
    rightAxisLineColor: "右轴线颜色",
    rightAxisTickShow: "显示右轴刻度",
    rightAxisFormatter: "右轴格式",
    rightBarGroup: "右柱",
    rightBarShowLabel: "显示右柱标签",
    rightBarLabelPosition: "右柱标签位置",
    rightBarLabelFontSize: "右柱标签字号",
    rightBarLabelColor: "右柱标签颜色",
    rightBarOpacity: "右柱透明度",
    rightBarGap: "右柱间距",
    rightBarBorderRadius: "右柱圆角半径",
    rightBarBorderWidth: "右柱描边宽度",
    rightBarBorderColor: "右柱描边颜色",
    rightBarColors: "右柱配色",
    rightLineGroup: "右线",
    rightLineSmooth: "右线平滑",
    rightLineArea: "右线带面积",
    rightLineShowSymbol: "显示右线拐点",
    rightLineConnectNulls: "连接右线空值",
    rightLineShowLabel: "显示右线标签",
    rightLineColors: "右线配色",
    rightLineStyleType: "右线样式",
    rightLineWidth: "右线宽度",
    rightLineSymbol: "右线拐点形状",
    rightLineSymbolSize: "右线拐点大小",
    rightLineLabelFontSize: "右线标签字号",
    rightLineLabelColor: "右线标签颜色"
  },
  scatter: {
    showLabel: "显示标签",
    symbolSize: "默认点大小",
    symbol: "点形状",
    itemOpacity: "点透明度",
    borderWidth: "描边宽度",
    borderColor: "描边颜色",
    labelFontSize: "标签字号",
    labelColor: "标签颜色"
  },
  pie: {
    labelPosition: "标签位置",
    startAngle: "起始角度",
    showLabel: "显示标签",
    labelFontSize: "标签字号",
    labelColor: "标签颜色",
    labelFormatter: "标签格式",
    labelLineShow: "显示引导线",
    labelLineColor: "引导线颜色",
    labelLineWidth: "引导线宽度",
    itemOpacity: "扇区透明度",
    borderWidth: "描边宽度",
    borderColor: "描边颜色"
  },
  gauge: {
    gaugeFoundationGroup: "基础",
    startAngle: "起始角度",
    endAngle: "结束角度",
    progressShow: "显示进度",
    progressWidth: "进度宽度",
    progressColor: "进度颜色",
    axisWidth: "主环宽度",
    bandStops: "分段颜色",
    gaugeTitleGroup: "仪表名称",
    titleShow: "显示仪表名称",
    titleFontSize: "仪表名称字号",
    titleColor: "仪表名称颜色",
    gaugeDetailGroup: "明细",
    detailShow: "显示明细",
    detailFormatter: "明细格式",
    detailFontSize: "明细字号",
    detailColor: "明细颜色",
    gaugeTicksGroup: "刻度",
    axisLabelShow: "显示刻度值",
    axisLabelDistance: "刻度值距离",
    axisLabelFontSize: "刻度值字号",
    axisLabelColor: "刻度值颜色",
    splitLineShow: "显示主刻度线",
    splitLineLength: "主刻度线长度",
    splitLineWidth: "主刻度线宽度",
    splitLineColor: "主刻度线颜色",
    axisTickShow: "显示次刻度线",
    axisTickLength: "次刻度线长度",
    axisTickWidth: "次刻度线宽度",
    axisTickColor: "次刻度线颜色",
    gaugePointerGroup: "指针与圆心点",
    pointerShow: "显示指针",
    pointerWidth: "指针宽度",
    pointerColor: "指针颜色",
    anchorShow: "显示圆心点",
    anchorSize: "圆心点大小",
    anchorColor: "圆心点颜色"
  },
  radar: {
    radarFoundationGroup: "基础",
    shape: "形状",
    splitNumber: "分割段数",
    showSymbol: "显示拐点",
    showLabel: "显示标签",
    labelFormatter: "标签格式",
    areaOpacity: "面积透明度",
    radarGridGroup: "网格线",
    splitLineColor: "分割线颜色",
    splitLineWidth: "分割线宽度",
    splitLineType: "分割线样式",
    axisLineColor: "轴线颜色",
    axisLineWidth: "轴线宽度",
    axisLineType: "轴线样式",
    axisNameFontSize: "维度名字号",
    axisNameColor: "维度名颜色",
    axisNameBold: "维度名加粗",
    radarSeriesGroup: "系列样式",
    symbol: "拐点形状",
    symbolSize: "拐点大小",
    lineStyleType: "线条样式",
    lineWidth: "线条宽度",
    labelFontSize: "标签字号",
    labelColor: "标签颜色"
  },
  funnel: {
    funnelBaseGroup: "基础",
    sort: "排序方式",
    gap: "间隔",
    minSize: "最小尺寸",
    maxSize: "最大尺寸",
    itemOpacity: "漏斗透明度",
    funnelLabelGroup: "标签",
    labelPosition: "标签位置",
    showLabel: "显示标签",
    labelFormatter: "标签格式",
    labelFontSize: "标签字号",
    labelColor: "标签颜色"
  }
};

const SPECIFIC_OPTION_LABELS = {
  line: {
    symbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" },
    lineStyleType: { solid: "实线", dashed: "虚线", dotted: "点线" }
  },
  bar: {
    labelPosition: { top: "顶部", inside: "内部", insideTop: "内部顶部", insideRight: "内部右侧", outside: "外部" }
  },
  area: {
    areaFillMode: { solid: "纯色（自动配色）", gradient: "渐变（自动配色）" },
    symbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" },
    lineStyleType: { solid: "实线", dashed: "虚线", dotted: "点线" }
  },
  dualAxis: {
    splitLineFollowAxis: { left: "左轴", right: "右轴" },
    leftBarLabelPosition: { top: "顶部", inside: "内部", insideTop: "内部顶部", insideRight: "内部右侧", outside: "外部" },
    rightBarLabelPosition: { top: "顶部", inside: "内部", insideTop: "内部顶部", insideRight: "内部右侧", outside: "外部" },
    leftLineStyleType: { solid: "实线", dashed: "虚线", dotted: "点线" },
    rightLineStyleType: { solid: "实线", dashed: "虚线", dotted: "点线" },
    leftLineSymbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" },
    rightLineSymbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" }
  },
  scatter: {
    symbolSize: { 24: "很小", 40: "小", 64: "中", 88: "大", 116: "很大" },
    symbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" }
  },
  pie: {
    labelPosition: { outside: "外侧", inside: "内部" }
  },
  gauge: {
    pointerWidth: { 2: "纤细", 3: "标准", 4: "稳重", 5: "醒目", 6: "粗壮" },
    anchorSize: { 8: "微小", 12: "小", 20: "中", 24: "大", 32: "超大" }
  },
  radar: {
    shape: { polygon: "多边形", circle: "圆形" },
    symbol: { circle: "圆形", rect: "方形", triangle: "三角形", diamond: "菱形" },
    lineStyleType: { solid: "实线", dashed: "虚线", dotted: "点线" },
    splitLineType: { solid: "实线", dashed: "虚线", dotted: "点线" },
    axisLineType: { solid: "实线", dashed: "虚线", dotted: "点线" }
  },
  funnel: {
    sort: { descending: "降序", ascending: "升序", none: "保持输入顺序" },
    labelPosition: { outside: "外侧", inside: "内部" }
  }
};

const SPECIFIC_SECTION_HELP = {
  dualAxis: {
    layoutGroup: "先确定横纵布局和双轴结构。",
    splitLineAxisGroup: "选择共享分割线跟随左轴还是右轴。",
    leftAxisGroup: "控制左侧数值轴。",
    leftBarGroup: "控制左侧柱图样式。",
    leftLineGroup: "控制左侧线图样式。",
    rightAxisGroup: "控制右侧数值轴。",
    rightBarGroup: "控制右侧柱图样式。",
    rightLineGroup: "控制右侧线图样式。"
  },
  gauge: {
    gaugeFoundationGroup: "控制仪表盘角度和进度环。",
    gaugeTitleGroup: "控制仪表盘中部的小标题。",
    gaugeDetailGroup: "控制中心数值明细。",
    gaugeTicksGroup: "控制刻度值和刻度线。",
    gaugePointerGroup: "控制指针和圆心点样式。"
  },
  radar: {
    radarFoundationGroup: "控制雷达图形状和分割段数。",
    radarGridGroup: "控制分割线和轴线样式。",
    radarSeriesGroup: "控制系列线条、拐点和标签样式。"
  },
  funnel: {
    funnelBaseGroup: "控制排序、间隔和宽度范围。",
    funnelLabelGroup: "控制标签显示、位置、格式和文字样式。"
  }
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function disablePreviewAnimation(option) {
  const nextOption = deepClone(option || {});
  nextOption.animation = false;
  nextOption.animationDuration = 0;
  nextOption.animationDurationUpdate = 0;
  nextOption.animationEasing = "linear";
  nextOption.animationEasingUpdate = "linear";
  nextOption.stateAnimation = {
    duration: 0,
    easing: "linear"
  };
  nextOption.series = (nextOption.series || []).map((series) => ({
    ...series,
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    animationEasing: "linear",
    animationEasingUpdate: "linear",
    universalTransition: false
  }));
  return nextOption;
}

function parseSwatchColors(raw) {
  const parsed = String(raw || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => /^#([\da-f]{3}|[\da-f]{6})$/i.test(item));
  return Array.from(new Set([...parsed, ...DEFAULT_COLOR_SWATCHES]));
}

function parsePaletteColors(raw) {
  const parsed = String(raw || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => /^#([\da-f]{3}|[\da-f]{6})$/i.test(item));
  return parsed.length ? parsed : DEFAULT_PALETTE_COLORS.slice();
}

function paletteToText(colors) {
  return colors.join(", ");
}

function normalizeColorValue(color) {
  return String(color || "#ffffff").trim().toLowerCase();
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
    "#d48265"
  ];
  const next = candidates.find((color) => !normalized.has(normalizeColorValue(color)));
  return next || "#2f4554";
}

function buildCommonValues(chartType) {
  return DEFAULT_CONFIG_MODULE.getDefaultCommonState(chartType, "zh");
}

function buildSpecificValues(chartType) {
  return DEFAULT_CONFIG_MODULE.getDefaultSpecificState(chartType);
}

function shouldShowCommonGroup(groupId, runtimeDefinition) {
  if (groupId === "legend" && runtimeDefinition.supportsLegend === false) {
    return false;
  }
  if ((groupId === "axes" || groupId === "splitLines") && !runtimeDefinition.usesCartesian) {
    return false;
  }
  return true;
}

function resolveFieldLabel(scope, chartType, field) {
  if (scope === "common") {
    return COMMON_FIELD_LABELS[field.id] || field.label;
  }
  return (SPECIFIC_FIELD_LABELS[chartType] && SPECIFIC_FIELD_LABELS[chartType][field.id]) || field.label;
}

function resolveOptionLabel(scope, chartType, fieldId, rawValue, fallbackLabel) {
  const scopedMap = scope === "common"
    ? COMMON_OPTION_LABELS[fieldId]
    : SPECIFIC_OPTION_LABELS[chartType] && SPECIFIC_OPTION_LABELS[chartType][fieldId];
  if (!scopedMap) {
    return fallbackLabel;
  }
  return scopedMap[String(rawValue)] || scopedMap[rawValue] || fallbackLabel;
}

function toFieldView(scope, chartType, field, currentValue) {
  const optionValues = (field.options || []).map((item) => String(item[0]));
  const matchedIndex = optionValues.findIndex((item) => item === String(currentValue));
  const normalizedColor = typeof currentValue === "string" && /^#([\da-f]{3}|[\da-f]{6})$/i.test(currentValue.trim())
    ? currentValue.trim()
    : "#ffffff";
  const paletteColors = field.id === "palette" ? parsePaletteColors(currentValue) : [];
  return {
    ...field,
    label: resolveFieldLabel(scope, chartType, field),
    value: currentValue,
    checked: Boolean(currentValue),
    optionLabels: (field.options || []).map((item) => resolveOptionLabel(scope, chartType, field.id, item[0], item[1])),
    pickerIndex: matchedIndex >= 0 ? matchedIndex : 0,
    colorPreviewStyle: field.type === "color"
      ? `background:${normalizedColor};color:${pickReadableTextColor(normalizedColor)};`
      : "",
    paletteColors,
    isPaletteField: field.id === "palette"
  };
}

function pickReadableTextColor(hexColor) {
  const normalized = String(hexColor || "").trim().replace("#", "");
  if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(normalized)) {
    return "#1d2928";
  }
  const source = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const red = parseInt(source.slice(0, 2), 16);
  const green = parseInt(source.slice(2, 4), 16);
  const blue = parseInt(source.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 160 ? "#1d2928" : "#ffffff";
}

function buildCommonSections(chartType, values) {
  const runtimeDefinition = CHART_RUNTIME_DEFINITIONS[chartType] || {};
  return COMMON_GROUPS
    .filter((group) => shouldShowCommonGroup(group.id, runtimeDefinition))
    .map((group) => ({
      ...group,
      help: COMMON_GROUP_HELP[group.id] || "",
      fields: group.fields
        .filter((field) => !["titleText", "subtitleText"].includes(field.id))
        .map((field) => toFieldView("common", chartType, field, values[field.id]))
    }));
}

function buildSpecificSections(chartType, values) {
  const definition = CHART_DEFINITIONS[chartType];
  const sections = [];
  let current = {
    id: "default",
    title: `${definition.zhLabel || definition.label}样式`,
    help: getChartDisplayBlurb(definition),
    fields: []
  };

  definition.fields.forEach((field) => {
    if (field.type === "group") {
      if (current.fields.length) {
        sections.push(current);
      }
      current = {
        id: field.id,
        title: resolveFieldLabel("specific", chartType, field),
        help: (SPECIFIC_SECTION_HELP[chartType] && SPECIFIC_SECTION_HELP[chartType][field.id]) || field.help || "",
        fields: []
      };
      return;
    }
    current.fields.push(toFieldView("specific", chartType, field, values[field.id]));
  });

  if (current.fields.length) {
    sections.push(current);
  }

  return sections;
}

function buildTabs(chartType) {
  return CHART_ORDER.map((key) => ({
    id: key,
    label: CHART_DEFINITIONS[key].zhLabel,
    active: key === chartType
  }));
}

function getDefaultPreviewState(chartType) {
  const previewState = DEFAULT_CONFIG_MODULE.getDefaultPreviewState(chartType) || {};
  return {
    previewStackMode: false,
    previewBarHorizontal: false,
    previewPieMode: "donut",
    previewSeriesCount: 2,
    previewDualAxisLeftSeriesCount: 2,
    previewDualAxisRightSeriesCount: 2,
    dualAxisPreviewLeftType: null,
    dualAxisPreviewRightType: null,
    ...previewState
  };
}

function supportsSeriesCountPreview(chartType) {
  return chartType === "line"
    || chartType === "bar"
    || chartType === "area"
    || chartType === "dualAxis"
    || chartType === "scatter";
}

function getTemplateDualAxisSeriesTypes() {
  const rawData = DEFAULT_DATA_MODULE.getDefaultRawData("dualAxis");
  const seriesList = Array.isArray(rawData && rawData.series) ? rawData.series : [];
  const xAxes = Array.isArray(rawData && rawData.xAxis) ? rawData.xAxis : [rawData && rawData.xAxis ? rawData.xAxis : {}];
  const yAxes = Array.isArray(rawData && rawData.yAxis) ? rawData.yAxis : [rawData && rawData.yAxis ? rawData.yAxis : {}];
  const horizontal = (xAxes[0] && xAxes[0].type === "value" || xAxes[1] && xAxes[1].type === "value") && yAxes[0] && yAxes[0].type === "category";
  let leftType = null;
  let rightType = null;

  seriesList.forEach((series, index) => {
    const axisIndex = horizontal ? series && series.xAxisIndex : series && series.yAxisIndex;
    const side = axisIndex === 1 ? "right" : (axisIndex === 0 ? "left" : (index === 1 ? "right" : "left"));
    const type = series && series.type === "line" ? "line" : "bar";
    if (side === "left" && !leftType) {
      leftType = type;
    }
    if (side === "right" && !rightType) {
      rightType = type;
    }
  });

  return {
    leftType: leftType || "bar",
    rightType: rightType || "line"
  };
}

function normalizePreviewState(chartType, previewState) {
  const nextState = {
    ...getDefaultPreviewState(chartType),
    ...(previewState || {})
  };
  if (chartType === "dualAxis") {
    const templateTypes = getTemplateDualAxisSeriesTypes();
    nextState.dualAxisPreviewLeftType = nextState.dualAxisPreviewLeftType || templateTypes.leftType;
    nextState.dualAxisPreviewRightType = nextState.dualAxisPreviewRightType || templateTypes.rightType;
  } else {
    nextState.dualAxisPreviewLeftType = null;
    nextState.dualAxisPreviewRightType = null;
  }
  return nextState;
}

function buildHelperConfigPayload(chartType, commonValues, specificValues, options = {}) {
  if (!DEFAULT_CONFIG_MODULE || typeof DEFAULT_CONFIG_MODULE.buildHelperConfig !== "function") {
    throw new Error("Default config builder is unavailable.");
  }
  return DEFAULT_CONFIG_MODULE.buildHelperConfig(chartType, commonValues, specificValues, options);
}

function trimPreviewSeriesList(seriesList, count) {
  if (!Array.isArray(seriesList) || !Number.isFinite(count) || count <= 0) {
    return Array.isArray(seriesList) ? deepClone(seriesList) : [];
  }
  return deepClone(seriesList.slice(0, count));
}

function resolvePreviewDualAxisSide(series, index) {
  if (series && typeof series.yAxisIndex === "number") {
    return series.yAxisIndex === 1 ? "right" : "left";
  }
  return index % 2 === 0 ? "left" : "right";
}

function applyPreviewDataSelection(chartType, rawData, previewState) {
  const nextRawData = deepClone(rawData || {});

  if (supportsSeriesCountPreview(chartType) && chartType !== "dualAxis") {
    nextRawData.series = trimPreviewSeriesList(nextRawData.series, Number(previewState && previewState.previewSeriesCount) || 0);
    return nextRawData;
  }

  if (chartType === "dualAxis" && Array.isArray(nextRawData.series)) {
    const leftLimit = Number(previewState && previewState.previewDualAxisLeftSeriesCount) || 0;
    const rightLimit = Number(previewState && previewState.previewDualAxisRightSeriesCount) || 0;
    if (leftLimit > 0 || rightLimit > 0) {
      const counters = { left: 0, right: 0 };
      nextRawData.series = deepClone(nextRawData.series.filter((series, index) => {
        const side = resolvePreviewDualAxisSide(series, index);
        const limit = side === "left" ? leftLimit : rightLimit;
        if (limit > 0 && counters[side] >= limit) {
          return false;
        }
        counters[side] += 1;
        return true;
      }));
    }
  }

  return nextRawData;
}

function buildPreviewConfig(chartType, previewState) {
  if (chartType === "line" || chartType === "scatter") {
    return {
      visible: true,
      groups: [
        {
          id: "seriesCount",
          title: "预览数量",
          buttons: [1, 2, 5, 8].map((count) => ({
            label: String(count),
            action: "seriesCount",
            value: String(count),
            active: Number(previewState.previewSeriesCount) === count
          }))
        }
      ]
    };
  }

  if (chartType === "bar") {
    return {
      visible: true,
      groups: [
        {
          id: "seriesCount",
          title: "预览数量",
          buttons: [1, 2, 5, 8].map((count) => ({
            label: String(count),
            action: "seriesCount",
            value: String(count),
            active: Number(previewState.previewSeriesCount) === count
          }))
        },
        {
          id: "barLayout",
          title: "布局预览",
          buttons: [
            { label: "纵向", action: "barLayout", value: "vertical", active: !previewState.previewBarHorizontal },
            { label: "横向", action: "barLayout", value: "horizontal", active: Boolean(previewState.previewBarHorizontal) }
          ]
        },
        {
          id: "stackMode",
          title: "预览方式",
          buttons: [
            { label: "普通", action: "stackMode", value: "normal", active: !previewState.previewStackMode },
            { label: "堆叠", action: "stackMode", value: "stacked", active: Boolean(previewState.previewStackMode) }
          ]
        }
      ]
    };
  }

  if (chartType === "area") {
    return {
      visible: true,
      groups: [
        {
          id: "seriesCount",
          title: "预览数量",
          buttons: [1, 2, 5, 8].map((count) => ({
            label: String(count),
            action: "seriesCount",
            value: String(count),
            active: Number(previewState.previewSeriesCount) === count
          }))
        },
        {
          id: "stackMode",
          title: "预览方式",
          buttons: [
            { label: "普通", action: "stackMode", value: "normal", active: !previewState.previewStackMode },
            { label: "堆叠", action: "stackMode", value: "stacked", active: Boolean(previewState.previewStackMode) }
          ]
        }
      ]
    };
  }

  if (chartType === "pie") {
    return {
      visible: true,
      groups: [
        {
          id: "pieMode",
          title: "预览图形",
          buttons: [
            { label: "饼图", action: "pieMode", value: "pie", active: previewState.previewPieMode === "pie" },
            { label: "环图", action: "pieMode", value: "donut", active: previewState.previewPieMode === "donut" },
            { label: "玫瑰面积", action: "pieMode", value: "roseArea", active: previewState.previewPieMode === "roseArea" },
            { label: "玫瑰半径", action: "pieMode", value: "roseRadius", active: previewState.previewPieMode === "roseRadius" }
          ]
        }
      ]
    };
  }

  if (chartType === "dualAxis") {
    return {
      visible: true,
      groups: [
        {
          id: "dualAxisLeftCount",
          title: "左侧数量",
          buttons: [1, 2, 4].map((count) => ({
            label: String(count),
            action: "dualAxisSeriesCount",
            side: "left",
            value: String(count),
            active: Number(previewState.previewDualAxisLeftSeriesCount) === count
          }))
        },
        {
          id: "dualAxisRightCount",
          title: "右侧数量",
          buttons: [1, 2, 4].map((count) => ({
            label: String(count),
            action: "dualAxisSeriesCount",
            side: "right",
            value: String(count),
            active: Number(previewState.previewDualAxisRightSeriesCount) === count
          }))
        },
        {
          id: "dualAxisLeftType",
          title: "左侧预览类型",
          buttons: [
            { label: "柱", action: "dualAxisType", side: "left", value: "bar", active: previewState.dualAxisPreviewLeftType === "bar" },
            { label: "线", action: "dualAxisType", side: "left", value: "line", active: previewState.dualAxisPreviewLeftType === "line" }
          ]
        },
        {
          id: "dualAxisRightType",
          title: "右侧预览类型",
          buttons: [
            { label: "柱", action: "dualAxisType", side: "right", value: "bar", active: previewState.dualAxisPreviewRightType === "bar" },
            { label: "线", action: "dualAxisType", side: "right", value: "line", active: previewState.dualAxisPreviewRightType === "line" }
          ]
        }
      ]
    };
  }

  return { visible: false, groups: [] };
}

function getChartDisplayLabel(definition) {
  return definition.zhLabel || definition.label;
}

function getChartDisplayBlurb(definition) {
  return definition.zhBlurb || definition.blurb;
}

function normalizeActiveSectionId(sections, activeId) {
  if (!sections.length) {
    return "";
  }
  return sections.some((section) => section.id === activeId) ? activeId : sections[0].id;
}

function pickActiveSection(sections, activeId) {
  return sections.find((section) => section.id === activeId) || sections[0] || null;
}

function mergeConfigSections(commonSections, specificSections) {
  return [
    ...commonSections.map((section) => ({
      ...section,
      id: `common:${section.id}`,
      tabLabel: section.label,
      panelTitle: section.label,
      scope: "common"
    })),
    ...specificSections.map((section) => ({
      ...section,
      id: `specific:${section.id}`,
      tabLabel: section.title,
      panelTitle: section.title,
      scope: "specific"
    }))
  ];
}

function getFieldDefinition(scope, chartType, fieldId) {
  if (scope === "common") {
    for (let index = 0; index < COMMON_GROUPS.length; index += 1) {
      const found = COMMON_GROUPS[index].fields.find((field) => field.id === fieldId);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return CHART_DEFINITIONS[chartType].fields.find((field) => field.id === fieldId) || null;
}

Page({
  data: {
    ec: {
      lazyLoad: true
    },
    previewDisplayWidth: PREVIEW_VIEWPORT_SIZE.width,
    previewDisplayHeight: PREVIEW_VIEWPORT_SIZE.height,
    chartType: "line",
    chartLabel: getChartDisplayLabel(CHART_DEFINITIONS.line),
    previewState: getDefaultPreviewState("line"),
    previewConfig: buildPreviewConfig("line", getDefaultPreviewState("line")),
    chartTabs: [],
    commonValues: {},
    specificValues: {},
    commonSections: [],
    specificSections: [],
    allSections: [],
    configTabs: [],
    activeConfigSectionId: "",
    activeConfigSection: null,
    configScrollTop: 0,
    configTabsScrollIntoView: "",
    colorPickerVisible: false,
    colorPickerValue: "#2563eb",
    colorPickerScope: "",
    colorPickerFieldId: "",
    colorPickerFieldLabel: "",
    colorPickerItemIndex: -1,
    colorSwatches: DEFAULT_COLOR_SWATCHES,
    colorPickerPopupProps: {
      closeBtn: true
    }
  },

  onLoad() {
    this.syncPreviewScale();
    this.resetChart("line", false);
  },

  onReady() {
    this.ecComponent = this.selectComponent("#preview-chart");
    this.initChart();
  },

  onUnload() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },

  initChart() {
    if (!this.ecComponent) {
      return;
    }
    this.ecComponent.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: PREVIEW_VIEWPORT_SIZE.width,
        height: PREVIEW_VIEWPORT_SIZE.height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);
      this.chart = chart;
      this.previewViewportSize = PREVIEW_VIEWPORT_SIZE;
      this.renderChart();
      return chart;
    });
  },

  syncPreviewScale() {
    let windowWidth = PREVIEW_VIEWPORT_SIZE.width;
    if (typeof wx !== "undefined") {
      if (typeof wx.getWindowInfo === "function") {
        const windowInfo = wx.getWindowInfo();
        windowWidth = windowInfo.windowWidth || windowWidth;
      } else if (typeof wx.getSystemInfoSync === "function") {
        const systemInfo = wx.getSystemInfoSync();
        windowWidth = systemInfo.windowWidth || windowWidth;
      }
    }
    const horizontalPaddingPx = (windowWidth / 750) * PREVIEW_HORIZONTAL_PADDING_RPX;
    const availableWidth = Math.max(0, windowWidth - horizontalPaddingPx);
    const previewScale = Math.min(1, availableWidth / PREVIEW_VIEWPORT_SIZE.width);
    this.setData({
      previewDisplayWidth: Math.round(PREVIEW_VIEWPORT_SIZE.width * previewScale),
      previewDisplayHeight: Math.round(PREVIEW_VIEWPORT_SIZE.height * previewScale)
    });
  },

  resetChart(chartType, shouldRender = true) {
    this.commitState(
      chartType,
      buildCommonValues(chartType),
      buildSpecificValues(chartType),
      normalizePreviewState(chartType, getDefaultPreviewState(chartType)),
      shouldRender,
      "common:title"
    );
    this.resetConfigScrollPosition();
  },

  commitState(chartType, commonValues, specificValues, previewState, shouldRender = true, preferredSectionId = "") {
    const definition = CHART_DEFINITIONS[chartType];
    const resolvedPreviewState = normalizePreviewState(chartType, previewState);
    const commonSections = buildCommonSections(chartType, commonValues);
    const specificSections = buildSpecificSections(chartType, specificValues);
    const allSections = mergeConfigSections(commonSections, specificSections);
    const activeConfigSectionId = normalizeActiveSectionId(allSections, preferredSectionId || this.data.activeConfigSectionId);
    this.setData(
      {
        chartType,
        chartLabel: getChartDisplayLabel(definition),
        previewState: resolvedPreviewState,
        previewConfig: buildPreviewConfig(chartType, resolvedPreviewState),
        chartTabs: buildTabs(chartType),
        commonValues,
        specificValues,
        commonSections,
        specificSections,
        allSections,
        configTabs: allSections.map((section) => ({
          id: section.id,
          label: section.tabLabel,
          active: section.id === activeConfigSectionId
        })),
        activeConfigSectionId,
        activeConfigSection: pickActiveSection(allSections, activeConfigSectionId),
        colorSwatches: parseSwatchColors(commonValues.palette)
      },
      () => {
        if (shouldRender) {
          this.renderChart();
        }
      }
    );
  },

  renderChart() {
    if (!this.chart) {
      return;
    }
    const rawData = applyPreviewDataSelection(
      this.data.chartType,
      DEFAULT_DATA_MODULE.getDefaultRawData(this.data.chartType),
      this.data.previewState
    );
    const helperConfig = buildHelperConfigPayload(
      this.data.chartType,
      this.data.commonValues,
      this.data.specificValues,
      {
        dualAxisTypes: this.data.chartType === "dualAxis"
          ? {
              leftType: this.data.previewState.dualAxisPreviewLeftType,
              rightType: this.data.previewState.dualAxisPreviewRightType
            }
          : undefined
      }
    );
    const artifacts = buildChartArtifactsFromHelperConfig({
      chartType: this.data.chartType,
      helperConfig,
      rawData,
      previewState: this.data.previewState,
      previewViewportSize: this.previewViewportSize || PREVIEW_VIEWPORT_SIZE
    });
    this.latestStyleText = JSON.stringify(artifacts.stylePayload, null, 2);
    this.chart.setOption(disablePreviewAnimation(artifacts.resolvedOption), true);
    this.chart.resize();
  },

  handleCopyToAgent() {
    const text = this.latestStyleText || "";
    if (!text) {
      wx.showModal({
        title: "提示",
        content: "暂无可复制配置",
        showCancel: false,
        confirmText: "知道了"
      });
      return;
    }
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: "提示",
          content: "配置复制成功，请到Agent侧输入",
          showCancel: false,
          confirmText: "知道了"
        });
      },
      fail: () => {
        wx.showModal({
          title: "提示",
          content: "复制失败",
          showCancel: false,
          confirmText: "知道了"
        });
      }
    });
  },

  resetConfigScrollPosition() {
    this.setData({
      configScrollTop: 1,
      configTabsScrollIntoView: ""
    }, () => {
      this.setData({
        configScrollTop: 0,
        configTabsScrollIntoView: "config-tab-0"
      });
    });
  },

  handleChartSwitch(event) {
    const chartType = event.currentTarget.dataset.chartType;
    if (!chartType || chartType === this.data.chartType) {
      return;
    }
    this.resetChart(chartType, true);
  },

  handleConfigSectionSwitch(event) {
    const sectionId = event.currentTarget.dataset.sectionId;
    if (!sectionId || sectionId === this.data.activeConfigSectionId) {
      return;
    }
    this.setData({
      activeConfigSectionId: sectionId,
      configTabs: this.data.allSections.map((section) => ({
        id: section.id,
        label: section.tabLabel,
        active: section.id === sectionId
      })),
      activeConfigSection: pickActiveSection(this.data.allSections, sectionId)
    });
  },

  handleOpenColorPicker(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const value = event.currentTarget.dataset.value;
    const label = event.currentTarget.dataset.label;
    this.setData({
      colorPickerVisible: true,
      colorPickerScope: scope,
      colorPickerFieldId: fieldId,
      colorPickerFieldLabel: label || "颜色",
      colorPickerItemIndex: Number.isFinite(Number(event.currentTarget.dataset.itemIndex))
        ? Number(event.currentTarget.dataset.itemIndex)
        : -1,
      colorPickerValue: value || "#2563eb"
    });
  },

  handleColorPickerChange(event) {
    const nextValue = event.detail.value;
    const { colorPickerScope, colorPickerFieldId, colorPickerItemIndex } = this.data;
    const field = getFieldDefinition(colorPickerScope, this.data.chartType, colorPickerFieldId);
    if (!field) {
      return;
    }
    this.setData({
      colorPickerValue: nextValue
    });
    if (field.id === "palette" && colorPickerItemIndex >= 0) {
      this.updatePaletteColor(colorPickerScope, field, colorPickerItemIndex, nextValue);
      return;
    }
    this.updateField(colorPickerScope, field, nextValue);
  },

  handleColorPickerClose() {
    this.setData({
      colorPickerVisible: false
    });
  },

  handleAddPaletteColor(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const field = getFieldDefinition(scope, this.data.chartType, fieldId);
    if (!field || fieldId !== "palette") {
      return;
    }
    const current = parsePaletteColors(this.data.commonValues.palette);
    const nextColor = getNextDistinctPaletteColor(current);
    this.updateField(scope, field, paletteToText(current.concat(nextColor)));
  },

  handleRemovePaletteColor(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const field = getFieldDefinition(scope, this.data.chartType, fieldId);
    if (!field || fieldId !== "palette") {
      return;
    }
    const current = parsePaletteColors(this.data.commonValues.palette);
    if (current.length <= 1) {
      return;
    }
    this.updateField(scope, field, paletteToText(current.slice(0, -1)));
  },

  handleConfigScroll(event) {
    if (!this.colorPickerComponent) {
      this.colorPickerComponent = this.selectComponent("#global-color-picker");
    }
    if (this.colorPickerComponent && typeof this.colorPickerComponent.debouncedUpdateEleRect === "function") {
      this.colorPickerComponent.debouncedUpdateEleRect(event);
    }
  },

  handleInput(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const field = getFieldDefinition(scope, this.data.chartType, fieldId);
    if (!field) {
      return;
    }
    this.updateField(scope, field, event.detail.value);
  },

  handleSwitch(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const field = getFieldDefinition(scope, this.data.chartType, fieldId);
    if (!field) {
      return;
    }
    this.updateField(scope, field, Boolean(event.detail.value));
  },

  handlePicker(event) {
    const scope = event.currentTarget.dataset.scope;
    const fieldId = event.currentTarget.dataset.fieldId;
    const field = getFieldDefinition(scope, this.data.chartType, fieldId);
    if (!field || !field.options) {
      return;
    }
    const pickedIndex = Number(event.detail.value);
    const nextValue = field.options[pickedIndex] ? field.options[pickedIndex][0] : field.options[0][0];
    this.updateField(scope, field, nextValue);
  },

  updateField(scope, field, rawValue) {
    const commonValues = deepClone(this.data.commonValues);
    const specificValues = deepClone(this.data.specificValues);
    const target = scope === "common" ? commonValues : specificValues;

    if (field.type === "number") {
      target[field.id] = rawValue === "" ? "" : Number(rawValue);
    } else {
      target[field.id] = rawValue;
    }

    this.commitState(this.data.chartType, commonValues, specificValues, this.data.previewState, true);
  },

  updatePaletteColor(scope, field, itemIndex, rawValue) {
    const commonValues = deepClone(this.data.commonValues);
    const specificValues = deepClone(this.data.specificValues);
    const target = scope === "common" ? commonValues : specificValues;
    const paletteColors = parsePaletteColors(target[field.id]);
    if (itemIndex < 0 || itemIndex >= paletteColors.length) {
      return;
    }
    paletteColors[itemIndex] = rawValue;
    target[field.id] = paletteToText(paletteColors);
    this.commitState(this.data.chartType, commonValues, specificValues, this.data.previewState, true);
  },

  handlePreviewControlTap(event) {
    const action = event.currentTarget.dataset.action;
    const value = event.currentTarget.dataset.value;
    const side = event.currentTarget.dataset.side;
    if (!action) {
      return;
    }
    const previewState = {
      ...this.data.previewState
    };

    if (action === "seriesCount") {
      previewState.previewSeriesCount = Number(value) || 2;
    } else if (action === "barLayout") {
      previewState.previewBarHorizontal = value === "horizontal";
    } else if (action === "stackMode") {
      previewState.previewStackMode = value === "stacked";
    } else if (action === "pieMode") {
      previewState.previewPieMode = value || "donut";
    } else if (action === "dualAxisSeriesCount") {
      if (side === "left") {
        previewState.previewDualAxisLeftSeriesCount = Number(value) || 2;
      } else if (side === "right") {
        previewState.previewDualAxisRightSeriesCount = Number(value) || 2;
      }
    } else if (action === "dualAxisType") {
      if (side === "left") {
        previewState.dualAxisPreviewLeftType = value || "bar";
      } else if (side === "right") {
        previewState.dualAxisPreviewRightType = value || "line";
      }
    }

    this.commitState(this.data.chartType, this.data.commonValues, this.data.specificValues, previewState, true);
  }
});
