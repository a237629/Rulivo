# 第 35 步验收：AI 纠错

## 范围

本步只实现 AI 解释纠错反馈，不实现第 36 步行为计划模板。

## 反馈类型

用户可对证据报告中的单个行为模式解释选择：

- `INACCURATE`：不准确；
- `UNHELPFUL`：无帮助；
- `EVIDENCE_ERROR`：证据错误；
- `TONE_INAPPROPRIATE`：语气不适。

接口还支持最多一千字符的可选补充说明；当前移动端首版提供四个快捷选择。

## 历史事实保护

反馈是独立的追加记录。提交操作只创建 `pattern_explanation_feedback`：

- 不更新或删除交易；
- 不更新或删除证据快照；
- 不重算或覆盖置信指标；
- 不修改已经生成的 AI 解释。

每条反馈保存被评价模式解释的 JSON 快照、解释输入指纹、模型版本和 Prompt 版本。
即使以后重新生成解释，原反馈仍能准确还原当时被评价的内容。解释外键使用
`ON DELETE RESTRICT`，避免误删反馈目标。

同一用户不能对同一解释版本、模式和原因重复提交。

## API

`POST /analytics/pattern-explanations/{explanationId}/feedback`

请求：

```json
{
  "patternType": "LOSS_REENTRY",
  "reason": "INACCURATE",
  "comment": "可选补充说明"
}
```

- 必须携带 Access Token；
- 解释必须属于当前用户；
- 模式必须存在于被评价解释中；
- 请求采用严格 Schema，拒绝额外字段。

## 移动端

证据报告的每个模式卡片底部提供四个纠错选项。成功后锁定该卡片本次选择并显示保存状态；
失败时保留报告内容并提示重试。页面明确说明反馈不会自动修改历史事实。

## 数据库

- 迁移：`20260729000400_step_35_ai_corrections`；
- 新增枚举 `PatternExplanationFeedbackReason`；
- 新增表 `pattern_explanation_feedback`；
- 保存用户、解释、模式、原因、可选说明、解释快照和生成版本来源；
- 唯一索引阻止同一解释版本的重复原因反馈。

## 自动化验收

- 服务测试覆盖反馈追加、解释快照、租户隔离、重复提交和禁止历史事实写操作；
- 迁移契约测试覆盖四种原因、解释快照、输入指纹及受限删除；
- 移动端客户端测试覆盖受认证的反馈请求；
- OpenAPI 测试覆盖反馈路由；
- 执行数据库迁移、API/移动端/国际化测试及全仓质量门禁。
