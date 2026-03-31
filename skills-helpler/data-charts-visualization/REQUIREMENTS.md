# Data Charts Visualization Helper Requirements

## Background

`skills/data-charts-visualization` 已经具备较完整的图表渲染与配置能力，但终端用户直接手写 `option` / `style config` 仍然有明显门槛。

本目录需要提供一个网页型配置助手，帮助用户：

- 选择图表类型
- 配置 skill 已支持的常用字段
- 预览样式效果
- 生成可直接交给 agent 的样式配置
- 一键复制，降低 OpenClaw 这类 agent 使用门槛

## Product Goal

在 `skills-helpler/data-charts-visualization/` 下实现一个零依赖、可直接静态打开的网页助手。

目录约定：

- 文档放在根目录
- 网页实现放在 `web/`
- 页面入口至少包括：
  - `web/index.html`
  - `web/index.zh.html`

该网页的定位不是渲染器，而是：

- 图表样式配置助手
- skill 能力说明入口
- agent 友好的配置导出工具

补充定位约束：

- 该 helper 的核心目标是帮助用户快速产出稳定、可复用的 `style config`
- 数据通常由用户自己的业务上下文提供，helper 不以“完整数据录入台”为目标
- helper 的字段暴露必须优先对齐 `skills/data-charts-visualization` 已实际支持的能力
- 不鼓励依赖通用 JSON patch 或高级覆盖兜底，优先使用显式表单配置

## Target Users

- 想通过网页快速组装图表配置的普通用户
- 不熟悉 ECharts 风格字段但需要输出结构化配置的用户
- 需要把图表需求与配置交给 agent 执行的用户

## Scope

### Supported Chart Families

网页必须覆盖 skill 当前支持的图形：

- line
- bar
- pie
- gauge
- area
- dual-axis
- scatter
- radar
- funnel

网页可以在展示和配置层面进一步细分：

- pie / donut / rose
- scatter / bubble

### Common Config Surface

网页需要提供通用配置区，覆盖当前 skill 已支持的高频公共字段：

- `title.text`
- `title.subtext`
- `title.left`
- `backgroundColor`
- top-level `color`
- `legend.show`
- `legend.left`
- `legend.top`
- `legend.orient`
- `grid.left`
- `grid.right`
- `grid.top`
- `grid.bottom`
- `xAxis.axisLabel.rotate`
- `yAxis.axisLabel.formatter`
- `yAxis.splitLine.show`

但通用配置不是“所有图表一视同仁”。必须遵守以下约束：

- 只有对当前图表真正有意义的通用配置才显示
- 对当前图表无意义或容易误导的通用配置必须隐藏
- 非直角坐标图不得继续暴露明显无效的坐标轴类配置

当前已确认的显隐策略：

- `gauge`
  - 保留：图表标题、画布
  - 移除：图例、布局、坐标轴、分割线
- `pie / radar / funnel`
  - 保留：画布
  - 不显示：直角坐标轴、分割线、grid 布局留白
  - 图例是否显示取决于 skill 是否实际支持
- `dual-axis`
  - helper 中应保持“坐标轴”总分组命名
  - 双轴图的类目轴、左轴、右轴应统一收敛到同一个“坐标轴”分组内
  - 左右系列的 `bar/line` 类型由 agent / 模板 / 数据本身决定，而不是由 helper 主动指定
  - 专属配置必须按左右系列当前类型动态切换，只展示当前类型真正相关的配置项
  - 双轴图专属配置的主结构应是“左侧配置 / 右侧配置”，而不是“共享柱配置 / 共享线配置”
  - 双轴图 helper 不应再假定只有固定两条 series；应能承接原始 option 中按左右轴归属组织的多 series 结构
  - 同一侧存在多条柱或多条线时，该侧除颜色外的样式应继续共享
  - 同一侧存在多条 series 时，应提供该侧对应图形类型的配色组，而不是单个颜色值
  - 双轴图不再显示全局配色板，颜色能力收敛到左柱 / 左线 / 右柱 / 右线四组配色
  - 类目轴按当前方向收敛成单一“类目轴”配置，避免和左右值轴重复
  - 分割线样式仍保留在独立的“分割线”分组
  - 在双轴图里，“坐标轴”分组只额外提供一个互斥的“分割线跟随左轴 / 右轴”配置
  - 双轴图仍然保留水平和垂直两个方向的分割线配置
  - “分割线跟随左轴 / 右轴”只影响与数值轴对齐的那组分割线

### Chart-Specific Config Surface

网页需要提供图形专属配置区，配置能力对齐 skill 当前支持范围：

- line
  - `smooth`
  - `step`
  - `showSymbol`
  - `connectNulls`
  - `label.show`
- bar
  - `label.show`
  - `barGap`
- pie
  - `label.position`
  - `startAngle`
- gauge
  - `min`
  - `max`
  - `startAngle`
  - `endAngle`
  - `progress.show`
  - `title.show`
  - `detail.show`
  - `detail.formatter`
