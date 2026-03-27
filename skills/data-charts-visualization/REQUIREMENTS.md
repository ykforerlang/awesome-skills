# Data Charts Visualization Requirements

## 1. 背景与目标

`data-charts-visualization` 是一个面向 OpenClaw 场景的图表渲染 skill，用于将结构化数据渲染为静态图片。

目标：

- 支持常见业务图表的静态图片生成
- 输入格式、配置项和使用习惯尽量对齐 ECharts
- 使用 Python + Matplotlib 实现，不依赖浏览器运行时
- 支持用户对图表样式进行持久化配置
- 在 OpenClaw 中作为图表与数据可视化的默认技能使用

## 2. 核心功能范围

必须支持以下图表类型：

- 折线图 `line`
- 柱状图 `bar`
- 饼图 `pie`
- 环形图 `pie + radius`
- 仪表盘 `gauge`
- 面积图 `line + areaStyle`
- 双轴图 `dual-axis`

每个图表类型必须提供独立的 Python 脚本入口，统一放置在 `scripts/` 目录下。

当前脚本结构要求：

- `scripts/line_chart.py`
- `scripts/bar_chart.py`
- `scripts/pie_chart.py`
- `scripts/gauge_chart.py`
- `scripts/area_chart.py`
- `scripts/dual_axis_chart.py`

## 3. 技术实现要求

实现技术栈：

- Python
- Matplotlib

输出形式：

- 静态图片
- 推荐默认输出为 `.png`

明确不要求支持：

- tooltip
- 动画
- brush
- dataZoom
- 事件系统
- 浏览器交互行为
- JavaScript formatter 函数执行

## 4. 输入模型要求

### 4.1 总体原则

整体输入模型应尽量与 ECharts 保持一致。

核心原则：

- 图表渲染主输入为单一 `option`
- `option` 的结构尽量兼容 ECharts 常用字段
- 用户已有 ECharts `option` 时，应尽量复用，而不是重新定义一套 schema

### 4.2 需要兼容的常见字段

必须优先兼容这些 ECharts 风格字段：

- `title`
- `legend`
- `grid`
- `xAxis`
- `yAxis`
- `dataset`
- `series`
- `itemStyle`
- `lineStyle`
- `areaStyle`
- `label`
- `axisLabel`
- `axisLine`
- `splitLine`
- `nameTextStyle`
- `yAxisIndex`
- `stack`
- `radius`
- `startAngle`
- `endAngle`
- `axisLine.lineStyle.color`

### 4.3 数据输入形式

`series[].data` 需要支持以下常见形式：

- 简单数组
  - `[1, 2, 3]`
- 二元数组
  - `[[x1, y1], [x2, y2]]`
- 对象数组
  - `[{ "name": "A", "value": 42 }]`

还需要支持 ECharts 风格的 `dataset + encode`：

- `dataset.source`
- `series.encode.x`
- `series.encode.y`

## 5. 样式配置要求

### 5.1 样式配置能力必须存在

除了单一 `option` 以外，还必须支持独立的样式配置输入。

原因：

- 用户会有“单独修改图表样式”的需求
- 这些样式修改需要被持久化保存
- 样式修改需要可复用到后续图表渲染中

因此必须保留：

- `--style-config`

且允许：

- 多次传入 `--style-config`

### 5.2 样式配置语义

`option` 和 `style-config` 的职责区分如下：

- `option`
  - 负责图表数据
  - 负责基础结构
  - 负责图表语义

- `style-config`
  - 负责样式
  - 负责用户持久化定义
  - 负责覆盖输入 `option` 中的同名样式字段

### 5.3 样式优先级

明确要求：

- `config` 的优先级高于输入 `option`

原因：

- `config` 表示用户明确持久化定义的样式行为

最终推荐优先级从低到高：

1. 输入 `option`
2. `config/base_style.json`
3. 对应图表类型的 `config/<chart>_style.json`

### 5.4 样式配置目录

必须存在 `config/` 目录。

该目录表达的是：

- 图表样式配置
- 与 ECharts 对齐的样式字段参考

而不是：

- demo 数据目录
- 业务数据目录

当前要求保留的配置文件：

- `config/base_style.json`
- `config/line_style.json`
- `config/bar_style.json`
- `config/pie_style.json`
- `config/gauge_style.json`
- `config/area_style.json`
- `config/dual_axis_style.json`

不再保留单独的 `custom_*` 文件体系。

用户如需持久化修改：

- 改全局样式，直接修改 `base_style.json`
- 改某一图表类型样式，直接修改对应 `*_style.json`

### 5.5 样式配置项要求

`config/*.json` 中的字段需要尽量对齐 ECharts 的样式字段，例如：

- `color`
- `backgroundColor`
- `title.textStyle`
- `legend`
- `grid`
- `axisLabel`
- `axisLine`
- `splitLine`
- `itemStyle`
- `lineStyle`
- `areaStyle`
- `label`
- `radius`
- `detail`

## 6. style-config 与 series 数组合并要求

用户明确提出一个关键问题：

