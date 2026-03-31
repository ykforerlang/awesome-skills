# Data Charts Visualization Helper Test Cases

## Scope

本测试文档覆盖 `skills-helpler/data-charts-visualization/` 下的静态网页助手。

当前网页入口：

- `web/index.html`
- `web/index.zh.html`

重点验证：

- 图表切换
- 通用配置
- 图表专属配置
- 数据模板切换
- 输出导出
- 一键复制
- 移动端适配
- JSON 错误处理
- 中英文入口一致性

## Coverage Matrix

| Case ID | Area | Scenario | Expected Result |
| --- | --- | --- | --- |
| WEB-001 | chart selector | 切换 `line / gauge / radar` | 当前图表高亮、说明文案、专属字段、数据模板同步切换 |
| WEB-002 | common config | 修改 title / subtitle / title align | `option` 与导出内容中同步反映标题配置 |
| WEB-003 | palette | 修改 palette | `styleConfig` 输出中出现新的配色数组 |
| WEB-004 | legend | 切换 legend 显示、位置、方向 | 输出结果中 `legend.show / left / top / orient` 正确变化 |
| WEB-005 | grid | 修改 `grid.left/right/top/bottom` | 输出结果中 grid 数值正确变化 |
| WEB-006 | line config | 勾选 `smooth / connectNulls`，关闭 `showSymbol` | line 专属输出字段正确生成 |
| WEB-007 | bar config | 切换 horizontal + stacked + label | bar 专属输出字段正确生成 |
| WEB-008 | pie config | 切换 pie / donut / rose | pie 系列输出在 `radius / roseType` 上正确变化 |
| WEB-009 | gauge config | 修改 min/max/angles/progress | gauge 输出字段正确生成 |
| WEB-010 | area config | 配置 smooth / opacity / connectNulls | area 系列输出正确生成 |
| WEB-011 | dual-axis config | 开启 stacked bars 和 right-axis area line | dual-axis 输出包含主轴 bar 与次轴 line/area 配置 |
| WEB-012 | scatter config | 切换为 bubble 模式 | scatter 输出与数据模板说明同步变化 |
| WEB-013 | radar config | 修改 shape 和 splitNumber | radar 配置正确反映 |
| WEB-014 | funnel config | 修改 sort / gap / minSize / maxSize | funnel 配置正确反映 |
| WEB-015 | data template | 支持多模板图形切换模板 | 数据编辑器内容切换为对应模板 |
| WEB-016 | dataset template | 选择 `dataset + encode` 模板 | 输出中保留 `dataset.source` 与 `series.encode` |
| WEB-017 | advanced patch | 追加有效 patch | resolved preview 包含 patch 内容，且优先级最高 |
| WEB-018 | invalid data JSON | 破坏数据 JSON 语法 | 页面显示错误提示并标红数据编辑区 |
| WEB-019 | invalid patch JSON | 破坏 patch JSON 语法 | 页面显示错误提示并标红 patch 编辑区 |
| WEB-020 | option export | 查看 raw `option` | raw `option` 不混入 style payload 包装结构 |
| WEB-021 | style export | 查看 `styleConfig` payload | base/chart 两层输出结构清晰 |
| WEB-022 | resolved preview | 同时配置 common + chart + patch | resolved preview 显示最终合并结果 |
| WEB-022A | agent package | 查看 structured package | 输出包含 skill、chartType、recommendedStyleFiles、option、stylePayload、advancedPatch、resolvedPreview |
| WEB-023 | copy option | 点击 copy option | 成功复制 option JSON，并给出成功反馈 |
| WEB-024 | copy style | 点击 copy style | 成功复制 style payload，并给出成功反馈 |
| WEB-025 | copy resolved | 点击 copy resolved | 成功复制 resolved preview，并给出成功反馈 |
| WEB-026 | copy agent package | 点击 `Copy Agent Package` | 成功复制 structured agent package JSON |
| WEB-026A | copy agent request | 点击 agent request 区域 copy | 成功复制 agent-ready request 文本 |
| WEB-027 | mobile layout | 移动端宽度查看页面 | 页面改为纵向布局，无关键内容溢出 |
| WEB-028 | mobile usability | 移动端点击卡片、下拉框、按钮 | 交互可用，按钮尺寸足够 |
| WEB-029 | reset template | 编辑模板后点击 reset | 数据编辑器恢复为当前模板默认值 |
| WEB-030 | reset chart | 修改多个字段后 reset 当前图表 | 当前图表恢复默认配置与默认模板 |
| WEB-031 | chart summary | 切换任意图表 | 摘要区域显示图表说明文案，不出现 `undefined` |
| WEB-032 | bilingual entry | 分别打开 `web/index.html` 与 `web/index.zh.html` | 两个入口都能正常加载样式、脚本与图表缩略图 |

## Manual Acceptance Focus

验收时重点关注：

- 输出内容是否足够直接交给 OpenClaw 这类 agent
- 结构化 agent package 是否足够稳定，能被程序直接消费
- 字段命名是否与 skill 真实能力一致
- `web/` 目录下两个入口是否都可直接静态打开
- 移动端是否仍能顺畅完成“选择图表 -> 配置 -> 复制”的完整流程
