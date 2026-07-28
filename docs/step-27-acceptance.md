# 第 27 步验收：四象限评价

## 范围

本步只实现四象限评价，不实现第 28 步 AI 主动追问。

## quadrant-v1

- 净盈利 + 五项规则全部 `PASS`：`EXCELLENT`（优秀交易）。
- 净亏损 + 五项规则全部 `PASS`：`QUALIFIED`（合格交易）。
- 净盈利 + 至少一项规则 `FAIL`：`DANGEROUS`（危险交易）。
- 净亏损 + 至少一项规则 `FAIL`：`ERROR`（错误交易）。

为避免无证据判断，以下情况为 `UNKNOWN`：

- 尚未计算净盈亏；
- 盈亏平衡；
- 没有覆盖全部五项规则，且不存在明确 `FAIL`；
- 任一必要规则仍为 `UNKNOWN`，且不存在明确 `FAIL`。

明确的 `FAIL` 足以证明违规；但只有五项全部 `PASS` 才能证明守规则。

## API 和一致性

- `PUT /trades/:tradeId/quadrant` 计算并持久化当前用户交易的象限。
- `GET /trades/:tradeId` 返回象限、盈亏轴、纪律轴、原因、版本和方法说明。
- P&L/R 或规则结果重算后清空旧象限，避免使用过期分类。
- 不生成问题、快捷选项或多轮追问。

## 数据库

迁移 `20260728001500_step_27_trade_quadrant` 新增 `TradeQuadrant` 枚举、
象限值、算法版本和计算时间，并以约束保证分类来源完整。`UNKNOWN` 是显式状态，
与“尚未计算”的 `NULL` 区分。

## 验收

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```

验收标准：迁移全部应用；全仓 lint、类型检查、测试、构建和格式检查通过。
