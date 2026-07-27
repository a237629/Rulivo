# RULIVO

RULIVO（律迹）是一个移动端优先的交易记录、行为复盘和教育工具。本产品不提供投资建议、交易信号、收益保证、自动下单或跟单服务。

## 仓库结构

- `apps/mobile`：移动端应用占位入口
- `apps/api`：API 服务占位入口
- `apps/admin`：管理后台占位入口
- `apps/web`：公开网页占位入口
- `apps/analytics-worker`：分析任务占位入口
- `packages/contracts`：跨应用共享契约
- `packages/config`：共享静态配置
- `packages/ui`：设计 tokens、React 组件和组件预览页
- `packages/typescript-config`：严格 TypeScript 配置

当前是执行手册第 1 步的工程骨架。框架和业务依赖会在对应后续步骤引入。

## 开始

需要 Node.js 22+ 和 pnpm 11+。

```bash
pnpm install
Copy-Item .env.example .env
pnpm check
```

On macOS or Linux, use `cp .env.example .env`.

运行单个空应用：

```bash
pnpm --filter @rulivo/api dev
```

将 `api` 替换为 `mobile`、`admin`、`web` 或 `analytics-worker` 即可。

## 环境配置

应用启动时会读取根目录 `.env`，并使用 Zod 校验：

- `APP_ENV`：`local`、`test`、`staging` 或 `production`
- `DEPLOYMENT_REGION`：`GLOBAL` 或 `CHINA`
- `LOG_LEVEL`：可选，默认 `info`

缺少必填项或使用未支持的值时，应用会在启动阶段终止并列出具体错误。区域枚举仅建立部署边界，本步骤不配置数据库、对象存储、AI 或支付服务。

## 设计系统预览

```bash
pnpm --filter @rulivo/ui dev
```

预览页覆盖 Button、Card、Metric、Badge、Input、Sheet、Modal、EmptyState 的主要状态。支持 Light/Dark 实时切换，首次加载默认 Dark。

## 国际化

`@rulivo/i18n` 首发支持 `zh-CN` 和 `en-US`，默认简体中文。组件预览页可在运行时切换语言，无需重载页面。

- 文案资源位于 `packages/i18n/src/locales`。
- 使用 i18next 复数规则处理数量。
- 日期格式化必须显式提供用户时区。
- 货币格式化接收整数最小货币单位。
- `pnpm lint` 会拒绝组件中的 JSX 可见文本字面量。

## 移动端导航

移动端使用 Expo Router，提供 onboarding、auth、五项 tabs 和 settings 路由。首次启动进入 onboarding，完成引导后进入登录；受保护深链会在登录后恢复原目标。

```bash
pnpm --filter @rulivo/mobile dev
```

支持 `rulivo://settings` 等 App Scheme 深链。当前登录态仅为导航骨架内存状态，真实认证和持久化不属于本步骤。

## API

API 使用 NestJS，启动前读取统一环境配置：

```bash
Copy-Item .env.example .env
pnpm --filter @rulivo/api build
pnpm --filter @rulivo/api start
```

- 健康检查：`GET /health`
- Swagger UI：`GET /docs`
- OpenAPI JSON：`GET /docs-json`
- 请求 ID：接受或生成 `x-request-id`

成功响应和错误响应均包含 `meta.requestId` 与 UTC 时间戳。默认端口为 3000，可通过 `API_PORT` 修改。

## 工程约束

- TypeScript 开启 strict。
- 所有金额使用整数最小货币单位。
- 数据库时间保存为 UTC。
- 确定性指标由代码计算，不交给 AI。
- 每一步均需通过 lint、typecheck、test、build 和格式检查。

完整范围见《RULIVO_AI交易复盘教练_Codex从0到1执行手册.md》。
