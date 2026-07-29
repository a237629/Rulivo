# 第 32 步验收：行为模式置信度量化

## 范围

本步只实现确定性的置信度指标，不包含第 33 步的 AI 指标输入、JSON Schema 或
`evidence_id` 引用协议。

## 指标口径（`pattern-confidence-v1`）

每位用户、每种行为模式只统计 `invalidated_at IS NULL` 的最新证据快照。

- 样本量：`PASS + FAIL + UNKNOWN`；少于 10 条时等级固定为 `INSUFFICIENT`，
  分数固定为 0；30 条达到样本量因子的满分。
- 数据完整性：`(PASS + FAIL) / 样本量`。
- 效应量：`(FAIL - PASS) / (FAIL + PASS)`，范围 `[-1, 1]`。正值表示失败行为占优，
  负值表示通过行为占优。
- 反例数量：已知样本中非主导结果的数量，即 `min(PASS, FAIL)`。
- 置信度分数：达到样本门槛后，按样本量 30%、效应量绝对值 30%、一致性
  （`1 - 反例数 / 已知样本数`）20%、数据完整性 20% 加权并四舍五入为 `0..100`。
- 等级：`INSUFFICIENT`；达到门槛后 `<50 LOW`、`50..74 MEDIUM`、`>=75 HIGH`。

每次每日增量或每周全量检测结束时，在同一事务中根据当前有效快照重新生成
`behavior_pattern_confidences`，记录计算版本、时间和来源检测任务。

## 数据库验收

- 迁移：`20260729000200_step_32_pattern_confidence`。
- 唯一键：`(user_id, pattern_type)`。
- 检查约束保证计数守恒、非负数、效应量/完整性/分数范围合法。
- 用户删除时级联清理；检测任务删除时仅将来源任务置空。

## API 验收

`GET /analytics/pattern-confidence`

- 必须携带 Access Token。
- 只返回当前登录用户的数据。
- 按行为模式排序，并把数据库 Decimal 序列化为 JSON number。

## 自动化验收

- analytics-core 单元测试覆盖样本门槛、效应方向、反例、完整性、空样本和非法计数。
- worker 单元测试确认检测任务会触发置信度重算。
- PostgreSQL 集成测试确认每日/每周任务生成 5 种版本化指标，小样本不会得到虚假高置信度。
- API 单元测试确认用户隔离和 Decimal 序列化；OpenAPI 测试确认路由公开。
- 执行仓库的 lint、typecheck、test、build、format 检查。
