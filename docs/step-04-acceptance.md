# 第 4 步验收记录

## 范围

建立简体中文和英文国际化基础，支持运行时切换、复数、日期、币种与时区格式化，并阻止组件硬编码用户可见文本。

## 实现

- `packages/i18n/src/locales/zh-CN.json`
- `packages/i18n/src/locales/en-US.json`
- i18next + react-i18next 运行时实例。
- 默认语言 `zh-CN`，回退语言 `zh-CN`。
- `formatCurrencyMinor` 只接受整数最小货币单位。
- `formatDateTime` 强制调用方指定 IANA 时区。
- TypeScript AST 检查器扫描应用和 packages 中的非测试 TSX 文件。

## 运行时验收

设计系统预览页提供 `zh-CN`、`en-US` 按钮。切换时调用 `changeLanguage` 并更新 React 状态及文档语言，不重启应用、不刷新页面。

```bash
pnpm check
pnpm --filter @rulivo/ui build
pnpm --filter @rulivo/ui preview
```

## 测试覆盖

- 中英文资源键一致。
- 运行时语言切换。
- 英文单复数。
- 美元和人民币格式化。
- 拒绝非整数金额输入。
- 同一 UTC 时刻按上海和纽约时区展示不同结果。
- JSX 用户可见文本硬编码检查。

## 数据库和环境变量

本步骤无数据库变化，不新增环境变量。用户语言和时区的持久化属于后续用户偏好步骤。
