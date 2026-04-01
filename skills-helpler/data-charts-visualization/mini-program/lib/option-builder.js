const FALLBACK_PALETTE = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"];

function parseNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parsePercent(value, fallback) {
  if (typeof value === "string" && value.trim().endsWith("%")) {
    const numeric = Number(value.replace("%", ""));
    if (Number.isFinite(numeric)) {
      return `${numeric}%`;
    }
  }
  return fallback;
}

function normalizeColor(value, fallback) {
  const source = String(value || "").trim();
  if (/^#([\da-f]{3}|[\da-f]{6})$/i.test(source)) {
    return source;
  }
  return fallback;
}

function parsePalette(value) {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : FALLBACK_PALETTE;
}

function rgba(hex, alpha) {
  const source = normalizeColor(hex, "#5470c6").replace("#", "");
  const full = source.length === 3 ? source.split("").map((item) => `${item}${item}`).join("") : source;
  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getLegendPlacement(position) {
  const placements = {
    "top-left": { left: "left", top: 10 },
    "top-center": { left: "center", top: 10 },
    "top-right": { right: 10, top: 10 },
    "middle-left": { left: "left", top: "center" },
    "middle-right": { right: 10, top: "center" },
    "bottom-left": { left: "left", bottom: 10 },
    "bottom-center": { left: "center", bottom: 10 },
    "bottom-right": { right: 10, bottom: 10 }
  };
  return placements[position] || placements["top-left"];
}

function getBaseOption(commonValues, enableLegend) {
  return {
    backgroundColor: normalizeColor(commonValues.backgroundColor, "#ffffff"),
    color: parsePalette(commonValues.palette),
    animation: false,
    title: {
      text: commonValues.titleShow ? commonValues.titleText : "",
      subtext: commonValues.subtitleShow ? commonValues.subtitleText : "",
      left: commonValues.titleAlign || "left",
      textStyle: {
        color: normalizeColor(commonValues.titleColor, "#1f2937"),
        fontSize: parseNumber(commonValues.titleFontSize, 26),
        fontWeight: commonValues.titleBold ? "700" : "500"
      },
      subtextStyle: {
        color: normalizeColor(commonValues.subtitleColor, "#6b7280"),
        fontSize: parseNumber(commonValues.subtitleFontSize, 11)
      }
    },
    legend: {
      show: enableLegend && commonValues.legendShow !== false,
      orient: commonValues.legendOrient || "horizontal",
      textStyle: {
        color: normalizeColor(commonValues.legendColor, "#4b5563"),
        fontSize: parseNumber(commonValues.legendFontSize, 11)
      },
      ...getLegendPlacement(commonValues.legendPosition)
    }
  };
}

function getCartesianBase(commonValues, categories, horizontal) {
  const splitLineStyle = {
    color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
    type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
    width: parseNumber(commonValues.splitLineWidth, 1)
  };
  const xSplitLineStyle = {
    color: normalizeColor(commonValues.xSplitLineColor, "#e5e7eb"),
    type: commonValues.xSplitLineType === "--" ? "dashed" : (commonValues.xSplitLineType || "dashed"),
    width: parseNumber(commonValues.xSplitLineWidth, 1)
  };
  const grid = {
    left: parsePercent(commonValues.gridLeft, "12%"),
    right: parsePercent(commonValues.gridRight, "9%"),
    top: parsePercent(commonValues.gridTop, "21%"),
    bottom: parsePercent(commonValues.gridBottom, "15%"),
    containLabel: true
  };

  if (!horizontal) {
    return {
      grid,
      xAxis: {
        type: "category",
        data: categories,
        axisLine: {
          show: commonValues.xAxisLineShow !== false,
          lineStyle: { color: normalizeColor(commonValues.xAxisLineColor, "#9ca3af") }
        },
        axisTick: {
          show: commonValues.xAxisTickShow !== false
        },
        axisLabel: {
          color: normalizeColor(commonValues.xAxisLabelColor, "#4b5563"),
          fontSize: parseNumber(commonValues.xAxisLabelFontSize, 11),
          rotate: parseNumber(commonValues.xRotate, 0),
          formatter: commonValues.xFormatter || "{value}"
        },
        splitLine: {
          show: Boolean(commonValues.xSplitLineShow),
          lineStyle: xSplitLineStyle
        }
      },
      yAxis: {
        type: "value",
        min: parseOptionalNumber(commonValues.yMin),
        max: parseOptionalNumber(commonValues.yMax),
        axisLine: {
          show: commonValues.yAxisLineShow === true,
          lineStyle: { color: normalizeColor(commonValues.yAxisLineColor, "#9ca3af") }
        },
        axisTick: {
          show: commonValues.yAxisTickShow !== false
        },
        axisLabel: {
          color: normalizeColor(commonValues.yAxisLabelColor, "#4b5563"),
          fontSize: parseNumber(commonValues.yAxisLabelFontSize, 11),
          formatter: commonValues.yFormatter || "{value}"
        },
        splitLine: {
          show: Boolean(commonValues.splitLineShow),
          lineStyle: splitLineStyle
        }
      }
    };
  }

  return {
    grid,
    xAxis: {
      type: "value",
      min: parseOptionalNumber(commonValues.xMin),
      max: parseOptionalNumber(commonValues.xMax),
      axisLine: {
        show: commonValues.xAxisLineShow !== false,
        lineStyle: { color: normalizeColor(commonValues.xAxisLineColor, "#9ca3af") }
      },
      axisTick: {
        show: commonValues.xAxisTickShow !== false
      },
      axisLabel: {
        color: normalizeColor(commonValues.xAxisLabelColor, "#4b5563"),
        fontSize: parseNumber(commonValues.xAxisLabelFontSize, 11),
        formatter: commonValues.xFormatter || "{value}"
      },
      splitLine: {
        show: Boolean(commonValues.splitLineShow),
        lineStyle: splitLineStyle
      }
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLine: {
        show: commonValues.yAxisLineShow === true,
        lineStyle: { color: normalizeColor(commonValues.yAxisLineColor, "#9ca3af") }
      },
      axisTick: {
        show: commonValues.yAxisTickShow !== false
      },
      axisLabel: {
        color: normalizeColor(commonValues.yAxisLabelColor, "#4b5563"),
        fontSize: parseNumber(commonValues.yAxisLabelFontSize, 11),
        formatter: commonValues.yFormatter || "{value}"
      }
    }
  };
}

function buildLineOption(commonValues, specificValues, isArea) {
  const categories = isArea ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const base = getBaseOption(commonValues, true);
  const cartesian = getCartesianBase(commonValues, categories, false);
  const palette = parsePalette(commonValues.palette);
  const label = {
    show: Boolean(specificValues.showLabel),
    color: normalizeColor(specificValues.labelColor, "#334155"),
    fontSize: parseNumber(specificValues.labelFontSize, 10)
  };
  const areaOpacity = parseNumber(specificValues.areaOpacity, 0.24);

  return {
    ...base,
    ...cartesian,
    tooltip: { trigger: "axis" },
    series: [
      {
        name: isArea ? "Signups" : "Visits",
        type: "line",
        smooth: Boolean(specificValues.smooth),
        showSymbol: specificValues.showSymbol !== false,
        connectNulls: Boolean(specificValues.connectNulls),
        symbol: specificValues.symbol || "circle",
        symbolSize: parseNumber(specificValues.symbolSize, isArea ? 4 : 5),
        lineStyle: {
          type: specificValues.lineStyleType || "solid",
          width: parseNumber(specificValues.lineWidth, isArea ? 2 : 3)
        },
        label,
        areaStyle: isArea
          ? (
              specificValues.areaFillMode === "solid"
                ? { opacity: areaOpacity }
                : {
                    color: {
                      type: "linear",
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: rgba(palette[0], areaOpacity) },
                        { offset: 1, color: rgba(palette[0], 0.04) }
                      ]
                    }
                  }
            )
          : undefined,
        data: isArea ? [120, 182, 191, 234, 290, 330] : [120, 132, 101, 134, 90, 230]
      },
      {
        name: isArea ? "Active" : "Orders",
        type: "line",
        smooth: Boolean(specificValues.smooth),
        showSymbol: specificValues.showSymbol !== false,
        connectNulls: Boolean(specificValues.connectNulls),
        symbol: specificValues.symbol || "circle",
        symbolSize: parseNumber(specificValues.symbolSize, isArea ? 4 : 5),
        lineStyle: {
          type: specificValues.lineStyleType || "solid",
          width: Math.max(1, parseNumber(specificValues.lineWidth, isArea ? 2 : 3) - 0.2)
        },
        label: {
          ...label,
          show: false
        },
        areaStyle: isArea
          ? (
              specificValues.areaFillMode === "solid"
                ? { opacity: Math.max(0.05, areaOpacity - 0.08) }
                : {
                    color: {
                      type: "linear",
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: rgba(palette[1] || palette[0], Math.max(0.05, areaOpacity - 0.08)) },
                        { offset: 1, color: rgba(palette[1] || palette[0], 0.04) }
                      ]
                    }
                  }
            )
          : undefined,
        data: isArea ? [80, 132, 151, 174, 220, 260] : [32, 41, 38, 52, 49, 68]
      }
    ]
  };
}

