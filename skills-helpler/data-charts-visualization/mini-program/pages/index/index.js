const echarts = require("../../ec-canvas/echarts");
const {
  COMMON_DEFAULTS,
  COMMON_GROUPS,
  CHART_ORDER,
  CHART_DEFINITIONS,
  CHART_BEAUTY_DEFAULTS
} = require("../../lib/schema");
const { buildChartArtifacts } = require("../../../shared/option-builder");
const SAMPLE_DATA = require("../../../shared/sample-data");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildCommonValues(chartType) {
  return {
    ...deepClone(COMMON_DEFAULTS),
    ...(CHART_BEAUTY_DEFAULTS[chartType] ? deepClone(CHART_BEAUTY_DEFAULTS[chartType].common || {}) : {})
  };
}

function buildSpecificValues(chartType) {
  const definition = CHART_DEFINITIONS[chartType];
  const values = {};
  definition.fields.forEach((field) => {
    if (field.type !== "group") {
      values[field.id] = field.default !== undefined ? deepClone(field.default) : "";
    }
  });
  return {
    ...values,
    ...(CHART_BEAUTY_DEFAULTS[chartType] ? deepClone(CHART_BEAUTY_DEFAULTS[chartType].specific || {}) : {})
  };
}

function shouldShowCommonGroup(groupId, definition) {
  if (groupId === "legend" && definition.supportsLegend === false) {
    return false;
  }
  if ((groupId === "axes" || groupId === "splitLines") && !definition.usesCartesian) {
    return false;
  }
  return true;
}

function toFieldView(field, currentValue) {
  const optionValues = (field.options || []).map((item) => String(item[0]));
  const matchedIndex = optionValues.findIndex((item) => item === String(currentValue));
  return {
    ...field,
    value: currentValue,
    checked: Boolean(currentValue),
    optionLabels: (field.options || []).map((item) => item[1]),
    pickerIndex: matchedIndex >= 0 ? matchedIndex : 0
  };
}

function buildCommonSections(chartType, values) {
  const definition = CHART_DEFINITIONS[chartType];
  return COMMON_GROUPS
    .filter((group) => shouldShowCommonGroup(group.id, definition))
    .map((group) => ({
      ...group,
      fields: group.fields.map((field) => toFieldView(field, values[field.id]))
    }));
}

function buildSpecificSections(chartType, values) {
  const definition = CHART_DEFINITIONS[chartType];
  const sections = [];
  let current = {
    id: "default",
    title: "图表样式",
    help: definition.blurb,
    fields: []
  };

  definition.fields.forEach((field) => {
    if (field.type === "group") {
      if (current.fields.length) {
        sections.push(current);
      }
      current = {
        id: field.id,
        title: field.label,
        help: field.help || "",
        fields: []
      };
      return;
    }
    current.fields.push(toFieldView(field, values[field.id]));
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
    chartType: "line",
    chartLabel: CHART_DEFINITIONS.line.zhLabel,
    chartBlurb: CHART_DEFINITIONS.line.blurb,
    chartTabs: [],
    commonValues: {},
    specificValues: {},
    commonSections: [],
    specificSections: []
  },

  onLoad() {
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
        width,
        height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);
      this.chart = chart;
      this.previewViewportSize = { width, height };
      this.renderChart();
      return chart;
    });
  },

  resetChart(chartType, shouldRender = true) {
    this.commitState(chartType, buildCommonValues(chartType), buildSpecificValues(chartType), shouldRender);
  },

  commitState(chartType, commonValues, specificValues, shouldRender = true) {
    const definition = CHART_DEFINITIONS[chartType];
    this.setData(
      {
        chartType,
        chartLabel: definition.zhLabel,
        chartBlurb: definition.blurb,
        chartTabs: buildTabs(chartType),
        commonValues,
        specificValues,
        commonSections: buildCommonSections(chartType, commonValues),
        specificSections: buildSpecificSections(chartType, specificValues)
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
    const definition = CHART_DEFINITIONS[this.data.chartType];
    const artifacts = buildChartArtifacts({
      chartType: this.data.chartType,
      definition,
      commonState: this.data.commonValues,
      specificState: this.data.specificValues,
      rawData: SAMPLE_DATA[this.data.chartType],
      previewState: {
        previewPieMode: this.data.chartType === "pie" ? "donut" : "donut"
      },
      previewViewportSize: this.previewViewportSize || { width: 960, height: 520 }
    });
    this.chart.setOption(artifacts.resolvedOption, true);
    this.chart.resize();
  },

  handleChartSwitch(event) {
    const chartType = event.currentTarget.dataset.chartType;
    if (!chartType || chartType === this.data.chartType) {
      return;
    }
    this.resetChart(chartType, true);
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

    this.commitState(this.data.chartType, commonValues, specificValues, true);
  }
});
