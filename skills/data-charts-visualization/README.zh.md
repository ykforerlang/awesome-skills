# Data Charts Visualization

使用 Python + Matplotlib，把 ECharts 风格的 `option` 直接渲染成高质量静态图表。

[English README](./README.md)

这个 skill 面向真实的 agent 工作流设计：既要出图快，也要配置稳定、结构清晰、方便复用。它覆盖了常见业务图表类型，尽量对齐 ECharts 的配置方式，并通过可复用样式配置让整套图表输出保持统一视觉风格。

## 为什么用这个 Skill

- 图形覆盖完整：折线图、柱状图、饼图、环形图、南丁格尔玫瑰图、仪表盘、面积图、双轴图、散点图、气泡图、雷达图、漏斗图。
- 配置方式贴近 ECharts：如果你的数据结构、既有配置或提示词已经面向 ECharts，迁移成本很低。
- 单图单配置：每一种图表类型只维护一个持久化样式文件，放在 `config/*.json` 中。
- 支持多种数据输入：普通数组、对象数组、`dataset.source`、`series.encode` 都能直接用。
- 渲染结果可回归验证：每类图都有 golden-image 测试覆盖，不是只校验 JSON 能不能解析。

## 支持的图形

<table>
  <tr>
    <td align="center" width="33%">
      <strong>折线图</strong><br/>
      <img src="./static/line.png" alt="折线图" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>柱状图</strong><br/>
      <img src="./static/bar.png" alt="柱状图" width="260"/>
    </td>
    <td align="center" width="33%">
      <strong>饼图</strong><br/>
      <img src="./static/pie-basic.png" alt="饼图" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>环形图</strong><br/>
      <img src="./static/donut.png" alt="环形图" width="260"/>
    </td>
    <td align="center">
      <strong>南丁格尔玫瑰图</strong><br/>
      <img src="./static/rose.png" alt="南丁格尔玫瑰图" width="260"/>
    </td>
    <td align="center">
      <strong>仪表盘</strong><br/>
      <img src="./static/gauge.png" alt="仪表盘" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>面积图</strong><br/>
      <img src="./static/area.png" alt="面积图" width="260"/>
    </td>
    <td align="center">
      <strong>双轴图</strong><br/>
      <img src="./static/dual-axis.png" alt="双轴图" width="260"/>
    </td>
    <td align="center">
      <strong>散点图</strong><br/>
      <img src="./static/scatter-basic.png" alt="散点图" width="260"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>气泡图</strong><br/>
      <img src="./static/bubble.png" alt="气泡图" width="260"/>
    </td>
    <td align="center">
      <strong>雷达图</strong><br/>
      <img src="./static/radar.png" alt="雷达图" width="260"/>
    </td>
    <td align="center">
      <strong>漏斗图</strong><br/>
      <img src="./static/funnel.png" alt="漏斗图" width="260"/>
    </td>
  </tr>
</table>

## 核心能力

这个 skill 不是只能画“最简单的一张图”，而是已经覆盖了 ECharts 常用图表能力里最常见、最有业务价值的一批场景：

- 多 series、多图形混排、分组柱状、堆叠柱状、堆叠面积。
- 基于 `dataset.source` 和 `series.encode` 的数据驱动图表，包括二维数组表头写法。
- 常见静态样式配置：图例布局、调色板、标签、坐标轴格式化、网格布局、背景色。
- 折线图和面积图能力：`smooth`、`step`、`showSymbol`、`null` 断点、`connectNulls`。
- 饼图家族能力：饼图、环形图、玫瑰图、标签内外布局、selected 偏移、起始角度、配色覆盖。
- 仪表盘能力：分段轴线、progress 弧、起止角、自定义范围、指针样式、detail 格式化。
- 双轴图能力：双轴映射、柱线混合、横向双轴、负值、次轴面积线。
- 散点图、气泡图、雷达图、漏斗图能力：气泡尺寸、split area、itemStyle 细节、排序、尺寸和间距控制。

## 配置模型

配置方式刻意保持简单，适合长期维护：

1. 在 `option` 中描述图表数据和基础结构。
2. 在对应的 `config/<chart>_style.json` 中沉淀该图形的可复用视觉规范。
3. 在渲染命令中传入这一个 `--style-config` 文件。

优先级如下：

1. 输入 `option`
2. 图形专属 style config

如果同一字段在多层同时出现，以更高优先级配置为准。

当前内置的样式预设包括：

- `config/line_style.json`
- `config/bar_style.json`
- `config/pie_style.json`
- `config/gauge_style.json`
- `config/area_style.json`
- `config/dual_axis_style.json`
- `config/scatter_style.json`
- `config/radar_style.json`
- `config/funnel_style.json`

这套模型的价值在于：每种图都拥有自己的完整默认样式，修改某一类图时不会再意外影响其它图形。

## 快速开始

检查或安装 Python 依赖：

```bash
python3 skills/data-charts-visualization/scripts/ensure_deps.py
python3 skills/data-charts-visualization/scripts/ensure_deps.py --install
```

用 option 文件直接渲染一张图：

```bash
python3 skills/data-charts-visualization/scripts/line_chart.py \
  --option skills/data-charts-visualization/test/data/line/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/out/manual_line_chart.png
```

使用图形自己的持久化样式配置：

```bash
python3 skills/data-charts-visualization/scripts/line_chart.py \
  --style-config skills/data-charts-visualization/config/line_style.json \
  --option skills/data-charts-visualization/test/data/line/line_basic_single_series.json \
  --output skills/data-charts-visualization/test/out/manual_line_chart_styled.png
```

通过自然语言更新持久化样式配置：

```bash
python3 skills/data-charts-visualization/scripts/update_style_config.py \
  --chart-type line \
  --instruction "折线更粗一些，显示标签，图例放到底部"
```

## 可靠性

每一类图形都有专门的测试数据、文字化 case 说明、golden image 基线图，以及独立的 runner 放在 `test/scripts/` 下。当前这套能力是按“视觉结果可验证”来建设的，而不是只做一个能跑通的渲染脚本。

典型覆盖范围包括：

- 基础出图
- `dataset + encode`
- style config 覆盖
- 图例和配色变化
- 坐标轴与标签格式化
- `null` / `connectNulls` 这类折线连续性场景
- 各图形的关键专项能力，例如玫瑰图、分段仪表盘、横向双轴、雷达图 split area、漏斗排序等

## 最适合的使用场景

当你有下面这些需求时，这个 skill 会很合适：

- 从结构化 `option` 直接渲染静态图表
- 想保留 ECharts 风格配置，同时在本地稳定出图
- 希望一套样式配置复用到大量图表中
- 希望图表能力可以通过 golden-image 做回归验证