function buildBarOption(commonValues, specificValues) {
  const categories = ["Q1", "Q2", "Q3", "Q4"];
  const base = getBaseOption(commonValues, true);
  const cartesian = getCartesianBase(commonValues, categories, false);
  const label = {
    show: Boolean(specificValues.showLabel),
    position: specificValues.labelPosition || "top",
    color: normalizeColor(specificValues.labelColor, "#334155"),
    fontSize: parseNumber(specificValues.labelFontSize, 10)
  };
  const itemStyle = {
    opacity: parseNumber(specificValues.itemOpacity, 0.92),
    borderRadius: parseNumber(specificValues.borderRadius, 0),
    borderWidth: parseNumber(specificValues.borderWidth, 0),
    borderColor: normalizeColor(specificValues.borderColor, "#ffffff")
  };
  return {
    ...base,
    ...cartesian,
    tooltip: { trigger: "axis" },
    series: [
      {
        name: "Revenue",
        type: "bar",
        barGap: specificValues.barGap || "10%",
        label,
        itemStyle,
        data: [320, 410, 505, 620]
      },
      {
        name: "Cost",
        type: "bar",
        barGap: specificValues.barGap || "10%",
        label,
        itemStyle,
        data: [180, 240, 290, 330]
      }
    ]
  };
}

