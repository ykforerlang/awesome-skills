# Data Charts Visualization

使用 Node.js + Apache ECharts SSR，把 ECharts 风格的 `option` 渲染成静态图表，并与 helper 侧复用同一套 option 构建逻辑。

[English README](./README.md)

## 为什么用这个 Skill

- 图形覆盖完整：折线、柱状、饼图、环形、玫瑰图、仪表盘、面积、双轴、散点、雷达、漏斗。
- 配置契约统一：helper web 和 skill 使用同一套 helper config 结构。
- option 构建统一：两边都通过共享的 helper `option-builder` 生成最终 ECharts option。
- 渲染链路统一：skill 端固定走 `ECharts SSR -> SVG -> PNG`。

## 配置模型

1. 在 `data` 中提供业务数据和基础结构。
2. 在 `config/<chart>_style.json` 中维护该图的 helper 配置。
3. skill 先用共享 builder 生成最终 ECharts option，再进行 SSR 渲染。

现在 `config` 被视为一份完整 helper config，而不是局部 patch。实际使用上更推荐直接走 `--config-file`。

## 快速开始

主命令：

```bash
areslabs-data-charts \
  --chart-type line \
  --config-file skills/data-charts-visualization/config/line_style.json \
  --data-file /tmp/line_basic_single_series.json \
  --out /tmp
```

如果是在当前仓库里直接按本地包的 `npx` 方式调用：

```bash
npx --yes --package ./skills-scripts/data-charts-visualization areslabs-data-charts \
  --chart-type line \
  --config-file skills/data-charts-visualization/config/line_style.json \
  --data-file /tmp/line_basic_single_series.json \
  --out /tmp
```

在当前仓库里，也可以直接调用脚本入口：

```bash
node skills-scripts/data-charts-visualization/dist/cli.js \
  --chart-type line \
  --config-file skills/data-charts-visualization/config/line_style.json \
  --data-file /tmp/line_basic_single_series.json \
  --out skills/data-charts-visualization/test/manual
```

这个 data 文件建议从 shared 默认数据生成或拷出，来源：

- `skills-helpler/data-charts-visualization/shared/charts-default-data.js`

使用内联配置渲染：

```bash
node skills-scripts/data-charts-visualization/dist/cli.js \
  --chart-type line \
  --data '{"xAxis":{"data":["Mon","Tue"]},"yAxis":{},"series":[{"type":"line","data":[120,132]}]}' \
  --config "$(cat skills/data-charts-visualization/config/line_style.json)" \
  --out skills/data-charts-visualization/test/manual
```

`--variant` 用来承载 agent 一次性的渲染策略，例如：

- `{"layout":"horizontal","stack":true}`
- `{"pieMode":"donut"}`
- `{"leftSeriesType":"bar","rightSeriesType":"line"}`

## 测试辅助

- 预览矩阵生成：`node skills/data-charts-visualization/test/scripts/render_skill_preview_matrix.js`
- 示例与产物说明：`skills/data-charts-visualization/test/README.md`
- shared 默认数据：`skills-helpler/data-charts-visualization/shared/charts-default-data.js`
- shared 默认配置：`skills-helpler/data-charts-visualization/shared/charts-default-config.js`
