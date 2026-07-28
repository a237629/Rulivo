# 第 12 步验收记录

## 范围

本步实现通用 CSV 导入框架：

- 上传和原始行预览。
- 用户自定义字段映射。
- 标准化数据预览和逐行错误。
- 确认导入。
- 保存及复用 mapping template。
- 按用户和文件内容检测重复上传。

未实现第 13 步 Binance、OKX、Bybit、Interactive Brokers 或通用 CSV 的预置模板，也未执行第 14 步 execution→trade 确定性归并。

## 导入状态

| 状态        | 说明                                 |
| ----------- | ------------------------------------ |
| `UPLOADED`  | 原始 CSV 已解析并保存，可查看预览    |
| `MAPPED`    | 已应用字段映射，生成标准化行和错误行 |
| `CONFIRMED` | 用户确认有效标准化行，批次不可再映射 |

确认操作不会提前创建 Trade。确认后的标准化行是第 14 步归并的输入，避免在尚无归并规则时错误组合成交。

## API

所有接口均要求 Bearer access token，并按当前用户隔离数据。

| 方法   | 路径                             | 说明                         |
| ------ | -------------------------------- | ---------------------------- |
| `POST` | `/imports/csv/upload`            | 上传 CSV、检测重复并返回预览 |
| `GET`  | `/imports/csv/:batchId`          | 查询批次、预览和错误行       |
| `PUT`  | `/imports/csv/:batchId/mapping`  | 应用映射并可保存模板         |
| `POST` | `/imports/csv/:batchId/confirm`  | 确认至少包含一条有效行的批次 |
| `GET`  | `/imports/csv/mapping-templates` | 查询当前用户保存的映射模板   |

上传采用 JSON：

```json
{
  "fileName": "executions.csv",
  "tradingAccountId": "UUID",
  "content": "Time,Ticker,Side,Qty,Price\n..."
}
```

单文件最大 1 MiB，最多 5,000 个数据行。CSV 解析支持 UTF-8 BOM、CRLF、引号内逗号、双引号转义和引号内换行。

## 字段映射

必填目标字段：

- `executedAt`
- `symbol`
- `action`
- `quantity`
- `price`

可选目标字段：

- `fee`
- `currency`
- `market`
- `externalId`

映射选项包含默认币种、默认市场和价格小数位。价格和费用直接解析为 bigint 最小货币单位，不使用浮点乘法。

## 错误行

每行独立保存：

- 原始字段。
- 标准化字段或 `null`。
- `is_valid`。
- 字段级错误数组。

错误代码覆盖列数、日期、symbol、BUY/SELL、数量、价格精度、费用、币种和市场。一个批次可以同时包含有效行与错误行；确认只代表锁定当前校验结果，后续归并仅消费有效行。

## 重复检测

服务端使用原始 UTF-8 内容的 SHA-256。数据库唯一约束为：

```text
user_id + content_hash
```

同一用户即使修改文件名也不能重复上传相同内容；不同用户互不影响。重复响应返回原批次 ID 和状态。

## 数据库变化

迁移 `20260727000700_step_12_csv_import_framework` 和
`20260727000800_step_12_import_account_cascade`：

- 新增 `CsvImportStatus`。
- 新增 `csv_import_batches`。
- 新增 `csv_import_rows`。
- 新增 `csv_mapping_templates`。
- 增加用户、交易账户复合归属、批次级联和行号/大小/计数检查约束。
- 增加 SHA-256 重复文件唯一索引。
- 不包含 `DROP TABLE` 或 `TRUNCATE`。

## 新增环境变量

无。

## 验收项

- 未认证请求被拒绝。
- 上传返回 headers 和原始行预览。
- RFC 4180 常用引号和换行场景可解析。
- 字段映射生成有效标准化行。
- 无效行返回字段级错误。
- 映射模板可保存和查询。
- 相同内容改名后仍被检测为重复。
- 未映射或零有效行批次不能确认。
- 已确认批次不能再次映射或确认。
- 数据库迁移、schema、lint、typecheck、测试、构建和格式检查通过。