function buildScatterOption(commonValues, specificValues) {
  const base = getBaseOption(commonValues, true);
  return {
    ...base,
    grid: {
      left: parsePercent(commonValues.gridLeft, "12%"),
      right: parsePercent(commonValues.gridRight, "9%"),
      top: parsePercent(commonValues.gridTop, "21%"),
      bottom: parsePercent(commonValues.gridBottom, "15%"),
      containLabel: true
    },
    tooltip: { trigger: "item" },
    xAxis: {
      type: "value",
      min: parseOptionalNumber(commonValues.xMin),
      max: parseOptionalNumber(commonValues.xMax),
      axisLine: {
        show: commonValues.xAxisLineShow !== false,
        lineStyle: { color: normalizeColor(commonValues.xAxisLineColor, "#9ca3af") }
      },
      axisTick: {
        show: commonValues.xAxisTickShow !== false
      },
      axisLabel: {
        color: normalizeColor(commonValues.xAxisLabelColor, "#4b5563"),
        fontSize: parseNumber(commonValues.xAxisLabelFontSize, 11),
        formatter: commonValues.xFormatter || "{value}"
      },
      splitLine: {
        show: Boolean(commonValues.xSplitLineShow),
        lineStyle: {
          color: normalizeColor(commonValues.xSplitLineColor, "#e5e7eb"),
          type: commonValues.xSplitLineType === "--" ? "dashed" : (commonValues.xSplitLineType || "dashed"),
          width: parseNumber(commonValues.xSplitLineWidth, 1)
        }
      }
    },
    yAxis: {
      type: "value",
      min: parseOptionalNumber(commonValues.yMin),
      max: parseOptionalNumber(commonValues.yMax),
      axisLine: {
        show: commonValues.yAxisLineShow === true,
        lineStyle: { color: normalizeColor(commonValues.yAxisLineColor, "#9ca3af") }
      },
      axisTick: {
        show: commonValues.yAxisTickShow !== false
      },
      axisLabel: {
        color: normalizeColor(commonValues.yAxisLabelColor, "#4b5563"),
        fontSize: parseNumber(commonValues.yAxisLabelFontSize, 11),
        formatter: commonValues.yFormatter || "{value}"
      },
      splitLine: {
        show: Boolean(commonValues.splitLineShow),
        lineStyle: {
          color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
          type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
          width: parseNumber(commonValues.splitLineWidth, 1)
        }
      }
    },
    series: [
      {
        name: "North",
        type: "scatter",
        symbol: specificValues.symbol || "circle",
        symbolSize: parseNumber(specificValues.symbolSize, 64),
        itemStyle: {
          opacity: parseNumber(specificValues.itemOpacity, 0.92),
          borderWidth: parseNumber(specificValues.borderWidth, 0),
          borderColor: normalizeColor(specificValues.borderColor, "#ffffff")
        },
        label: {
          show: Boolean(specificValues.showLabel),
          color: normalizeColor(specificValues.labelColor, "#334155"),
          fontSize: parseNumber(specificValues.labelFontSize, 10),
          formatter: ({ value }) => `${value[0]}, ${value[1]}`
        },
        data: [[10, 18], [14, 22], [18, 28], [22, 34]]
      },
      {
        name: "South",
        type: "scatter",
        symbol: specificValues.symbol || "circle",
        symbolSize: parseNumber(specificValues.symbolSize, 64),
        itemStyle: {
          opacity: parseNumber(specificValues.itemOpacity, 0.92),
          borderWidth: parseNumber(specificValues.borderWidth, 0),
          borderColor: normalizeColor(specificValues.borderColor, "#ffffff")
        },
        data: [[9, 12], [13, 17], [20, 25], [26, 31]]
      }
    ]
  };
}

