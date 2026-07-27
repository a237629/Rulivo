# 第 9 步验收记录

## 范围

本步实现用户偏好及首次 onboarding 收集：

- 语言。
- IANA 时区。
- ISO 4217 默认币种。
- 默认交易市场。
- 风险单位。

未实现第 10 步角色、权限或审计日志。

## 偏好字段

| 字段                 | 可用值或规则                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `locale`             | `zh-CN`、`en-US`                                                    |
| `timeZone`           | 有效 IANA 时区，例如 `Asia/Shanghai`、`America/New_York`            |
| `defaultCurrency`    | 三位大写 ISO 4217 币种代码，例如 `CNY`、`USD`                       |
| `defaultMarket`      | `CHINA`、`HONG_KONG`、`UNITED_STATES`、`FOREX`、`CRYPTO`、`FUTURES` |
| `riskUnit`           | `PERCENT_OF_EQUITY`、`FIXED_AMOUNT`、`R_MULTIPLE`                   |
| `onboardingComplete` | 根据 `onboarding_completed_at` 是否存在计算                         |

## API

两个接口均要求 Bearer access token：

| 方法  | 路径                    | 说明                                   |
| ----- | ----------------------- | -------------------------------------- |
| `GET` | `/users/me/preferences` | 返回已保存偏好；新用户返回安全默认值   |
| `PUT` | `/users/me/preferences` | 原子保存完整偏好并标记 onboarding 完成 |

新用户默认值：

```json
{
  "locale": "zh-CN",
  "timeZone": "UTC",
  "defaultCurrency": "USD",
  "defaultMarket": "UNITED_STATES",
  "riskUnit": "PERCENT_OF_EQUITY",
  "onboardingComplete": false
}
```

## 数据库变化

迁移 `20260727000300_step_9_user_preferences`：

- 新增 `TradingMarket` 枚举。
- 新增 `RiskUnit` 枚举。
- `user_profiles` 新增 `default_market`。
- `user_profiles` 新增 `risk_unit`。
- `user_profiles` 新增 `onboarding_completed_at`。
- 增加 locale 白名单和非空时区数据库约束。

原有 `locale`、`time_zone` 和 `default_currency` 字段继续复用，没有重复建表或破坏已有资料。

## 移动端 onboarding

原单按钮占位页已替换为五项偏好表单：

- 语言选择会立即切换 onboarding 文案。
- 时区默认读取设备 IANA 时区。
- 币种自动转为大写并限制为三位。
- 交易市场和风险单位使用明确选项。
- 无效币种或时区会阻止完成。
- 完成后偏好保留在当前 session 草稿中，再进入登录页面。

当前移动端登录仍是第 5 步建立的导航骨架，因此真机上的 API token 持久化与 onboarding 草稿上传需要在移动认证客户端接入时完成；本步已通过真实认证 API 集成测试验证服务端保存闭环。

## 验收

真实 PostgreSQL 17：

- 第 9 步迁移已应用。
- 枚举、3 个字段和数据库约束存在。
- 认证用户可读取默认偏好。
- 保存后再次读取返回持久化值及 `onboardingComplete=true`。
- 无效 IANA 时区返回 HTTP 400。
- 未认证请求由认证守卫拒绝。

自动化：

- API 偏好真实数据库集成测试。
- Prisma schema/migration 合同测试。
- 移动端默认偏好和无效输入测试。
- 中英文资源测试。
- 全仓 lint、typecheck、test、build 和格式检查。
