# 第 2 步验收记录

## 范围

建立统一环境配置系统，区分 local、test、staging、production 运行环境以及 GLOBAL、CHINA 部署区域。

## 实现

- 根目录提供 `.env.example`，不提交真实 `.env`。
- `@rulivo/config` 使用 Zod 集中解析和校验环境变量。
- 所有应用在执行启动逻辑前加载并校验配置。
- 错误信息同时列出所有缺失或无效的必填项。

## 验收命令

```bash
pnpm install
pnpm check
pnpm --filter @rulivo/api start
```

成功启动需要提供：

```text
APP_ENV=local
DEPLOYMENT_REGION=GLOBAL
```

删除任一必填变量后执行启动命令，进程应以非零状态退出，并在错误中显示变量名称和允许值。

## 数据库变化

无。本步骤仅建立配置边界，不提前执行数据库设计或迁移。

## 环境变量

| 名称                | 必填 | 允许值                                   | 默认值 |
| ------------------- | ---- | ---------------------------------------- | ------ |
| `APP_ENV`           | 是   | `local`, `test`, `staging`, `production` | 无     |
| `DEPLOYMENT_REGION` | 是   | `GLOBAL`, `CHINA`                        | 无     |
| `LOG_LEVEL`         | 否   | `debug`, `info`, `warn`, `error`         | `info` |

## 验收结果

2026-07-27 已完成：

- `pnpm check` 通过。
- 17 项测试通过，覆盖四种运行环境、两种部署区域、默认值、非法值及缺失配置。
- `production/GLOBAL` 配置下 API 成功启动。
- 缺失 `APP_ENV` 和 `DEPLOYMENT_REGION` 时 API 以状态码 1 退出，并同时显示两个变量的允许值。