function buildPieOption(commonValues, specificValues) {
  const base = getBaseOption(commonValues, true);
  return {
    ...base,
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Channels",
        type: "pie",
        radius: ["42%", "70%"],
        center: ["50%", "56%"],
        startAngle: parseNumber(specificValues.startAngle, 90),
        label: {
          show: Boolean(specificValues.showLabel),
          position: specificValues.labelPosition || "outside",
          color: normalizeColor(specificValues.labelColor, "#334155"),
          fontSize: parseNumber(specificValues.labelFontSize, 11),
          formatter: specificValues.labelFormatter || "{b} {d}%"
        },
        labelLine: {
          show: Boolean(specificValues.labelLineShow),
          lineStyle: {
            color: normalizeColor(specificValues.labelLineColor, "#94a3b8"),
            width: parseNumber(specificValues.labelLineWidth, 0.8)
          }
        },
        itemStyle: {
          opacity: parseNumber(specificValues.itemOpacity, 0.96),
          borderWidth: parseNumber(specificValues.borderWidth, 0),
          borderColor: normalizeColor(specificValues.borderColor, "#ffffff")
        },
        data: [
          { name: "Search", value: 1048 },
          { name: "Email", value: 735 },
          { name: "Direct", value: 580 },
          { name: "Ads", value: 484 },
          { name: "Video", value: 300 }
        ]
      }
    ]
  };
}

