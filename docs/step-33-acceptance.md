# 第 33 步验收：AI 解释服务

## 范围

本步只实现 AI 行为模式解释服务及其安全输入/输出边界，不实现第 34 步证据报告页面。

## 数据边界

模型请求的 `input.calculated_metrics` 只来自第 32 步的
`behavior_pattern_confidences`，包含：

- 样本量、已知样本量及通过/失败/未知数量；
- 反例数量、效应量、数据完整性；
- 置信度分数、置信度等级和主导状态；
- 算法版本、模式类型及指标记录自身的 `evidence_id`。

请求不会包含交易记录、交易备注、语音、图片、证据快照的输入/输出或用户原文。

## JSON Schema 与数值证据

- 模型必须按 `patternExplanationOutputSchema` 返回严格对象，额外字段会被拒绝。
- 普通结论和限制文本不能包含阿拉伯数字。
- 数字只能出现在 `numeric_claims` 中；每项同时包含 `metric`、`value` 和
  `evidence_id`。
- 服务端会确认 `evidence_id` 属于当前用户、模式一致，且 `value` 与已计算指标完全一致。
- 每种输入模式必须恰好返回一条解释；重复、遗漏、虚构数值或未知证据均返回网关错误，
  不会持久化。

Prompt 版本为 `pattern-explanation-v1`。

## 配置

- `PATTERN_EXPLANATION_MODEL_ENDPOINT`
- `PATTERN_EXPLANATION_MODEL_API_KEY`
- `PATTERN_EXPLANATION_MODEL_NAME`

未配置时生成接口返回服务不可用，不会使用模拟结果冒充真实 AI 输出。

## 数据库与 API

- 迁移：`20260729000300_step_33_pattern_explanations`。
- `behavior_pattern_explanations` 每位用户保存一份当前解释。
- 保存输入指标 ID、输入 SHA-256 指纹、模型版本、Prompt 版本、严格校验后的输出及生成时间。
- 读取时会对比当前指标 ID；指标重算后旧解释视为过期并返回空结果。
- `POST /analytics/pattern-explanations/generate`：生成并保存解释。
- `GET /analytics/pattern-explanations`：读取当前用户最近一次解释。

## 自动化验收

- 契约测试覆盖严格 JSON Schema、数值证据关联、虚构数值、未知证据和正文数字。
- 模型适配器测试确认请求只包含计算指标和响应 Schema。
- 服务测试覆盖无指标拒绝、来源版本持久化及无效模型输出拒绝。
- 数据库迁移契约测试覆盖输入/输出 JSON、指纹及模型/Prompt 版本。
- OpenAPI 测试覆盖读取与生成路由。
- 执行数据库迁移、API 测试及全仓 lint、typecheck、build、format 检查。
