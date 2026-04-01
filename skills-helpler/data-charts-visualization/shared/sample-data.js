module.exports = {
  line: {
    xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
    yAxis: {},
    series: [
      { type: "line", name: "Visits", data: [120, 132, 101, 134, 90, 230] },
      { type: "line", name: "Orders", data: [32, 41, 38, 52, 49, 68] }
    ]
  },
  bar: {
    xAxis: { data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: {},
    series: [
      { type: "bar", name: "Revenue", data: [320, 410, 505, 620] },
      { type: "bar", name: "Cost", data: [180, 240, 290, 330] }
    ]
  },
  area: {
    xAxis: { data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
    yAxis: {},
    series: [
      { type: "line", name: "Signups", data: [120, 182, 191, 234, 290, 330] },
      { type: "line", name: "Active", data: [80, 132, 151, 174, 220, 260] }
    ]
  },
  dualAxis: {
    xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
    yAxis: [{ name: "Volume" }, { name: "Rate" }],
    series: [
      { type: "bar", name: "Sales", yAxisIndex: 0, data: [320, 332, 301, 334, 390, 330] },
      { type: "bar", name: "Orders", yAxisIndex: 0, data: [210, 226, 198, 245, 278, 256] },
      { type: "line", name: "Rate", yAxisIndex: 1, data: [10, 12, 9, 14, 18, 16] }
    ]
  },
  scatter: {
    xAxis: { type: "value", name: "Spend" },
    yAxis: { type: "value", name: "Revenue" },
    series: [
      { type: "scatter", name: "North", data: [[10, 18], [14, 22], [18, 28], [22, 34]] },
      { type: "scatter", name: "South", data: [[9, 12], [13, 17], [20, 25], [26, 31]] }
    ]
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
          { name: "Video", value: 300 }
        ]
      }
    ]
  },
  gauge: {
    series: [
      {
        type: "gauge",
        data: [{ value: 68, name: "Completion" }]
      }
    ]
  },
  radar: {
    radar: {
      indicator: [
        { name: "Quality", max: 100 },
        { name: "Speed", max: 100 },
        { name: "Cost", max: 100 },
        { name: "Scale", max: 100 },
        { name: "Satisfaction", max: 100 }
      ]
    },
    series: [
      {
        type: "radar",
        data: [
          { name: "Team A", value: [90, 82, 70, 88, 91] },
          { name: "Team B", value: [76, 90, 82, 72, 84] }
        ]
      }
    ]
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
          { name: "Won", value: 96 }
        ]
      }
    ]
  }
};
