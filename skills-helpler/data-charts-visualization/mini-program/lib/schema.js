const COMMON_DEFAULTS = {
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
  legendFontSize: 11,
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
  xMin: "",
  xMax: "",
  xRotate: 0,
  yAxisLabelFontSize: 11,
  yAxisLabelColor: "#4b5563",
  yAxisLineShow: false,
  yAxisTickShow: true,
  yAxisLineColor: "#9ca3af",
  yFormatter: "{value}",
  yMin: "",
  yMax: "",
  splitLineShow: true,
  splitLineColor: "#e5e7eb",
  splitLineType: "dashed",
  splitLineWidth: 1,
  gridLeft: "12%",
  gridRight: "9%",
  gridTop: "21%",
  gridBottom: "15%"
};

const PERCENT_OPTIONS = [
  "0%",
  "3%",
  "6%",
  "9%",
  "12%",
  "15%",
  "18%",
  "21%",
  "24%",
  "27%",
  "30%",
  "33%",
  "36%",
  "39%",
  "42%"
];

const FONT_SIZE_OPTIONS = ["8", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28"];
const SPLIT_WIDTH_OPTIONS = ["0.6", "1", "1.6"];
const LINE_STYLE_OPTIONS = [
  ["solid", "Solid"],
  ["dashed", "Dashed"],
  ["dotted", "Dotted"]
];
const SYMBOL_OPTIONS = [
  ["circle", "Circle"],
  ["rect", "Rect"],
  ["triangle", "Triangle"],
  ["diamond", "Diamond"]
];

const COMMON_GROUPS = [
  {
    id: "title",
    label: "标题",
    fields: [
      { id: "titleText", label: "主标题", type: "text" },
      { id: "titleShow", label: "显示主标题", type: "checkbox" },
      {
        id: "titleAlign",
        label: "标题对齐",
        type: "select",
        options: [
          ["left", "Left"],
          ["center", "Center"],
          ["right", "Right"]
        ]
      },
      { id: "titleFontSize", label: "标题字号", type: "select", options: FONT_SIZE_OPTIONS.map((value) => [value, value]) },
      { id: "titleColor", label: "标题颜色", type: "color" },
      { id: "titleBold", label: "标题加粗", type: "checkbox" },
      { id: "subtitleText", label: "副标题", type: "text" },
      { id: "subtitleShow", label: "显示副标题", type: "checkbox" },
      { id: "subtitleFontSize", label: "副标题字号", type: "select", options: FONT_SIZE_OPTIONS.map((value) => [value, value]) },
      { id: "subtitleColor", label: "副标题颜色", type: "color" }
    ]
  },
  {
    id: "legend",
    label: "图例",
    fields: [
      { id: "legendShow", label: "显示图例", type: "checkbox" },
      {
        id: "legendPosition",
        label: "图例位置",
        type: "select",
        options: [
          ["top-left", "Top Left"],
          ["top-center", "Top Center"],
          ["top-right", "Top Right"],
          ["middle-left", "Middle Left"],
          ["middle-right", "Middle Right"],
          ["bottom-left", "Bottom Left"],
          ["bottom-center", "Bottom Center"],
          ["bottom-right", "Bottom Right"]
        ]
      },
      {
        id: "legendOrient",
        label: "图例方向",
        type: "select",
        options: [
          ["horizontal", "Horizontal"],
          ["vertical", "Vertical"]
        ]
      },
      { id: "legendFontSize", label: "图例字号", type: "select", options: FONT_SIZE_OPTIONS.map((value) => [value, value]) },
      { id: "legendColor", label: "图例颜色", type: "color" }
    ]
  },
  {
    id: "canvas",
    label: "画布",
    fields: [
      { id: "backgroundColor", label: "背景色", type: "color" },
      { id: "palette", label: "调色板", type: "textarea" },
      { id: "gridLeft", label: "Plot Left", type: "select", options: PERCENT_OPTIONS.map((value) => [value, value]) },
      { id: "gridRight", label: "Plot Right", type: "select", options: PERCENT_OPTIONS.map((value) => [value, value]) },
      { id: "gridTop", label: "Plot Top", type: "select", options: PERCENT_OPTIONS.map((value) => [value, value]) },
      { id: "gridBottom", label: "Plot Bottom", type: "select", options: PERCENT_OPTIONS.map((value) => [value, value]) }
    ]
  },
  {
    id: "axes",
    label: "坐标轴",
    fields: [
      { id: "xAxisLineShow", label: "显示 X 轴线", type: "checkbox" },
      { id: "xAxisTickShow", label: "显示 X 轴刻度", type: "checkbox" },
      { id: "xRotate", label: "X 标签旋转", type: "number", step: 1 },
      { id: "xAxisLabelFontSize", label: "X 标签字号", type: "select", options: FONT_SIZE_OPTIONS.map((value) => [value, value]) },
      { id: "xAxisLabelColor", label: "X 标签颜色", type: "color" },
      { id: "xAxisLineColor", label: "X 轴线颜色", type: "color" },
      { id: "xFormatter", label: "X Formatter", type: "text" },
      { id: "xMin", label: "X Min", type: "text" },
      { id: "xMax", label: "X Max", type: "text" },
      { id: "yAxisLineShow", label: "显示 Y 轴线", type: "checkbox" },
      { id: "yAxisTickShow", label: "显示 Y 轴刻度", type: "checkbox" },
      { id: "yAxisLabelFontSize", label: "Y 标签字号", type: "select", options: FONT_SIZE_OPTIONS.map((value) => [value, value]) },
      { id: "yAxisLabelColor", label: "Y 标签颜色", type: "color" },
      { id: "yAxisLineColor", label: "Y 轴线颜色", type: "color" },
      { id: "yFormatter", label: "Y Formatter", type: "text" },
      { id: "yMin", label: "Y Min", type: "text" },
      { id: "yMax", label: "Y Max", type: "text" }
    ]
  },
  {
    id: "splitLines",
    label: "分割线",
    fields: [
      { id: "splitLineShow", label: "显示横向分割线", type: "checkbox" },
      { id: "splitLineColor", label: "横向分割线颜色", type: "color" },
      {
        id: "splitLineType",
        label: "横向分割线样式",
        type: "select",
        options: [...LINE_STYLE_OPTIONS, ["--", "ECharts Dashed"]]
      },
      { id: "splitLineWidth", label: "横向分割线宽度", type: "select", options: SPLIT_WIDTH_OPTIONS.map((value) => [value, value]) },
      { id: "xSplitLineShow", label: "显示纵向分割线", type: "checkbox" },
      { id: "xSplitLineColor", label: "纵向分割线颜色", type: "color" },
      {
        id: "xSplitLineType",
        label: "纵向分割线样式",
        type: "select",
        options: [...LINE_STYLE_OPTIONS, ["--", "ECharts Dashed"]]
      },
      { id: "xSplitLineWidth", label: "纵向分割线宽度", type: "select", options: SPLIT_WIDTH_OPTIONS.map((value) => [value, value]) }
    ]
  }
];

const CHART_ORDER = ["line", "bar", "area", "dualAxis", "scatter", "pie", "gauge", "radar", "funnel"];

const CHART_DEFINITIONS = {
  line: {
    label: "Line",
    zhLabel: "折线图",
    blurb: "适合趋势、多序列对比和连续变化指标。",
    usesGrid: true,
    usesCartesian: true,
    fields: [
      { id: "smooth", label: "Smooth", type: "checkbox", default: true },
      { id: "showSymbol", label: "Show Symbols", type: "checkbox", default: true },
      { id: "connectNulls", label: "Connect Nulls", type: "checkbox", default: false },
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: true },
      { id: "symbol", label: "Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "symbolSize", label: "Symbol Size", type: "number", default: 5, step: 1 },
      { id: "lineStyleType", label: "Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "lineWidth", label: "Line Width", type: "number", default: 3, step: 0.2 },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" }
    ]
  },
  bar: {
    label: "Bar",
    zhLabel: "柱状图",
    blurb: "适合类目对比、排名和堆叠汇总。",
    usesGrid: true,
    usesCartesian: true,
    fields: [
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: true },
      { id: "barGap", label: "Bar Gap", type: "text", default: "10%" },
      {
        id: "labelPosition",
        label: "Label Position",
        type: "select",
        default: "top",
        options: [
          ["top", "Top"],
          ["inside", "Inside"],
          ["insideTop", "Inside Top"],
          ["insideRight", "Inside Right"],
          ["outside", "Outside"]
        ]
      },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" },
      { id: "itemOpacity", label: "Bar Opacity", type: "number", default: 0.92, step: 0.05 },
      { id: "borderRadius", label: "Corner Radius", type: "number", default: 0, step: 0.5 },
      { id: "borderWidth", label: "Border Width", type: "number", default: 0, step: 0.5 },
      { id: "borderColor", label: "Border Color", type: "color", default: "#ffffff" }
    ]
  },
  area: {
    label: "Area",
    zhLabel: "面积图",
    blurb: "适合强调趋势变化体量感和累计感。",
    usesGrid: true,
    usesCartesian: true,
    fields: [
      { id: "smooth", label: "Smooth", type: "checkbox", default: true },
      { id: "showSymbol", label: "Show Symbols", type: "checkbox", default: true },
      { id: "symbol", label: "Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "symbolSize", label: "Symbol Size", type: "number", default: 4, step: 1 },
      { id: "connectNulls", label: "Connect Nulls", type: "checkbox", default: false },
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: true },
      { id: "areaOpacity", label: "Area Opacity", type: "number", default: 0.35, step: 0.05 },
      {
        id: "areaFillMode",
        label: "Fill Style",
        type: "select",
        default: "gradient",
        options: [
          ["solid", "Solid (Auto Palette)"],
          ["gradient", "Gradient (Auto Palette)"]
        ]
      },
      { id: "lineStyleType", label: "Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "lineWidth", label: "Line Width", type: "number", default: 2, step: 0.2 },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" }
    ]
  },
  dualAxis: {
    label: "Dual-Axis",
    zhLabel: "双轴图",
    blurb: "适合双系列混合和双量纲展示。",
    usesGrid: true,
    usesCartesian: true,
    fields: [
      { id: "layoutGroup", label: "Structure", type: "group", help: "Choose orientation and axis binding first." },
      { id: "horizontal", label: "Horizontal Layout", type: "checkbox", default: false },
      { id: "splitLineAxisGroup", label: "Split Line Binding", type: "group", help: "Choose which value axis the shared split lines follow." },
      {
        id: "splitLineFollowAxis",
        label: "Split Line Follow",
        type: "select",
        default: "left",
        options: [
          ["left", "Left Axis"],
          ["right", "Right Axis"]
        ]
      },
      { id: "leftAxisGroup", label: "Left Value Axis", type: "group", help: "Control the left value axis." },
      { id: "leftAxisLabelFontSize", label: "Left Axis Label Size", type: "number", default: 11, step: 1 },
      { id: "leftAxisLabelColor", label: "Left Axis Label Color", type: "color", default: "#9ca3af" },
      { id: "leftAxisLineShow", label: "Show Left Axis Line", type: "checkbox", default: true },
      { id: "leftAxisLineColor", label: "Left Axis Line Color", type: "color", default: "#9ca3af" },
      { id: "leftAxisTickShow", label: "Show Left Axis Ticks", type: "checkbox", default: true },
      { id: "leftAxisFormatter", label: "Left Axis Formatter", type: "text", default: "{value}" },
      { id: "leftAxisMin", label: "Left Axis Min", type: "text", default: "" },
      { id: "leftAxisMax", label: "Left Axis Max", type: "text", default: "" },
      { id: "leftBarGroup", label: "Left Bar", type: "group", help: "Bar style for the left series." },
      { id: "leftBarShowLabel", label: "Show Left Bar Labels", type: "checkbox", default: true },
      {
        id: "leftBarLabelPosition",
        label: "Left Bar Label Position",
        type: "select",
        default: "top",
        options: [
          ["top", "Top"],
          ["inside", "Inside"],
          ["insideTop", "Inside Top"],
          ["insideRight", "Inside Right"],
          ["outside", "Outside"]
        ]
      },
      { id: "leftBarLabelFontSize", label: "Left Bar Label Size", type: "number", default: 10, step: 1 },
      { id: "leftBarLabelColor", label: "Left Bar Label Color", type: "color", default: "#334155" },
      { id: "leftBarOpacity", label: "Left Bar Opacity", type: "number", default: 0.92, step: 0.05 },
      { id: "leftBarGap", label: "Left Bar Gap", type: "text", default: "10%" },
      { id: "leftBarBorderRadius", label: "Left Bar Corner Radius", type: "number", default: 0, step: 0.5 },
      { id: "leftBarBorderWidth", label: "Left Bar Border Width", type: "number", default: 0, step: 0.5 },
      { id: "leftBarBorderColor", label: "Left Bar Border Color", type: "color", default: "#ffffff" },
      { id: "leftBarColors", label: "Left Bar Palette", type: "textarea", default: "#5470c6, #73c0de, #91cc75" },
      { id: "leftLineGroup", label: "Left Line", type: "group", help: "Line style for the left series." },
      { id: "leftLineSmooth", label: "Smooth Left Line", type: "checkbox", default: true },
      { id: "leftLineArea", label: "Left Line With Area", type: "checkbox", default: false },
      { id: "leftLineShowSymbol", label: "Show Left Symbols", type: "checkbox", default: false },
      { id: "leftLineConnectNulls", label: "Connect Left Nulls", type: "checkbox", default: false },
      { id: "leftLineShowLabel", label: "Show Left Line Labels", type: "checkbox", default: false },
      { id: "leftLineColors", label: "Left Line Palette", type: "textarea", default: "#5470c6, #3b82f6, #06b6d4" },
      { id: "leftLineStyleType", label: "Left Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "leftLineWidth", label: "Left Line Width", type: "number", default: 3, step: 0.2 },
      { id: "leftLineSymbol", label: "Left Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "leftLineSymbolSize", label: "Left Symbol Size", type: "number", default: 5, step: 1 },
      { id: "leftLineLabelFontSize", label: "Left Line Label Size", type: "number", default: 10, step: 1 },
      { id: "leftLineLabelColor", label: "Left Line Label Color", type: "color", default: "#334155" },
      { id: "rightAxisGroup", label: "Right Value Axis", type: "group", help: "Control the right value axis." },
      { id: "rightAxisLabelFontSize", label: "Right Axis Label Size", type: "number", default: 11, step: 1 },
      { id: "rightAxisLabelColor", label: "Right Axis Label Color", type: "color", default: "#9ca3af" },
      { id: "rightAxisLineShow", label: "Show Right Axis Line", type: "checkbox", default: true },
      { id: "rightAxisLineColor", label: "Right Axis Line Color", type: "color", default: "#9ca3af" },
      { id: "rightAxisTickShow", label: "Show Right Axis Ticks", type: "checkbox", default: true },
      { id: "rightAxisFormatter", label: "Right Axis Formatter", type: "text", default: "{value}" },
      { id: "rightAxisMin", label: "Right Axis Min", type: "text", default: "" },
      { id: "rightAxisMax", label: "Right Axis Max", type: "text", default: "" },
      { id: "rightBarGroup", label: "Right Bar", type: "group", help: "Bar style for the right series." },
      { id: "rightBarShowLabel", label: "Show Right Bar Labels", type: "checkbox", default: true },
      {
        id: "rightBarLabelPosition",
        label: "Right Bar Label Position",
        type: "select",
        default: "top",
        options: [
          ["top", "Top"],
          ["inside", "Inside"],
          ["insideTop", "Inside Top"],
          ["insideRight", "Inside Right"],
          ["outside", "Outside"]
        ]
      },
      { id: "rightBarLabelFontSize", label: "Right Bar Label Size", type: "number", default: 10, step: 1 },
      { id: "rightBarLabelColor", label: "Right Bar Label Color", type: "color", default: "#334155" },
      { id: "rightBarOpacity", label: "Right Bar Opacity", type: "number", default: 0.92, step: 0.05 },
      { id: "rightBarGap", label: "Right Bar Gap", type: "text", default: "10%" },
      { id: "rightBarBorderRadius", label: "Right Bar Corner Radius", type: "number", default: 0, step: 0.5 },
      { id: "rightBarBorderWidth", label: "Right Bar Border Width", type: "number", default: 0, step: 0.5 },
      { id: "rightBarBorderColor", label: "Right Bar Border Color", type: "color", default: "#ffffff" },
      { id: "rightBarColors", label: "Right Bar Palette", type: "textarea", default: "#ef4444, #f97316, #f59e0b" },
      { id: "rightLineGroup", label: "Right Line", type: "group", help: "Line style for the right series." },
      { id: "rightLineSmooth", label: "Smooth Right Line", type: "checkbox", default: true },
      { id: "rightLineArea", label: "Right Line With Area", type: "checkbox", default: false },
      { id: "rightLineShowSymbol", label: "Show Right Symbols", type: "checkbox", default: false },
      { id: "rightLineConnectNulls", label: "Connect Right Nulls", type: "checkbox", default: false },
      { id: "rightLineShowLabel", label: "Show Right Line Labels", type: "checkbox", default: false },
      { id: "rightLineColors", label: "Right Line Palette", type: "textarea", default: "#ef4444, #f97316, #f59e0b" },
      { id: "rightLineStyleType", label: "Right Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "rightLineWidth", label: "Right Line Width", type: "number", default: 3, step: 0.2 },
      { id: "rightLineSymbol", label: "Right Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "rightLineSymbolSize", label: "Right Symbol Size", type: "number", default: 5, step: 1 },
      { id: "rightLineLabelFontSize", label: "Right Label Size", type: "number", default: 10, step: 1 },
      { id: "rightLineLabelColor", label: "Right Label Color", type: "color", default: "#334155" }
    ]
  },
  scatter: {
    label: "Scatter",
    zhLabel: "散点图",
    blurb: "适合相关性、聚类和数值轴分布。",
    usesGrid: true,
    usesCartesian: true,
    fields: [
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: false },
      {
        id: "symbolSize",
        label: "Default Symbol Size",
        type: "select",
        default: "64",
        options: [
          ["24", "Very Small"],
          ["40", "Small"],
          ["64", "Medium"],
          ["88", "Large"],
          ["116", "Very Large"]
        ]
      },
      { id: "symbol", label: "Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "itemOpacity", label: "Point Opacity", type: "number", default: 0.92, step: 0.05 },
      { id: "borderWidth", label: "Border Width", type: "number", default: 0, step: 0.5 },
      { id: "borderColor", label: "Border Color", type: "color", default: "#ffffff" },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" }
    ]
  },
  pie: {
    label: "Pie",
    zhLabel: "饼图",
    blurb: "适合简单占比表达，也支持环图风格。",
    usesGrid: false,
    usesCartesian: false,
    supportsPlotArea: true,
    fields: [
      {
        id: "labelPosition",
        label: "Label Position",
        type: "select",
        default: "outside",
        options: [
          ["outside", "Outside"],
          ["inside", "Inside"]
        ]
      },
      { id: "startAngle", label: "Start Angle", type: "number", default: 90, step: 1 },
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: true },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 11, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" },
      { id: "labelFormatter", label: "Label Formatter", type: "text", default: "{b} {d}%" },
      { id: "labelLineShow", label: "Show Label Line", type: "checkbox", default: true },
      { id: "labelLineColor", label: "Label Line Color", type: "color", default: "#94a3b8" },
      { id: "labelLineWidth", label: "Label Line Width", type: "number", default: 0.8, step: 0.1 },
      { id: "itemOpacity", label: "Slice Opacity", type: "number", default: 0.96, step: 0.05 },
      { id: "borderWidth", label: "Border Width", type: "number", default: 0, step: 0.5 },
      { id: "borderColor", label: "Border Color", type: "color", default: "#ffffff" }
    ]
  },
  gauge: {
    label: "Gauge",
    zhLabel: "仪表盘",
    blurb: "适合单 KPI、进度和阈值分段展示。",
    usesGrid: false,
    usesCartesian: false,
    supportsPlotArea: true,
    supportsLegend: false,
    fields: [
      { id: "gaugeFoundationGroup", label: "Foundation", type: "group", help: "Control gauge angles and progress ring." },
      { id: "startAngle", label: "Start Angle", type: "number", default: 225, step: 1 },
      { id: "endAngle", label: "End Angle", type: "number", default: -45, step: 1 },
      { id: "progressShow", label: "Show Progress", type: "checkbox", default: true },
      { id: "progressWidth", label: "Progress Width", type: "number", default: 20, step: 1 },
      { id: "progressColor", label: "Progress Color", type: "color", default: "#5470c6" },
      { id: "axisWidth", label: "Band Width", type: "number", default: 20, step: 1 },
      { id: "bandStops", label: "Segment Colors", type: "textarea", default: "#22c55e, #84cc16, #facc15, #f97316, #ef4444" },
      { id: "gaugeTitleGroup", label: "Gauge Name", type: "group", help: "Control the small title inside the gauge." },
      { id: "titleShow", label: "Show Gauge Name", type: "checkbox", default: true },
      { id: "titleFontSize", label: "Gauge Name Size", type: "number", default: 12, step: 1 },
      { id: "titleColor", label: "Gauge Name Color", type: "color", default: "#6e7079" },
      { id: "gaugeDetailGroup", label: "Detail", type: "group", help: "Control the value detail text inside the gauge." },
      { id: "detailShow", label: "Show Detail", type: "checkbox", default: true },
      { id: "detailFormatter", label: "Detail Formatter", type: "text", default: "{value}%" },
      { id: "detailFontSize", label: "Detail Size", type: "number", default: 22, step: 1 },
      { id: "detailColor", label: "Detail Color", type: "color", default: "#464646" },
      { id: "gaugeTicksGroup", label: "Ticks", type: "group", help: "Control scale labels and tick marks." },
      { id: "axisLabelShow", label: "Show Axis Labels", type: "checkbox", default: true },
      { id: "axisLabelDistance", label: "Axis Label Distance", type: "number", default: 25, step: 1 },
      { id: "axisLabelFontSize", label: "Axis Label Size", type: "number", default: 10, step: 1 },
      { id: "axisLabelColor", label: "Axis Label Color", type: "color", default: "#6e7079" },
      { id: "splitLineShow", label: "Show Major Ticks", type: "checkbox", default: true },
      { id: "splitLineLength", label: "Major Tick Length", type: "number", default: 12, step: 1 },
      { id: "splitLineWidth", label: "Major Tick Width", type: "number", default: 2, step: 0.5 },
      { id: "splitLineColor", label: "Major Tick Color", type: "color", default: "#6e7079" },
      { id: "axisTickShow", label: "Show Minor Ticks", type: "checkbox", default: true },
      { id: "axisTickLength", label: "Minor Tick Length", type: "number", default: 6, step: 1 },
      { id: "axisTickWidth", label: "Minor Tick Width", type: "number", default: 1, step: 0.5 },
      { id: "axisTickColor", label: "Minor Tick Color", type: "color", default: "#999999" },
      { id: "gaugePointerGroup", label: "Pointer And Anchor", type: "group", help: "Control pointer and center anchor appearance." },
      { id: "pointerShow", label: "Show Pointer", type: "checkbox", default: true },
      {
        id: "pointerWidth",
        label: "Pointer Width",
        type: "select",
        default: "4",
        options: [
          ["2", "Slim"],
          ["3", "Standard"],
          ["4", "Balanced"],
          ["5", "Bold"],
          ["6", "Heavy"]
        ]
      },
      { id: "pointerColor", label: "Pointer Color", type: "color", default: "#2f4554" },
      { id: "anchorShow", label: "Show Anchor", type: "checkbox", default: true },
      {
        id: "anchorSize",
        label: "Anchor Size",
        type: "select",
        default: "20",
        options: [
          ["8", "Tiny"],
          ["12", "Small"],
          ["20", "Medium"],
          ["24", "Large"],
          ["32", "XL"]
        ]
      },
      { id: "anchorColor", label: "Anchor Color", type: "color", default: "#2f4554" }
    ]
  },
  radar: {
    label: "Radar",
    zhLabel: "雷达图",
    blurb: "适合多维评分、能力画像和均衡对比。",
    usesGrid: false,
    usesCartesian: false,
    supportsPlotArea: true,
    fields: [
      { id: "radarFoundationGroup", label: "Foundation", type: "group", help: "Control radar shape and split count." },
      {
        id: "shape",
        label: "Shape",
        type: "select",
        default: "polygon",
        options: [
          ["polygon", "Polygon"],
          ["circle", "Circle"]
        ]
      },
      { id: "splitNumber", label: "Split Number", type: "number", default: 5, step: 1 },
      { id: "showSymbol", label: "Show Symbols", type: "checkbox", default: true },
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: false },
      { id: "labelFormatter", label: "Label Formatter", type: "text", default: "{b}: {c}" },
      { id: "areaOpacity", label: "Area Opacity", type: "number", default: 0.18, step: 0.05 },
      { id: "radarGridGroup", label: "Grid Lines", type: "group", help: "Control split lines and axis lines." },
      { id: "splitLineColor", label: "Split Line Color", type: "color", default: "#d0d7de" },
      { id: "splitLineWidth", label: "Split Line Width", type: "number", default: 0.8, step: 0.1 },
      { id: "splitLineType", label: "Split Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "axisLineColor", label: "Axis Line Color", type: "color", default: "#94a3b8" },
      { id: "axisLineWidth", label: "Axis Line Width", type: "number", default: 1, step: 0.1 },
      { id: "axisLineType", label: "Axis Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "axisNameFontSize", label: "Axis Name Size", type: "number", default: 11, step: 1 },
      { id: "axisNameColor", label: "Axis Name Color", type: "color", default: "#334155" },
      { id: "axisNameBold", label: "Bold Axis Names", type: "checkbox", default: true },
      { id: "radarSeriesGroup", label: "Series Style", type: "group", help: "Control symbol and outline style for radar series." },
      { id: "symbol", label: "Symbol", type: "select", default: "circle", options: SYMBOL_OPTIONS },
      { id: "symbolSize", label: "Symbol Size", type: "number", default: 5, step: 1 },
      { id: "lineStyleType", label: "Line Style", type: "select", default: "solid", options: LINE_STYLE_OPTIONS },
      { id: "lineWidth", label: "Line Width", type: "number", default: 2.4, step: 0.2 },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" }
    ]
  },
  funnel: {
    label: "Funnel",
    zhLabel: "漏斗图",
    blurb: "适合转化漏斗和流程流失分析。",
    usesGrid: false,
    usesCartesian: false,
    supportsPlotArea: true,
    fields: [
      { id: "funnelBaseGroup", label: "Foundation", type: "group", help: "Control ordering, gap, and width range." },
      {
        id: "sort",
        label: "Sort",
        type: "select",
        default: "descending",
        options: [
          ["descending", "Descending"],
          ["ascending", "Ascending"],
          ["none", "Preserve Input Order"]
        ]
      },
      { id: "gap", label: "Gap", type: "number", default: 4, step: 1 },
      { id: "minSize", label: "Min Size", type: "text", default: "20%" },
      { id: "maxSize", label: "Max Size", type: "text", default: "80%" },
      { id: "itemOpacity", label: "Funnel Opacity", type: "number", default: 0.92, step: 0.05 },
      { id: "funnelLabelGroup", label: "Labels", type: "group", help: "Control label visibility, placement, formatter, and text style." },
      {
        id: "labelPosition",
        label: "Label Position",
        type: "select",
        default: "outside",
        options: [
          ["outside", "Outside"],
          ["inside", "Inside"]
        ]
      },
      { id: "showLabel", label: "Show Labels", type: "checkbox", default: true },
      { id: "labelFormatter", label: "Label Formatter", type: "text", default: "{b}: {c}" },
      { id: "labelFontSize", label: "Label Size", type: "number", default: 10, step: 1 },
      { id: "labelColor", label: "Label Color", type: "color", default: "#334155" }
    ]
  }
};

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
      xSplitLineShow: false
    },
    specific: { smooth: true, showSymbol: true, connectNulls: false, showLabel: true }
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
      xSplitLineShow: false
    },
    specific: { showLabel: true, barGap: "10%" }
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
      gridBottom: "30%"
    },
    specific: { labelPosition: "outside", startAngle: 90 }
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
      gridBottom: "15%"
    },
    specific: {
      progressShow: true,
      titleShow: true,
      detailShow: true,
      axisLabelShow: true,
      axisTickShow: true,
      splitLineShow: true,
      axisLabelDistance: 25,
      anchorSize: "20"
    }
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
      xSplitLineShow: false
    },
    specific: {
      smooth: true,
      showSymbol: true,
      connectNulls: false,
      showLabel: true,
      areaOpacity: 0.24,
      areaFillMode: "gradient"
    }
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
      gridRight: "12%"
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
      rightLineConnectNulls: false
    }
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
      xSplitLineType: "dashed"
    },
    specific: { showLabel: false, symbolSize: "64" }
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
      gridBottom: "30%"
    },
    specific: {
      shape: "polygon",
      splitNumber: 5,
      showSymbol: false,
      showLabel: false,
      labelFormatter: "{b}: {c}",
      areaOpacity: 0.18,
      axisNameBold: true
    }
  },
  funnel: {
    common: {
      titleAlign: "center",
      backgroundColor: "#ffffff",
      palette: "#2563eb, #14b8a6, #f59e0b, #ef4444, #8b5cf6",
      legendShow: true,
      legendPosition: "bottom-center",
      legendOrient: "horizontal"
    },
    specific: {
      sort: "descending",
      showLabel: true,
      labelPosition: "inside",
      gap: 2,
      minSize: "12%",
      maxSize: "88%",
      labelFormatter: "{b}: {d}%"
    }
  }
};

module.exports = {
  COMMON_DEFAULTS,
  COMMON_GROUPS,
  CHART_ORDER,
  CHART_DEFINITIONS,
  CHART_BEAUTY_DEFAULTS
};