function buildGaugeOption(commonValues, specificValues) {
  const base = getBaseOption(commonValues, false);
  const bandColors = parsePalette(specificValues.bandStops);
  const stopStep = 1 / bandColors.length;
  return {
    ...base,
    tooltip: { trigger: "item" },
    series: [
      {
        type: "gauge",
        min: 0,
        max: 100,
        startAngle: parseNumber(specificValues.startAngle, 225),
        endAngle: parseNumber(specificValues.endAngle, -45),
        progress: {
          show: Boolean(specificValues.progressShow),
          width: parseNumber(specificValues.progressWidth, 20),
          itemStyle: {
            color: normalizeColor(specificValues.progressColor, "#5470c6")
          }
        },
        axisLine: {
          lineStyle: {
            width: parseNumber(specificValues.axisWidth, 20),
            color: bandColors.map((color, index) => [stopStep * (index + 1), color])
          }
        },
        axisLabel: {
          show: Boolean(specificValues.axisLabelShow),
          distance: parseNumber(specificValues.axisLabelDistance, 25),
          fontSize: parseNumber(specificValues.axisLabelFontSize, 10),
          color: normalizeColor(specificValues.axisLabelColor, "#6e7079")
        },
        splitLine: {
          show: Boolean(specificValues.splitLineShow),
          distance: -parseNumber(specificValues.axisWidth, 20),
          length: parseNumber(specificValues.splitLineLength, 12),
          lineStyle: {
            width: parseNumber(specificValues.splitLineWidth, 2),
            color: normalizeColor(specificValues.splitLineColor, "#6e7079")
          }
        },
        axisTick: {
          show: Boolean(specificValues.axisTickShow),
          distance: -parseNumber(specificValues.axisWidth, 20) / 2,
          length: parseNumber(specificValues.axisTickLength, 6),
          lineStyle: {
            width: parseNumber(specificValues.axisTickWidth, 1),
            color: normalizeColor(specificValues.axisTickColor, "#999999")
          }
        },
        pointer: {
          show: Boolean(specificValues.pointerShow),
          width: parseNumber(specificValues.pointerWidth, 4),
          itemStyle: {
            color: normalizeColor(specificValues.pointerColor, "#2f4554")
          }
        },
        anchor: {
          show: Boolean(specificValues.anchorShow),
          size: parseNumber(specificValues.anchorSize, 20),
          itemStyle: {
            color: normalizeColor(specificValues.anchorColor, "#2f4554")
          }
        },
        title: {
          show: Boolean(specificValues.titleShow),
          fontSize: parseNumber(specificValues.titleFontSize, 12),
          color: normalizeColor(specificValues.titleColor, "#6e7079"),
          offsetCenter: [0, "34%"]
        },
        detail: {
          show: Boolean(specificValues.detailShow),
          fontSize: parseNumber(specificValues.detailFontSize, 22),
          color: normalizeColor(specificValues.detailColor, "#464646"),
          formatter: specificValues.detailFormatter || "{value}%",
          offsetCenter: [0, "6%"]
        },
        data: [{ value: 68, name: "Completion" }]
      }
    ]
  };
}

function buildRadarOption(commonValues, specificValues) {
  const base = getBaseOption(commonValues, true);
  return {
    ...base,
    tooltip: { trigger: "item" },
    radar: {
      shape: specificValues.shape || "polygon",
      splitNumber: parseNumber(specificValues.splitNumber, 5),
      indicator: [
        { name: "Quality", max: 100 },
        { name: "Speed", max: 100 },
        { name: "Cost", max: 100 },
        { name: "Scale", max: 100 },
        { name: "Satisfaction", max: 100 }
      ],
      splitLine: {
        lineStyle: {
          color: normalizeColor(specificValues.splitLineColor, "#d0d7de"),
          type: specificValues.splitLineType || "solid",
          width: parseNumber(specificValues.splitLineWidth, 0.8)
        }
      },
      axisLine: {
        lineStyle: {
          color: normalizeColor(specificValues.axisLineColor, "#94a3b8"),
          type: specificValues.axisLineType || "solid",
          width: parseNumber(specificValues.axisLineWidth, 1)
        }
      },
      axisName: {
        color: normalizeColor(specificValues.axisNameColor, "#334155"),
        fontSize: parseNumber(specificValues.axisNameFontSize, 11),
        fontWeight: specificValues.axisNameBold ? "700" : "500"
      }
    },
    series: [
      {
        type: "radar",
        symbol: specificValues.symbol || "circle",
        symbolSize: parseNumber(specificValues.symbolSize, 5),
        lineStyle: {
          type: specificValues.lineStyleType || "solid",
          width: parseNumber(specificValues.lineWidth, 2.4)
        },
        areaStyle: {
          opacity: parseNumber(specificValues.areaOpacity, 0.18)
        },
        label: {
          show: Boolean(specificValues.showLabel),
          formatter: specificValues.labelFormatter || "{b}: {c}",
          color: normalizeColor(specificValues.labelColor, "#334155"),
          fontSize: parseNumber(specificValues.labelFontSize, 10)
        },
        data: [
          { value: [90, 82, 70, 88, 91], name: "Team A" },
          { value: [76, 90, 82, 72, 84], name: "Team B" }
        ]
      }
    ]
  };
}

