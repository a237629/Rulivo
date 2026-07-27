# 第 7 步验收记录

## 范围

本步仅建立 PostgreSQL 数据模型、首个迁移、开发 seed 和生产迁移安全策略；未实现第 8 步认证接口。

## 数据模型

首批表：

- `users`：用户主记录和状态。
- `user_profiles`：语言、时区和默认货币。
- `trading_accounts`：用户的交易账户。
- `trades`：交易事实；金额字段使用整数最小货币单位。
- `subscriptions`：支付渠道、产品、状态和订阅周期。

所有业务时间使用 `TIMESTAMPTZ(3)`。交易通过 `(trading_account_id, user_id)` 复合外键阻止跨用户引用账户。迁移还约束 ISO 三位大写货币代码、正数交易数量、非负价格和合理的平仓时间。

## Prisma 与迁移

- Schema：`apps/api/prisma/schema.prisma`
- Prisma 配置：`apps/api/prisma.config.ts`
- 首个迁移：`apps/api/prisma/migrations/20260727000100_step_7_core_tables/migration.sql`
- Seed：`apps/api/prisma/seed.ts`

本地开发：

```powershell
$env:APP_ENV = "local"
$env:DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public"
pnpm --filter @rulivo/api db:migrate:dev
pnpm --filter @rulivo/api db:seed
```

生产发布只能显式执行：

```powershell
$env:APP_ENV = "production"
pnpm --filter @rulivo/api db:migrate:deploy
```

`migrate-dev`、`migrate-reset`、`db-push` 和 `seed` 在 `APP_ENV=production` 时会在调用 Prisma 前失败。应用启动、构建和依赖安装均不会自动迁移数据库。

## Seed

Seed 使用固定 UUID 和 upsert，可重复执行；创建一个演示用户、资料、模拟交易账户、已平仓交易和沙箱试用订阅。生产环境禁止执行。

## 新增环境变量

- `DATABASE_URL`：PostgreSQL 连接字符串；所有数据库命令必填。

## 验收命令

```powershell
$env:DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public"
pnpm --filter @rulivo/api generate
pnpm --filter @rulivo/api test
pnpm check
```

生产保护单独验收：

```powershell
$env:APP_ENV = "production"
pnpm --filter @rulivo/api db:reset
```

预期在连接数据库前返回“disabled in production”。

## 真实数据库验收

2026-07-27 已使用 Docker Desktop 启动 PostgreSQL 17：

- 容器：`rulivo-postgres`
- 端口：`5432`
- 持久化卷：`rulivo-postgres-data`
- 重启策略：`unless-stopped`
- 镜像来源：AWS 公共仓库中的 PostgreSQL 官方镜像副本

已完成：

- 应用迁移 `20260727000100_step_7_core_tables`。
- 执行开发 seed。
- 查询确认 5 张业务表和 `_prisma_migrations` 存在。
- 查询确认用户、资料、账户、交易和订阅各有 1 条 seed 数据。
- 查询确认交易数量、平仓时间和跨用户账户引用约束存在。

常用容器命令：

```powershell
docker stop rulivo-postgres
docker start rulivo-postgres
docker logs rulivo-postgres
```