- area
  - `stack`
  - `smooth`
  - `showSymbol`
  - `connectNulls`
  - `label.show`
  - `areaStyle.opacity`
- dual-axis
  - horizontal layout
  - stacked bars
  - left-axis label/font/line/tick/formatter/min/max
  - right-axis label/font/line/tick/formatter/min/max
  - right-axis line smooth
  - right-axis line area fill
  - right-axis line `showSymbol`
  - right-axis line `connectNulls`
- scatter
  - scatter / bubble mode
  - `label.show`
  - default `symbolSize`
- radar
  - `shape`
  - `splitNumber`
  - `showSymbol`
  - `label.show`
  - `areaStyle.opacity`
- funnel
  - `sort`
  - `label.position`
  - `gap`
  - `minSize`
  - `maxSize`

补充约束：

- 不应暴露语义不稳定、强依赖数据规模的配置项
- 典型例子是柱状图 `barWidth`
  - 合适柱宽与并排柱子组数相关
  - 堆叠场景下柱子组数等于 1
  - helper 不再暴露 `barWidth`
  - 最终柱宽由 skill 按组数和 `barGap` 自动计算
- 不应暴露“看起来能配，实际不会生效”的配置项
  - 例如 `gauge` 的图例
  - 例如不适合当前图表类型的直角坐标轴配置
- 圆形图表优先通过“绘图区”决定主体位置与大小
  - 包括 `pie / gauge / radar`
  - helper 不再单独暴露 `centerX / centerY`
  - helper 不再暴露 `radius / outerRadius`
  - 最终尺寸由绘图区自动推导

### Style-First Output

helper 当前以样式导出为主，不再以“完整 option 工作台”为目标。

页面输出只保留：

- `style config` / `style payload`

不再保留：

- 原始 `option` 输出
- agent package
- agent request
- 高级覆盖 JSON patch 输出

### Output Artifacts

网页必须至少生成以下内容：

- `styleConfig` payload

网页必须支持：

- 一键复制样式配置
- 用户可直接把样式配置交给 agent，与自己的数据配合使用

## Mobile Requirements

网页必须兼容移动端。

要求：

- 窄屏下改为纵向布局
- 不出现必须横向滚动才能操作表单的问题
- 输出区可顺序阅读
- 按钮点击区域足够大

补充交互要求：

- 桌面端采用“左侧编辑、右侧预览/输出”的工作台布局
- 当用户滚动到深层配置时，桌面端预览必须仍可见
- 移动端允许通过按钮打开预览弹层
- 桌面端与移动端都不得要求用户频繁在长页面中来回找预览

## Out Of Scope

- 后端服务
- 登录体系
- 替代 skill 的最终静态渲染
- 云端持久化
- 任意 JS formatter 执行
- 通用 JSON patch 高级覆盖入口

## Functional Requirements

### FR-001

用户可以切换当前图表类型。

### FR-002

切换图表后，页面会同步更新：

- 图表说明
- 支持能力摘要
- 图表专属配置项
- 默认数据模板

### FR-003

用户可以修改通用配置，并实时影响导出结果。

### FR-004

用户可以修改图表专属配置，并实时影响导出结果。

### FR-005

页面会在输入变更后自动刷新输出结果。

### FR-006

页面必须提供实时预览，且预览所使用的配置语义尽量贴近 ECharts。

- 对于属于 agent 选型或数据语义、而非稳定样式的能力，helper 应优先作为“预览选型”而不是导出配置暴露
- 当前至少包括：
  - 柱状图的横向/纵向布局
  - 柱状图与面积图的堆叠效果
  - 饼图的 pie / donut / rose 预览模式

### FR-007

页面必须提供显著的样式复制操作。

### FR-008

页面必须按图表类型动态隐藏无效或弱相关配置。

### FR-009

页面必须为关键字段提供单位或语义提示，例如：

- 近似 `px`
- `%`
- 视觉尺度值
- ECharts 占位符 formatter 语义

### FR-010

formatter 相关输入必须优先采用 ECharts 风格占位符。

当前要求统一支持并在文案中说明：

- 通用轴 formatter：`{value}`
- 标签 formatter：`{a}` / `{b}` / `{c}` / `{d}`
- 仪表盘 detail formatter：优先使用 `{value}`，同时兼容旧写法 `{c}`

### FR-011

双轴图必须提供左右值轴独立配置，而不是复用单一 Y 轴配置。

### FR-012

仪表盘专属“标题”配置必须明确表达为“仪表名称样式”，并与通用图表标题区分。

## UX Requirements

- 页面要像配置工作台，而不是纯表单堆叠
- 图表选择、配置输入、导出结果三块层次必须清晰
- 用户一眼能看出“复制样式配置给 agent”的主路径
- 桌面端和移动端都必须可读

补充 UX 原则：

- helper 必须尽量避免“配置项看起来存在，但实际无效”
- 同一类能力应放在同一个分组中，避免在多个面板重复出现
- 双轴图、仪表盘等复杂图表需要专门的分组化配置结构
- 字段命名必须尽量贴近用户理解，而不只是底层字段名
  - 例如 `Gauge Name` 应明确区别于通用图表标题
  - 例如双轴图的左右轴要显式区分“左轴 / 右轴”

