(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.DataChartsDefaultData = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function deepClone(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  const DEFAULT_DATA_BY_CHART = {
    line: {
      xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
      yAxis: {},
      series: [
        { type: "line", name: "Visits", data: [120, 132, 101, 134, 90, 230] },
        { type: "line", name: "Orders", data: [32, 41, 38, 52, 49, 68] },
        { type: "line", name: "Leads", data: [64, 78, 72, 91, 88, 110] },
        { type: "line", name: "Signups", data: [28, 35, 33, 40, 44, 58] },
        { type: "line", name: "Revenue", data: [180, 210, 198, 242, 268, 320] },
        { type: "line", name: "Retention", data: [72, 74, 73, 76, 77, 79] },
        { type: "line", name: "Conversion", data: [12, 14, 13, 15, 17, 18] },
        { type: "line", name: "Satisfaction", data: [84, 82, 85, 87, 88, 90] },
      ],
    },
    bar: {
      xAxis: { data: ["Q1", "Q2", "Q3", "Q4"] },
      yAxis: {},
      series: [
        { type: "bar", name: "Revenue", data: [320, 410, 505, 620] },
        { type: "bar", name: "Cost", data: [180, 240, 290, 330] },
        { type: "bar", name: "Profit", data: [140, 170, 215, 290] },
        { type: "bar", name: "Orders", data: [210, 260, 298, 342] },
        { type: "bar", name: "Units", data: [420, 480, 530, 610] },
        { type: "bar", name: "Returns", data: [22, 26, 31, 28] },
        { type: "bar", name: "CAC", data: [66, 62, 58, 54] },
        { type: "bar", name: "LTV", data: [210, 228, 242, 268] },
      ],
    },
    area: {
      xAxis: { data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      yAxis: {},
      series: [
        { type: "line", name: "Signups", data: [120, 182, 191, 234, 290, 330] },
        { type: "line", name: "Active", data: [80, 132, 151, 174, 220, 260] },
        { type: "line", name: "Returning", data: [58, 76, 88, 95, 108, 126] },
        { type: "line", name: "New Users", data: [64, 92, 101, 126, 152, 178] },
        { type: "line", name: "Engaged", data: [44, 61, 74, 83, 95, 108] },
        { type: "line", name: "Subscribers", data: [30, 44, 55, 70, 86, 98] },
        { type: "line", name: "Referrals", data: [22, 31, 36, 42, 48, 56] },
        { type: "line", name: "Churn Recovery", data: [14, 19, 24, 28, 34, 39] },
      ],
    },
    dualAxis: {
      xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
      yAxis: [{ name: "Volume" }, { name: "Rate" }],
      series: [
        { type: "bar", name: "Sales", yAxisIndex: 0, data: [320, 332, 301, 334, 390, 330] },
        { type: "line", name: "Rate", yAxisIndex: 1, data: [10, 12, 9, 14, 18, 16] },
        { type: "bar", name: "Orders", yAxisIndex: 0, data: [210, 226, 198, 245, 278, 256] },
        { type: "line", name: "Conversion", yAxisIndex: 1, data: [7, 8, 7, 9, 11, 10] },
        { type: "bar", name: "Visits", yAxisIndex: 0, data: [420, 448, 430, 476, 512, 498] },
        { type: "line", name: "Refund Rate", yAxisIndex: 1, data: [3, 4, 3, 5, 4, 4] },
        { type: "bar", name: "Leads", yAxisIndex: 0, data: [132, 144, 138, 152, 168, 174] },
        { type: "line", name: "CTR", yAxisIndex: 1, data: [16, 18, 17, 19, 22, 21] },
      ],
    },
    scatter: {
      xAxis: { type: "value", name: "Spend" },
      yAxis: { type: "value", name: "Revenue" },
      series: [
        { type: "scatter", name: "North", data: [[10, 18], [14, 22], [18, 28], [22, 34]] },
        { type: "scatter", name: "South", data: [[9, 12], [13, 17], [20, 25], [26, 31]] },
        { type: "scatter", name: "East", data: [[12, 16], [16, 24], [21, 29], [27, 35]] },
        { type: "scatter", name: "West", data: [[8, 11], [12, 15], [17, 21], [24, 28]] },
        { type: "scatter", name: "Retail", data: [[15, 20], [19, 26], [24, 31], [29, 38]] },
        { type: "scatter", name: "Online", data: [[11, 19], [15, 25], [22, 33], [28, 40]] },
        { type: "scatter", name: "SMB", data: [[7, 10], [10, 14], [14, 19], [18, 24]] },
        { type: "scatter", name: "Enterprise", data: [[20, 30], [24, 36], [29, 42], [34, 50]] },
      ],
    },
    pie: {
      series: [
        {
          type: "pie",
          data: [
            { name: "Search", value: 1048 },
            { name: "Email", value: 735 },
            { name: "Direct", value: 580 },
            { name: "Ads", value: 484 },
            { name: "Video", value: 300 },
          ],
        },
      ],
    },
    gauge: {
      series: [
        {
          type: "gauge",
          data: [{ value: 68, name: "Completion" }],
        },
      ],
    },
    radar: {
      radar: {
        indicator: [
          { name: "Quality", max: 100 },
          { name: "Speed", max: 100 },
          { name: "Cost", max: 100 },
          { name: "Scale", max: 100 },
          { name: "Satisfaction", max: 100 },
        ],
      },
      series: [
        {
          type: "radar",
          data: [
            { name: "Team A", value: [90, 82, 70, 88, 91] },
            { name: "Team B", value: [76, 90, 82, 72, 84] },
          ],
        },
      ],
    },
    funnel: {
      series: [
        {
          type: "funnel",
          data: [
            { name: "Visit", value: 1000 },
            { name: "Sign Up", value: 600 },
            { name: "Qualified", value: 320 },
            { name: "Proposal", value: 180 },
            { name: "Won", value: 96 },
          ],
        },
      ],
    },
  };

  function getDefaultRawData(chartType) {
    return deepClone(DEFAULT_DATA_BY_CHART[chartType] || {});
  }

  return {
    DEFAULT_DATA_BY_CHART,
    getDefaultRawData,
  };
});
