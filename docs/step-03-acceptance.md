# 第 3 步验收记录

## 范围

建立 RULIVO 设计 tokens、基础 React 组件，以及可切换 Light/Dark 的组件预览页。首发主题默认为 Dark。

## Tokens

- 品牌颜色：Midnight、Surface、Card、Discipline Teal、Evidence Blue、Caution Amber、Loss Coral 和两级文字色。
- 字体：Web 使用 Inter/Noto Sans SC 回退栈，iOS 使用 SF Pro/PingFang SC 回退栈，数字启用 tabular numbers。
- 间距：4px 基准比例。
- 圆角：8px、12px、18px、24px 和 pill。
- 阴影：小、中和聚焦态。
- 主题：Dark 完整采用品牌色；Light 保留语义色并转换背景、表面、文字、边框与阴影。

## 组件及预览状态

| 组件       | 预览状态                                                  |
| ---------- | --------------------------------------------------------- |
| Button     | primary、secondary、danger、ghost、disabled、hover、focus |
| Card       | default、elevated                                         |
| Metric     | neutral、positive、negative、caution                      |
| Badge      | neutral、positive、negative、caution、evidence            |
| Input      | default、hint、error、disabled、focus                     |
| Sheet      | open                                                      |
| Modal      | open、危险操作确认                                        |
| EmptyState | 图标、描述、操作按钮                                      |

## 验收命令

```bash
pnpm install
pnpm check
pnpm --filter @rulivo/ui dev
```

生产预览构建输出到 `packages/ui/preview-dist`。

## 数据库和环境变量

本步骤无数据库变化，不新增环境变量。

## 验收结果

2026-07-27 已完成：

- `pnpm check` 通过，累计 23 项测试通过，其中 6 项为设计 tokens 和组件测试。
- UI 包 TypeScript 构建与 Vite 生产预览构建通过。
- 构建后的组件预览服务器返回 HTTP 200，页面标题校验通过。
- 预览页覆盖 8 个指定组件的主要状态，并可在 Light/Dark 间切换，默认 Dark。