function buildFunnelOption(commonValues, specificValues) {
  const base = getBaseOption(commonValues, true);
  return {
    ...base,
    tooltip: { trigger: "item" },
    series: [
      {
        type: "funnel",
        sort: specificValues.sort || "descending",
        gap: parseNumber(specificValues.gap, 4),
        minSize: specificValues.minSize || "20%",
        maxSize: specificValues.maxSize || "80%",
        left: "12%",
        width: "76%",
        top: "18%",
        height: "66%",
        label: {
          show: Boolean(specificValues.showLabel),
          position: specificValues.labelPosition || "outside",
          formatter: specificValues.labelFormatter || "{b}: {c}",
          color: normalizeColor(specificValues.labelColor, "#334155"),
          fontSize: parseNumber(specificValues.labelFontSize, 10)
        },
        itemStyle: {
          opacity: parseNumber(specificValues.itemOpacity, 0.92)
        },
        data: [
          { value: 1000, name: "Visit" },
          { value: 600, name: "Sign Up" },
          { value: 320, name: "Qualified" },
          { value: 180, name: "Proposal" },
          { value: 96, name: "Won" }
        ]
      }
    ]
  };
}

function buildDualAxisOption(commonValues, specificValues) {
  const horizontal = Boolean(specificValues.horizontal);
  const base = getBaseOption(commonValues, true);
  const categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const grid = {
    left: parsePercent(commonValues.gridLeft, horizontal ? "16%" : "12%"),
    right: parsePercent(commonValues.gridRight, "12%"),
    top: parsePercent(commonValues.gridTop, "21%"),
    bottom: parsePercent(commonValues.gridBottom, "15%"),
    containLabel: true
  };
  const followRight = specificValues.splitLineFollowAxis === "right";

  if (!horizontal) {
    return {
      ...base,
      grid,
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: {
          show: commonValues.xAxisLineShow !== false,
          lineStyle: { color: normalizeColor(commonValues.xAxisLineColor, "#9ca3af") }
        },
        axisTick: {
          show: commonValues.xAxisTickShow !== false
        },
        axisLabel: {
          color: normalizeColor(commonValues.xAxisLabelColor, "#4b5563"),
          fontSize: parseNumber(commonValues.xAxisLabelFontSize, 11),
          rotate: parseNumber(commonValues.xRotate, 0),
          formatter: commonValues.xFormatter || "{value}"
        }
      },
      yAxis: [
        {
          type: "value",
          position: "left",
          min: parseOptionalNumber(specificValues.leftAxisMin),
          max: parseOptionalNumber(specificValues.leftAxisMax),
          axisLine: {
            show: specificValues.leftAxisLineShow !== false,
            lineStyle: { color: normalizeColor(specificValues.leftAxisLineColor, "#9ca3af") }
          },
          axisTick: { show: specificValues.leftAxisTickShow !== false },
          axisLabel: {
            color: normalizeColor(specificValues.leftAxisLabelColor, "#9ca3af"),
            fontSize: parseNumber(specificValues.leftAxisLabelFontSize, 11),
            formatter: specificValues.leftAxisFormatter || "{value}"
          },
          splitLine: {
            show: !followRight && Boolean(commonValues.splitLineShow),
            lineStyle: {
              color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
              type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
              width: parseNumber(commonValues.splitLineWidth, 1)
            }
          }
        },
        {
          type: "value",
          position: "right",
          min: parseOptionalNumber(specificValues.rightAxisMin),
          max: parseOptionalNumber(specificValues.rightAxisMax),
          axisLine: {
            show: specificValues.rightAxisLineShow !== false,
            lineStyle: { color: normalizeColor(specificValues.rightAxisLineColor, "#9ca3af") }
          },
          axisTick: { show: specificValues.rightAxisTickShow !== false },
          axisLabel: {
            color: normalizeColor(specificValues.rightAxisLabelColor, "#9ca3af"),
            fontSize: parseNumber(specificValues.rightAxisLabelFontSize, 11),
            formatter: specificValues.rightAxisFormatter || "{value}"
          },
          splitLine: {
            show: followRight && Boolean(commonValues.splitLineShow),
            lineStyle: {
              color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
              type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
              width: parseNumber(commonValues.splitLineWidth, 1)
            }
          }
        }
      ],
      series: [
        {
          name: "Sales",
          type: "bar",
          yAxisIndex: 0,
          barGap: specificValues.leftBarGap || "10%",
          label: {
            show: Boolean(specificValues.leftBarShowLabel),
            position: specificValues.leftBarLabelPosition || "top",
            color: normalizeColor(specificValues.leftBarLabelColor, "#334155"),
            fontSize: parseNumber(specificValues.leftBarLabelFontSize, 10)
          },
          itemStyle: {
            opacity: parseNumber(specificValues.leftBarOpacity, 0.92),
            borderRadius: parseNumber(specificValues.leftBarBorderRadius, 0),
            borderWidth: parseNumber(specificValues.leftBarBorderWidth, 0),
            borderColor: normalizeColor(specificValues.leftBarBorderColor, "#ffffff")
          },
          data: [320, 332, 301, 334, 390, 330]
        },
        {
          name: "Orders",
          type: "bar",
          yAxisIndex: 0,
          barGap: specificValues.rightBarGap || "10%",
          label: {
            show: Boolean(specificValues.rightBarShowLabel),
            position: specificValues.rightBarLabelPosition || "top",
            color: normalizeColor(specificValues.rightBarLabelColor, "#334155"),
            fontSize: parseNumber(specificValues.rightBarLabelFontSize, 10)
          },
          itemStyle: {
            opacity: parseNumber(specificValues.rightBarOpacity, 0.92),
            borderRadius: parseNumber(specificValues.rightBarBorderRadius, 0),
            borderWidth: parseNumber(specificValues.rightBarBorderWidth, 0),
            borderColor: normalizeColor(specificValues.rightBarBorderColor, "#ffffff")
          },
          data: [210, 226, 198, 245, 278, 256]
        },
        {
          name: "Rate",
          type: "line",
          yAxisIndex: 1,
          smooth: Boolean(specificValues.rightLineSmooth),
          showSymbol: specificValues.rightLineShowSymbol !== false,
          connectNulls: Boolean(specificValues.rightLineConnectNulls),
          symbol: specificValues.rightLineSymbol || "circle",
          symbolSize: parseNumber(specificValues.rightLineSymbolSize, 5),
          lineStyle: {
            type: specificValues.rightLineStyleType || "solid",
            width: parseNumber(specificValues.rightLineWidth, 3)
          },
          label: {
            show: Boolean(specificValues.rightLineShowLabel),
            color: normalizeColor(specificValues.rightLineLabelColor, "#334155"),
            fontSize: parseNumber(specificValues.rightLineLabelFontSize, 10)
          },
          data: [10, 12, 9, 14, 18, 16]
        }
      ]
    };
  }

  return {
    ...base,
    grid,
    tooltip: { trigger: "axis" },
    xAxis: [
      {
        type: "value",
        min: parseOptionalNumber(specificValues.leftAxisMin),
        max: parseOptionalNumber(specificValues.leftAxisMax),
        axisLine: {
          show: specificValues.leftAxisLineShow !== false,
          lineStyle: { color: normalizeColor(specificValues.leftAxisLineColor, "#9ca3af") }
        },
        axisTick: { show: specificValues.leftAxisTickShow !== false },
        axisLabel: {
          color: normalizeColor(specificValues.leftAxisLabelColor, "#9ca3af"),
          fontSize: parseNumber(specificValues.leftAxisLabelFontSize, 11),
          formatter: specificValues.leftAxisFormatter || "{value}"
        },
        splitLine: {
          show: !followRight && Boolean(commonValues.splitLineShow),
          lineStyle: {
            color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
            type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
            width: parseNumber(commonValues.splitLineWidth, 1)
          }
        }
      },
      {
        type: "value",
        min: parseOptionalNumber(specificValues.rightAxisMin),
        max: parseOptionalNumber(specificValues.rightAxisMax),
        axisLine: {
          show: specificValues.rightAxisLineShow !== false,
          lineStyle: { color: normalizeColor(specificValues.rightAxisLineColor, "#9ca3af") }
        },
        axisTick: { show: specificValues.rightAxisTickShow !== false },
        axisLabel: {
          color: normalizeColor(specificValues.rightAxisLabelColor, "#9ca3af"),
          fontSize: parseNumber(specificValues.rightAxisLabelFontSize, 11),
          formatter: specificValues.rightAxisFormatter || "{value}"
        },
        splitLine: {
          show: followRight && Boolean(commonValues.splitLineShow),
          lineStyle: {
            color: normalizeColor(commonValues.splitLineColor, "#e5e7eb"),
            type: commonValues.splitLineType === "--" ? "dashed" : (commonValues.splitLineType || "dashed"),
            width: parseNumber(commonValues.splitLineWidth, 1)
          }
        }
      }
    ],
    yAxis: {
      type: "category",
      data: categories,
      axisLine: {
        show: commonValues.yAxisLineShow === true,
        lineStyle: { color: normalizeColor(commonValues.yAxisLineColor, "#9ca3af") }
      },
      axisTick: {
        show: commonValues.yAxisTickShow !== false
      },
      axisLabel: {
        color: normalizeColor(commonValues.yAxisLabelColor, "#4b5563"),
        fontSize: parseNumber(commonValues.yAxisLabelFontSize, 11),
        formatter: commonValues.yFormatter || "{value}"
      }
    },
    series: [
      {
        name: "Sales",
        type: "bar",
        xAxisIndex: 0,
        label: {
          show: Boolean(specificValues.leftBarShowLabel),
          position: "right",
          color: normalizeColor(specificValues.leftBarLabelColor, "#334155"),
          fontSize: parseNumber(specificValues.leftBarLabelFontSize, 10)
        },
        itemStyle: {
          opacity: parseNumber(specificValues.leftBarOpacity, 0.92),
          borderRadius: parseNumber(specificValues.leftBarBorderRadius, 0)
        },
        data: [320, 332, 301, 334, 390, 330]
      },
      {
        name: "Orders",
        type: "bar",
        xAxisIndex: 0,
        label: {
          show: Boolean(specificValues.rightBarShowLabel),
          position: "right",
          color: normalizeColor(specificValues.rightBarLabelColor, "#334155"),
          fontSize: parseNumber(specificValues.rightBarLabelFontSize, 10)
        },
        itemStyle: {
          opacity: parseNumber(specificValues.rightBarOpacity, 0.92),
          borderRadius: parseNumber(specificValues.rightBarBorderRadius, 0)
        },
        data: [210, 226, 198, 245, 278, 256]
      },
      {
        name: "Rate",
        type: "line",
        xAxisIndex: 1,
        smooth: Boolean(specificValues.rightLineSmooth),
        showSymbol: specificValues.rightLineShowSymbol !== false,
        symbol: specificValues.rightLineSymbol || "circle",
        symbolSize: parseNumber(specificValues.rightLineSymbolSize, 5),
        lineStyle: {
          type: specificValues.rightLineStyleType || "solid",
          width: parseNumber(specificValues.rightLineWidth, 3)
        },
        data: [10, 12, 9, 14, 18, 16]
      }
    ]
  };
}

function buildPreviewOption(chartType, commonValues, specificValues) {
  if (chartType === "line") {
    return buildLineOption(commonValues, specificValues, false);
  }
  if (chartType === "area") {
    return buildLineOption(commonValues, specificValues, true);
  }
  if (chartType === "bar") {
    return buildBarOption(commonValues, specificValues);
  }
  if (chartType === "scatter") {
    return buildScatterOption(commonValues, specificValues);
  }
  if (chartType === "dualAxis") {
    return buildDualAxisOption(commonValues, specificValues);
  }
  if (chartType === "pie") {
    return buildPieOption(commonValues, specificValues);
  }
  if (chartType === "gauge") {
    return buildGaugeOption(commonValues, specificValues);
  }
  if (chartType === "radar") {
    return buildRadarOption(commonValues, specificValues);
  }
  if (chartType === "funnel") {
    return buildFunnelOption(commonValues, specificValues);
  }
  return getBaseOption(commonValues, true);
}

module.exports = {
  buildPreviewOption
};
