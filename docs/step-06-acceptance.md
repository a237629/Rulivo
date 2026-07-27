# 第 6 步验收记录

## 范围

建立 NestJS API 骨架，包括健康检查、结构化日志、请求 ID、全局异常过滤、OpenAPI 和统一响应。

## HTTP 接口

| 路径             | 用途         |
| ---------------- | ------------ |
| `GET /health`    | 进程健康检查 |
| `GET /docs`      | Swagger UI   |
| `GET /docs-json` | OpenAPI JSON |

## 响应协议

成功响应：

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid-or-caller-id",
    "timestamp": "UTC ISO-8601"
  }
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cannot GET /missing"
  },
  "meta": {
    "requestId": "uuid-or-caller-id",
    "timestamp": "UTC ISO-8601"
  }
}
```

稳定错误代码包括 `BAD_REQUEST`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT`、`TOO_MANY_REQUESTS` 和 `INTERNAL_ERROR`。

## 日志和请求 ID

- Nest `ConsoleLogger` 使用 JSON 输出。
- 请求日志包含 method、path、statusCode、durationMs 和 requestId。
- 合法的 `x-request-id` 会原样传递；缺失、空白或过长时生成 UUID。
- 未预期异常记录服务端错误，但响应不暴露堆栈。

## 验收命令

```bash
pnpm install
pnpm --filter @rulivo/api typecheck
pnpm --filter @rulivo/api test
pnpm check
```

## 数据库变化

无。PostgreSQL 与 Prisma 属于第 7 步，本步骤没有提前引入。

## 环境变量

新增可选 `API_PORT`，范围为 1–65535，默认 3000。

## 验收结果

2026-07-27 已完成：

- API typecheck 和 4 项集成测试通过。
- 全仓 `pnpm check` 通过，累计 39 项测试通过。
- 编译后的 Nest 进程成功启动，`GET /health` 返回 HTTP 200。
- 调用方请求 ID `live-acceptance` 在响应头和响应体中保持一致。
- `GET /docs-json` 返回 HTTP 200，OpenAPI 文档包含 `/health`。
- `@scarf/scarf` 的非必要遥测安装脚本被供应链策略明确禁止执行。
