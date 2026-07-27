# 第 8 步验收记录

## 范围

本步实现：

- 邮箱六位验证码登录。
- Sign in with Apple 服务端身份令牌验签。
- Global Region 可选 Google 登录。
- 访问令牌、刷新令牌轮换、注销和当前用户接口。

本步未实现中国手机号登录，也未扩展第 9 步用户偏好。

## HTTP 接口

| 方法   | 路径                       | 说明                                  |
| ------ | -------------------------- | ------------------------------------- |
| `POST` | `/auth/email/request-code` | 请求邮箱验证码                        |
| `POST` | `/auth/email/verify`       | 验证邮箱并建立会话                    |
| `POST` | `/auth/apple`              | 验证 Apple identity token 并建立会话  |
| `POST` | `/auth/google`             | 验证 Google ID token 并建立海外区会话 |
| `POST` | `/auth/refresh`            | 单次使用刷新令牌，轮换会话            |
| `POST` | `/auth/logout`             | 撤销刷新会话                          |
| `GET`  | `/auth/me`                 | 使用 Bearer access token 获取当前用户 |

Swagger/OpenAPI 位于 `/docs` 和 `/docs-json`。

## 数据库变化

迁移 `20260727000200_step_8_authentication` 新增：

- `auth_identities`：邮箱、Apple、Google 身份与用户的稳定映射。
- `email_verifications`：验证码哈希、有效期、尝试次数和消费时间。
- `auth_sessions`：刷新令牌哈希、有效期、撤销和轮换链。
- `AuthProvider` 枚举。

数据库只保存验证码 HMAC 和刷新令牌 SHA-256 哈希，不保存原始凭证。外键级联删除用户认证数据；会话轮换保留替换关系。

## 安全规则

- 邮箱验证码有效期 10 分钟、60 秒内不可重复发送、最多尝试 5 次、成功后不可重放。
- debug 模式仅在非生产环境返回验证码；生产强制使用 SMTP。
- access token 使用 HS256、固定 issuer/audience、15 分钟有效期。
- refresh token 为 256 位随机不透明值，30 天有效，每次刷新后旧令牌立即失效。
- `/auth/me` 同时验证 JWT 和数据库会话状态，因此注销后旧 access token 不能继续访问。
- Apple/Google ID token 使用供应商远程 JWKS 验签，并校验 issuer、audience、过期时间和 subject。
- Google 登录只在 `DEPLOYMENT_REGION=GLOBAL` 且配置 client ID 时启用。

## 环境变量

| 变量                       | 用途                                     |
| -------------------------- | ---------------------------------------- |
| `AUTH_JWT_SECRET`          | JWT 签名和验证码 HMAC 密钥，至少 32 字符 |
| `AUTH_EMAIL_DELIVERY_MODE` | `debug` 或 `smtp`；生产必须为 `smtp`     |
| `AUTH_EMAIL_FROM`          | 验证码邮件发件人                         |
| `APPLE_CLIENT_IDS`         | 允许的 Apple audience，多个值用逗号分隔  |
| `GOOGLE_CLIENT_IDS`        | 允许的 Google audience，多个值用逗号分隔 |
| `SMTP_HOST`                | SMTP 主机                                |
| `SMTP_PORT`                | SMTP 端口，默认 587                      |
| `SMTP_SECURE`              | 是否直接使用 TLS                         |
| `SMTP_USER`                | SMTP 用户名                              |
| `SMTP_PASSWORD`            | SMTP 密码                                |

## 验收

已在本地 PostgreSQL 17 容器上应用迁移，并通过真实数据库集成测试验证：

- 请求并验证邮箱验证码。
- 创建用户、邮箱身份和会话。
- Bearer access token 访问 `/auth/me`。
- refresh token 成功轮换，旧 refresh token 重放返回 401。
- logout 后对应 access token 访问 `/auth/me` 返回 401。
- 已消费验证码不可重放。
- 验证码重复发送返回 429。
- Apple 未配置时失败关闭。
- China Region 禁止 Google 登录。

Apple 和 Google 的真实供应商登录仍需在获得开发者 client ID 后进行沙箱/真机联调；缺少配置时接口明确返回 503，不会接受未验签令牌。
