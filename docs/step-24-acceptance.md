# 第 24 步验收：单笔交易详情

## 范围

本步只交付单笔交易详情，不实现第 25 步结果评分。

## 已交付

- `GET /trades/:tradeId` 聚合成交图表、成交与费用、截图、笔记、语音及规则结果。
- 成交图表只使用数据库中的真实成交点，明确返回 `EXECUTION_PRICE`，不伪造 K 线行情。
- `POST /trades/:tradeId/notes`、`PATCH /trades/:tradeId/notes/:noteId` 和
  `DELETE /trades/:tradeId/notes/:noteId` 提供笔记生命周期。
- 所有查询与写入均绑定认证用户；跨用户资源统一表现为不存在。
- 截图和语音只返回受保护内容路由，不返回对象存储键。
- 移动端增加详情路由、六区块结构及类型化 API 客户端。

## 数据库

迁移 `20260728001200_step_24_trade_details` 新增 `trade_notes`，通过
`(trade_id, user_id)` 复合外键保证笔记与交易属于同一用户。

## 验收命令

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```

验收标准：迁移无待执行项，全仓构建、类型检查、lint 和测试全部通过。

## 边界

- 当前图表是成交价格点图；完整 K 线需要未来接入获授权的行情数据源。
- 移动端当前认证仍是演示会话；详情客户端已要求真实 Access Token，不在本步绕过认证。
- 未增加结果评分字段、算法或方法说明。
