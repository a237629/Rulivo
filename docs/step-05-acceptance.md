# 第 5 步验收记录

## 范围

基于 Expo Router 建立移动端 onboarding、auth、tabs、settings 路由，以及登录态、未登录态守卫。

## 路由

| URL             | 文件                       | 权限       |
| --------------- | -------------------------- | ---------- |
| `/onboarding`   | `app/onboarding/index.tsx` | 未完成引导 |
| `/auth/sign-in` | `app/auth/sign-in.tsx`     | 未登录     |
| `/`             | `app/(tabs)/index.tsx`     | 已登录     |
| `/review`       | `app/(tabs)/review.tsx`    | 已登录     |
| `/evidence`     | `app/(tabs)/evidence.tsx`  | 已登录     |
| `/plan`         | `app/(tabs)/plan.tsx`      | 已登录     |
| `/profile`      | `app/(tabs)/profile.tsx`   | 已登录     |
| `/settings`     | `app/settings.tsx`         | 已登录     |

## 守卫规则

- 未完成 onboarding 的用户统一进入 `/onboarding`。
- 已完成 onboarding 但未登录的用户统一进入 `/auth/sign-in`。
- 受保护深链目标保存在 `pendingPath`，登录后使用 replace 恢复。
- 已登录用户访问 onboarding 或 auth 时回到首页。
- 未知或格式错误的深链安全回退首页。
- 返回时只选择当前会话仍有权限访问的历史页面。

## 深链

App Scheme 为 `rulivo`，例如：

```text
rulivo://settings
rulivo://review
```

导航策略同时支持 HTTPS 路径规范化。

## 验收命令

```bash
pnpm install
pnpm --filter @rulivo/mobile typecheck
pnpm --filter @rulivo/mobile test
pnpm check
```

## 数据库和环境变量

本步骤无数据库变化，不新增环境变量。认证持久化、真实登录和用户偏好属于后续步骤。

## 验收结果

2026-07-27 已完成：

- 移动端 typecheck 通过。
- 8 项导航策略测试通过，覆盖 App Scheme、HTTPS 深链、未知链接、两级守卫、登录后恢复及返回历史。
- 全仓 `pnpm check` 通过，累计 37 项测试通过。
- Expo SDK 57 原生依赖按 bundled native modules 版本对齐，peer dependency 检查通过。