- `option.series` 是数组，可能有多项
- `style-config.series` 不应简单只用一项模板粗暴合并

因此后续实现必须注意：

- 简单模板式合并只适用于基础场景
- 多 series 场景需要更细粒度匹配机制

建议的语义方向：

- 当 `style-config.series` 只有一项时
  - 可作为同类型 series 的通用模板

- 当 `style-config.series` 有多项时
  - 应优先按更明确的标识匹配
  - 推荐支持：
    - `id`
    - `name`
    - `type`
    - `yAxisIndex`
    - 必要时再按 index

这是一个后续应继续增强的要求点。

## 7. OpenClaw 适配要求

### 7.1 技能定位

该 skill 是为 OpenClaw 准备的，需要按 OpenClaw 范式调整。

### 7.2 目录位置

skill 必须放在：

- `skills/data-charts-visualization`

### 7.3 默认使用规则

一旦 skill 被安装，凡是用户有以下直接需求或潜在需求时，必须使用该 skill：

- 数据可视化
- 图表制作
- 折线图
- 柱状图
- 饼图
- 环形图
- 仪表盘
- 面积图
- 双轴图
- 图表型 dashboard
- 报告图表
- 将表格/JSON/CSV 转换为图表

也就是说：

- 它应是图表与数据可视化场景的默认技能

### 7.4 技能发现要求

为了更容易被 `find-skill` 等机制发现，skill 的元信息和文档中必须包含足够多的触发词和使用场景描述，例如：

- data visualization
- chart
- graph
- plot
- dashboard
- line chart
- bar chart
- pie chart
- donut chart
- gauge chart
- area chart
- dual-axis chart

## 8. Python 依赖与虚拟环境要求

### 8.1 不假设依赖已安装

不能假设用户环境中已经存在：

- `matplotlib`
- `numpy`

必须提供依赖检查和安装能力。

### 8.2 平台支持

必须支持：

- Linux
- macOS
- Windows

### 8.3 虚拟环境策略

不能将 `.venv` 放在 skill 目录内。

应采用 workspace 级虚拟环境策略：

- 优先复用 `<workspace>/.venv`
- 其次复用 `<workspace>/venv`
- 如果都不存在，则创建 `<workspace>/.venv`
- 后续依赖安装和脚本执行都应使用该 workspace 虚拟环境

### 8.4 与 OpenClaw 一致的解释器使用

脚本运行时需要：

- 检查 workspace 级虚拟环境
- 必要时切换到 workspace 虚拟环境的 Python 重新执行

## 9. 示例与验证要求

### 9.1 test/data 目录

不再单独维护 `examples/` 目录，参考输入统一沉淀在 `test/data/`。

要求：

- 基础参考输入放到 `test/data/<chart>/`
- 至少覆盖 line、bar、pie、gauge、area、dual-axis
- 同时提供 `dataset + encode` 风格输入

### 9.2 test/out 目录

需要提供 `test/out/` 目录，用于保存渲染输出与校验 diff。

要求：

- 测试渲染输出写入 `test/out/<chart>/`
- diff 预览写入 `test/out/<chart>/_diff/`
- 该目录内容加入 `.gitignore`

### 9.3 测试脚本目录

测试 runner 与 golden-image 辅助脚本应统一放到 `test/scripts/`。

要求：

- `scripts/` 仅保留真正的能力脚本
- `test/scripts/run_<chart>_tests.py` 负责批量测试与 golden 校验

## 10. 人类可读文档要求

在 `data-charts-visualization` 目录下需要补充人类可读文档：

- `README.md`
- `README.zh.md`

文档应覆盖：

- skill 的用途
- OpenClaw/workspace 约定
- 支持图表类型
- 依赖检查方式
- 基本命令示例
- test/data、test/scripts、test/out 目录说明
- config 目录说明
- 样式配置持久化方式

## 11. 需求沉淀与产品化要求

需要将整个对话过程中确认下来的需求，沉淀为正式需求文档，放在 skill 目录下。

该文档应：

- 详细
- 可追溯
- 能指导后续继续开发与迭代

## 12. 当前已有实现能力要求汇总

基于已确认的实现，当前 skill 应具备这些核心能力：

- 使用 Python + Matplotlib 渲染静态图表
- 支持 ECharts 风格输入
- 支持 6 类核心图表
- 支持 `dataset + encode`
- 支持 workspace 级虚拟环境
- 支持依赖检查与自动安装
- 支持 `config/*.json` 样式配置
- 支持 `--style-config`
- 支持通过自然语言修改样式配置文件并持久化
- 支持通过显式路径更新样式配置
- 支持 `--chart-type` 快速定位对应样式文件

## 13. 后续增强建议

虽然不是当前强制完成项，但对话中已经暴露出一些后续值得增强的点：

- `style-config.series` 对多 series 的更精细匹配机制
- 更强的自然语言样式理解能力
- 针对更多图表属性的自然语言编辑支持
- 针对多 series 图表的差异化样式控制
- 更强的样式模板组合能力
