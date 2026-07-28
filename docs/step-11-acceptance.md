# 第 11 步验收记录

## 范围

本步实现交易领域模型和确定性仓位计算：

- `Instrument`：标准化交易标的。
- `Trade`：一次方向明确的完整交易生命周期。
- `Execution`：逐笔买入或卖出成交。
- `Fee`：交易级或成交级费用。
- 支持 long、short、多次加仓、部分减仓和完全平仓。

未实现第 12 步 CSV 上传、字段映射、错误行、模板或重复文件检测。

## 数据模型

### Instrument

使用 `market + symbol` 唯一标识标的，保存币种、价格精度和数量精度。迁移会根据旧 `trades.symbol`、`trades.market` 和 `trades.currency` 自动生成 Instrument；旧数据没有市场时使用 `UNKNOWN`，不会删除已有交易。

### Trade

Trade 保留步骤 7 已有汇总字段，并新增不可为空的 `instrument_id`。`side` 明确为 `LONG` 或 `SHORT`：

- LONG：`BUY` 增仓，`SELL` 减仓。
- SHORT：`SELL` 增仓，`BUY` 回补。

一次 Trade 归属一个用户、交易账户和 Instrument。

### Execution

每笔成交保存：

- Trade 内严格唯一的正整数 `sequence`。
- `BUY` 或 `SELL`。
- 成交时间。
- 最大 10 位小数的正数量。
- 非负整数最小货币单位价格。
- 可选外部成交 ID。

数据库禁止零数量、负数量、负价格及无效 sequence。

### Fee

费用类型包括：

- `COMMISSION`
- `EXCHANGE`
- `REGULATORY`
- `TAX`
- `OTHER`

费用使用非负整数最小货币单位和三位大写币种代码。Fee 必须属于 Trade，可以进一步关联同一 Trade 下的 Execution；复合外键阻止跨 Trade 错配成交费用。

## 仓位与盈亏计算

纯函数 `calculateTrade` 按输入顺序处理 Execution：

- 支持多次同方向增仓。
- 使用移动加权成本处理部分减仓。
- 支持 LONG 和 SHORT 对称计算。
- 禁止减仓超过剩余仓位，避免在同一个 Trade 中反转方向。
- 仓位归零后禁止重新开仓，应创建新的 Trade。
- 所有费用从已实现毛盈亏中扣除得到净盈亏。
- 数量固定按 10 位小数解析。
- 中间成本使用 bigint 有理数，最终最小货币单位采用远离零的四舍五入，避免浮点误差。

## 数据库变化

迁移 `20260727000600_step_11_trade_domain`：

- 新增 `ExecutionAction` 和 `FeeType` 枚举。
- 新增 `instruments`、`executions`、`fees` 表。
- `trades` 新增并回填 `instrument_id`。
- 新增唯一约束、查询索引、租户内关联外键和领域检查约束。
- 不包含 `DROP TABLE` 或 `TRUNCATE`。

## 新增环境变量

无。

## 验收项

- 旧 Trade 在迁移后仍存在并关联 Instrument。
- Instrument、Execution、Fee 表和约束存在。
- LONG 多次加仓后可部分减仓。
- SHORT 多次入场后可部分回补。
- 完全平仓后剩余数量为零且状态为 `CLOSED`。
- 手续费总额从毛盈亏中完整扣除。
- 超量减仓/回补被拒绝。
- schema、迁移、seed、lint、typecheck、测试、构建和格式检查全部通过。