## Technical Requirements

- 静态文件实现
- 网页资源统一放在 `web/` 子目录
- 不依赖后端
- 不要求安装构建工具
- 本地可直接打开 `web/index.html` 或 `web/index.zh.html` 使用

补充实现约束：

- helper 的字段语义必须持续与 skill 实现保持一致
- 如果 helper 暴露了某个字段，skill 必须实际支持
- 如果 skill 不支持某个 helper 字段，要么补 skill，要么移除该字段
- helper 预览与 skill 最终渲染在 formatter、legend、axis、layout 等关键语义上应尽量一致

## Recent Refinements Record

以下内容用于持久化记录本轮及近期 helper 精细化调整结论，后续继续迭代时不得回退：

### R-001 Style-First Scope

- helper 已从“数据编辑 + agent package 工作台”收敛为“样式配置助手”
- 重点输出为 `style payload`
- 数据通常由用户自行提供给 agent

### R-002 Advanced Override Removal

- “高级覆盖 / Advanced Override / JSON patch” 已移除
- 后续新增能力优先以显式表单字段落地

### R-003 Preview Interaction

- 桌面端预览区需要在深层配置滚动时保持可见
- 移动端使用按钮打开预览弹层

### R-004 Field Semantics

- helper 不再默认宣称所有数值都是 `px`
- 必须区分：
  - 近似 `px`
  - `%`
  - 视觉尺度值
- 用户容易误解的字段必须提供说明

### R-005 Formatter Alignment

- helper 与 skill 的 formatter 语义需优先对齐 ECharts
- `label` formatter 统一支持 `{a}` / `{b}` / `{c}` / `{d}`
- 轴 formatter 统一使用 `{value}`
- 仪表盘 detail formatter 在 helper 中默认使用 `{value}`，同时兼容历史 `{c}`

### R-006 Bar Width Strategy

- helper 不再暴露 `barWidth`
- skill 需根据并排组数和 `barGap` 自动计算柱宽
- 堆叠柱状图按 1 组处理

### R-007 Gauge Constraints

- `gauge` 不支持图例，helper 中必须移除相关配置
- `gauge` 的通用布局分组已移除
- `gauge` 的专属标题样式配置代表“仪表名称样式”，文字来源于 `series.data[0].name`
- `gauge` 的 `min/max` 属于量程配置，表达数据语义，不是纯样式项

### R-008 Pie Legend Fix

- 饼图不得在专属配置中硬编码 legend 位置
- 饼图图例必须继承通用图例配置
- 饼图中心位置不得作为 helper 配置项暴露，位置应由绘图区边距决定
- 饼图不暴露 `outerRadius`
- 饼图 `innerRadius` 应根据当前预览模式或 agent 最终选定模式自动推导
- 饼图 `pie / donut / rose` 不应作为导出配置项暴露，应作为预览选型提供给用户查看效果

### R-009 Dual-Axis Strategy

- 双轴图不能只依赖通用 Y 轴配置
- 必须提供左右值轴独立配置
- 双轴图的类目轴、左轴、右轴在 helper 中应统一收敛到“坐标轴”分组
- 左右系列都要支持 `bar/line` 两种可能，但具体类型应由 agent / 模板 / 数据决定，不能在 helper 中硬编码为“左柱右线”
- 双轴图应以“左侧配置 / 右侧配置”为核心组织方式；当某一侧是 `line` 时，显示接近折线图的常用配置；当某一侧是 `bar` 时，显示接近柱状图的常用配置
- 双轴图需要承接多 series 的真实结构；系列归属应以 `yAxisIndex` 或横向布局下的 `xAxisIndex` 为准，而不是只看前两条 series
- 双轴图同侧多系列场景下，helper 只将颜色作为主要系列级差异暴露；其他柱/线样式继续按侧共享
- 双轴图应为左柱、左线、右柱、右线分别提供配色组，并按同侧 series 顺序依次取色
- 双轴图同侧多线启用面积时，面积填充应自动跟随对应线条颜色，不再要求单独配置固定面积色
- 基础样式中的类目轴配置与左右值轴配置应分清职责
- 分割线样式继续在独立“分割线”分组中配置
- 双轴图需要一个互斥的“分割线跟随轴”配置，决定共享分割线跟随左轴还是右轴
- 双轴图仍需同时支持水平和垂直两个方向的分割线
- 其中只有与数值轴对应的那组分割线需要“跟随左轴 / 右轴”
- 双轴图专属配置应分组展示，至少包括：
  - 结构
  - 左柱
  - 右线

## Acceptance Criteria

- 用户可以为所有支持的图表家族生成 agent 可消费的配置内容
- 用户可以切换并编辑 `dataset + encode` 模板
- 用户可以一键复制结构化 agent package，且仍可复制 agent-ready 请求内容
- 页面在移动端宽度下不出现严重布局错乱
- 输出字段命名与 `skills/data-charts-visualization` 的真实能力保持一致
