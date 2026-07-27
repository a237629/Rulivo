# RULIVO｜律迹

## 多模态 AI 交易行为教练：Codex 从 0 到 1 执行手册

版本：V1.0  
目标市场：中国大陆 + 海外  
首发平台：iOS App + 管理后台 + 支付/隐私网页  
工作品牌：RULIVO（中文名：律迹）  
产品口号：Review your discipline. See the evidence.  
中文口号：看见纪律留下的轨迹。

> 本产品用于交易记录、行为复盘和教育，不提供投资建议、收益保证、自动下单或跟单服务。

## 核心页面效果图

![RULIVO 核心页面效果图](generated_images/call_m2VdqmqU9h0WtehXZ845pHPS.png)

## App 图标与品牌概念

![RULIVO App 图标与品牌概念](generated_images/call_p6x7Y3AtKymPEPnTfAPlyosa.png)

---

# 0. Codex 使用规则

## 0.1 执行方式

将本手册放在项目根目录，文件名保持不变。每次只让 Codex 执行一个步骤。不要一次要求 Codex 完成全部项目。

每一步开始时向 Codex 输入：

```text
请阅读《RULIVO_AI交易复盘教练_Codex从0到1执行手册.md》。
当前只执行第 X 步，不执行后续步骤。
先检查现有代码和未提交修改，不覆盖无关内容。
完成代码、数据库变更、测试、文档和本步验收。
```

## 0.2 每一步固定交付格式

Codex 完成每一步后必须输出：

```text
本步结果：
已完成功能：
修改文件：
数据库变化：
新增环境变量：
执行的验证：
验证结果：
未完成项与风险：
下一步：
```

## 0.3 强制工程规则

- TypeScript 开启 strict。
- 所有金额使用整数最小货币单位，不使用浮点数。
- 所有时间数据库保存 UTC，展示时按用户时区转换。
- AI 不直接计算盈亏、胜率、R 值、回撤、MFE/MAE；这些由确定性代码计算。
- AI 输出必须通过 JSON Schema 校验。
- AI 结论必须关联证据 ID，不允许只输出泛化建议。
- 交易所和券商 API 首版只申请只读权限。
- 图片和语音默认私有，不允许进入公开训练数据。
- 所有高风险删除操作必须二次确认。
- 每一步必须补充对应测试。

---

# 1. 产品定义

## 1.1 核心定位

RULIVO 不是行情预测或买卖信号工具，而是移动端优先的多模态交易行为教练。它自动读取交易记录、交易截图和语音复盘，区分“交易结果”和“执行质量”，量化重复错误造成的损失，并通过 14 天行为训练帮助用户改善纪律。

## 1.2 核心用户

### 中国大陆

- A 股、港股、美股个人投资者
- 数字资产现货与合约用户
- 期货、外汇和差价合约用户
- 使用 Binance、OKX、Bybit 等平台的中文用户
- 使用 CSV、截图记录交易而非专业交易日志的用户

### 海外

- 美股、期权、期货、Forex、Crypto 活跃交易者
- Prop Firm 挑战用户
- TradeZella、TraderSync、Edgewonk 的潜在用户
- 希望改善 revenge trading、FOMO、overtrading 的用户

## 1.3 产品差异化

1. 截图、CSV、只读 API、文字和语音均可创建复盘。
2. 结果评分与执行评分分开。
3. 所有 AI 结论展示证据、样本量和影响值。
4. 主动追问，减少用户手工填写。
5. 每个周期只改善一个行为。
6. 14 天训练计划将洞察转化为行动。
7. 中国大陆与海外支付、语言和数据接入分层设计。
8. 移动端完成一次复盘控制在 60 秒左右。

## 1.4 首版不做

- 自动交易或代客下单
- 跟单、喊单、收益排行
- 明确买入/卖出信号
- Level II 或 250ms 行情回放
- 社区晒收益
- 复杂量化策略市场
- 账户托管
- 银行卡、证券资金或加密资产保管

---

# 2. 品牌方案

## 2.1 工作名称

英文：RULIVO  
中文：律迹  
含义：Rule + Live + Evolve；纪律不是一句口号，而是持续留下的可验证轨迹。

正式投入前必须完成：

- 中国商标第 9、35、36、42 类检索
- 美国 USPTO 检索
- 欧盟 EUIPO 检索
- App Store 与 Google Play 重名检查
- `.com`、`.app`、`.ai` 和中国域名可用性检查

如 RULIVO 不可注册，备用名称按优先级：

1. RuleTrace
2. ExecuMind
3. R-Discipline

不要使用 TradeMirror、TradeHabit、TradeLens 等已有明显同类使用的名称。

## 2.2 图标方向

- 深海军蓝圆角方形底。
- 核心图形由抽象字母 R、纪律勾选和交易轨迹组合。
- 不使用美元符号、金币、比特币、火箭和“只涨不跌”的箭头。
- 1024×1024 App Store 主图标。
- 同时输出 20、29、40、60、76、83.5、1024 pt 需要的 iOS 资源。
- 保证 32 px 下仍能识别。

## 2.3 品牌颜色

| 用途 | 色值 |
|---|---|
| Midnight | `#07111D` |
| Surface | `#0F1B29` |
| Card | `#152333` |
| Discipline Teal | `#2ED7A2` |
| Evidence Blue | `#47B7E8` |
| Caution Amber | `#F5B942` |
| Loss Coral | `#FF6B6B` |
| Text Primary | `#F7F8FA` |
| Text Secondary | `#9BAABC` |

红色只代表损失、风险和规则违背；绿色代表纪律完成和正向进展，不代表“买入”。

## 2.4 字体

- iOS 中文：PingFang SC
- iOS 英文：SF Pro
- Web 中文：Noto Sans SC
- Web 英文：Inter
- 数字：使用 tabular numbers

---

# 3. UI/UX 方案

## 3.1 设计原则

- 参考 TradeZella 的专业可信度，但减少功能密度。
- 参考 Edgewonk 的纪律与心理结构，但减少手工填写。
- 参考 TradesViz 的证据与确定性计算，但不展示数百个图表。
- 参考 Apple Health 的趋势与训练计划表达。
- 参考现代金融 App 的卡片、数字对齐和隐私感。

## 3.2 信息架构

底部导航五项：

1. 首页 Home
2. 复盘 Review
3. 证据 Evidence
4. 计划 Plan
5. 我的 Profile

## 3.3 核心页面

### 首页

- 纪律评分
- 本周 P&L（R）
- 执行质量
- 最昂贵错误
- 当前 14 天计划
- 快速导入
- 今日复盘提醒

### 单笔交易复盘

- 交易图表
- 入场、止损、出场
- 结果评分
- 执行评分
- 规则偏差证据
- 截图
- 语音复盘
- AI 追问

### AI 证据报告

- 明确结论
- 样本量
- 影响值
- 置信等级
- 关联交易
- 反例
- 数据范围
- 建议的单一行为实验

### 14 天计划

- 一项核心目标
- 每日检查
- 当前进度
- 连续完成天数
- 避免的潜在错误成本
- 第 7 天中期复盘
- 第 14 天结项报告

## 3.4 关键交互

- 用户上传截图后自动裁剪并识别，不要求先填长表单。
- 语音完成后展示文字稿供用户确认。
- AI 追问采用 2～4 个快捷选项 + 自由输入。
- AI 结论中的数字可点击，跳转到对应交易列表。
- 所有评分展示计算方法。
- 用户可标记“AI判断错误”，进入纠错队列。

## 3.5 多语言

首发语言：

- `zh-CN` 简体中文
- `en-US` 英文

第二阶段：

- `zh-TW`
- `ja-JP`
- `ko-KR`
- `es-ES`

规则：

- 默认跟随系统语言。
- 用户可在设置中手动切换。
- 数据库只保存稳定的枚举值，不保存翻译后的标签。
- AI 输出使用用户当前语言。
- 所有日期、数字、币种按地区格式化。
- 中文和英文分别维护 App Store 元数据。

---

# 4. 商业模式与支付

## 4.1 套餐

| 套餐 | 海外建议价 | 中国建议价 | 核心权益 |
|---|---:|---:|---|
| Free | $0 | ¥0 | 每月 20 笔、基础统计 |
| Starter | $9.99/月 | ¥38/月 | 200 笔、截图、AI 日志 |
| Pro | $19.99/月 | ¥78/月 | 无限交易、语音、AI 教练、14天计划 |
| Coach | $39.99/月 | ¥168/月 | 多账户、导师共享、高级报告 |

年付价格在月付总价基础上优惠约 35%～45%，具体通过转化测试确定。

## 4.2 iOS 支付

iOS App 内解锁数字功能使用 StoreKit 2 自动续订订阅。推荐 RevenueCat 管理收据、订阅状态和跨平台权益，但服务端必须保留自己的 entitlement 表。

产品 ID 示例：

```text
app.rulivo.starter.monthly
app.rulivo.pro.monthly
app.rulivo.pro.yearly
app.rulivo.coach.monthly
```

必须提供：

- 恢复购买
- 管理订阅入口
- 试用和续费说明
- 退款/撤销后的权益回收
- App Store Server Notifications V2

不要在不满足目标商店规则或未取得 entitlement 的情况下，在 iOS App 内放置微信、支付宝或 Stripe 购买按钮。

## 4.3 Web 海外支付

- Stripe Checkout
- Stripe Customer Portal
- Webhook 验证签名
- 支持银行卡、Apple Pay、Google Pay（按 Stripe 地区能力）

## 4.4 Web 中国支付

- 微信支付商户平台
- 支付宝开放平台
- H5/PC/小程序根据后续渠道分别接入
- 支付回调必须验签
- 不保存用户银行卡信息

## 4.5 统一权益

所有渠道写入统一结构：

```text
subscription
entitlement
payment_provider
provider_customer_id
provider_transaction_id
product_code
status
current_period_start
current_period_end
cancel_at_period_end
environment
```

不得仅依赖客户端判断会员状态。

---

# 5. 技术架构

## 5.1 推荐技术栈

### 移动端

- React Native
- Expo Development Build
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Hook Form + Zod
- NativeWind 或自建 design tokens
- React Native Skia / Victory Native 绘制核心图表
- i18next
- Sentry
- PostHog（按地区和隐私策略配置）

选择 React Native + Expo 的原因：

- 同一套代码支持 iOS 与后续 Android。
- 支持相机、相册、麦克风、推送和生物识别。
- 可以生成 App Store 构建。
- 使用 Development Build 兼容需要原生模块的支付和安全 SDK。

### 后端

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- S3 兼容对象存储
- OpenTelemetry
- Sentry

### 管理后台

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- RBAC

### AI 与数据

- 多模态模型：截图/OCR/语义抽取
- 语音转文字模型
- 小模型：标签、分类、翻译
- 高质量推理模型：周报、月报、行为模式解释
- Python 分析服务：指标、异常检测、实验评估
- 行情数据服务：按目标市场签约，首版可只用于交易发生时的图表重建

## 5.2 部署分区

建议逻辑上分为：

- Global Region：海外用户
- China Region：国内用户

两个区域使用同一代码版本，但数据、对象存储、AI供应商和支付配置可独立。不要默认把中国用户的交易数据传到海外区域。正式上线前必须由专业律师/合规顾问确认隐私、跨境传输和金融相关要求。

## 5.3 Monorepo

```text
rulivo/
  apps/
    mobile/
    admin/
    web/
    api/
    analytics-worker/
  packages/
    ui/
    contracts/
    i18n/
    config/
    analytics-core/
    eslint-config/
    typescript-config/
  infrastructure/
  docs/
  scripts/
```

使用 pnpm workspace + Turborepo。

---

# 6. 数据库设计

核心表：

```text
users
user_profiles
user_preferences
auth_identities
devices
trading_accounts
broker_connections
broker_sync_jobs
instruments
trades
trade_executions
trade_fees
trade_images
trade_voice_notes
trade_transcripts
strategies
playbooks
playbook_rules
trade_rule_results
emotions
trade_emotions
mistake_definitions
trade_mistakes
detected_patterns
pattern_evidence
review_sessions
ai_questions
ai_answers
ai_feedback
behavior_plans
behavior_plan_days
behavior_checkins
weekly_reports
subscriptions
entitlements
payment_events
notifications
audit_logs
admin_users
admin_roles
feature_flags
```

关键字段：

### trades

```text
id
user_id
trading_account_id
instrument_id
side
opened_at
closed_at
quantity
entry_price_minor
exit_price_minor
currency
realized_pnl_minor
r_multiple
strategy_id
source
status
```

### trade_rule_results

```text
trade_id
playbook_rule_id
status: PASS | FAIL | UNKNOWN
evidence_type
evidence_id
explanation
confidence
```

### detected_patterns

```text
id
user_id
pattern_type
window_start
window_end
sample_size
impact_r
confidence_level
status
```

### pattern_evidence

```text
pattern_id
trade_id
metric_key
metric_value
evidence_snapshot
```

---

# 7. 确定性分析与 AI 边界

## 7.1 代码计算

以下必须使用代码计算：

- P&L
- R 值
- 胜率
- Profit Factor
- 最大回撤
- 连续盈亏
- 持仓时间
- 交易频率
- 亏损后再入场时间
- 仓位变化
- 止损移动
- MFE/MAE
- 手续费
- 规则完成率

## 7.2 AI 负责

- 从截图提取候选信息
- 从语音提取入场理由、情绪和行为
- 根据确定性指标解释模式
- 生成针对用户的追问
- 总结周报/月报
- 翻译
- 将行为建议转换成计划

## 7.3 证据优先

AI 输出 JSON 必须包含：

```json
{
  "conclusion": "",
  "evidence_ids": [],
  "sample_size": 0,
  "impact_r": 0,
  "confidence": "low",
  "counterexamples": [],
  "limitations": [],
  "suggested_experiment": ""
}
```

没有证据时必须返回“数据不足”，不得生成确定性结论。

## 7.4 行为模式

首版支持：

- revenge_trading
- overtrading
- fomo_entry
- moved_stop
- no_stop
- oversized_position
- premature_exit
- averaging_down
- plan_deviation
- session_bias
- weekday_bias
- loss_chasing
- profit_overconfidence

---

# 8. 安全、隐私与合规

## 8.1 产品边界

所有页面、AI提示词和营销文案禁止：

- 保证盈利
- 宣称高胜率
- 推荐具体买卖
- 代客下单
- 自动复制交易
- 将AI输出包装成持牌投资顾问建议

统一免责声明：

```text
RULIVO provides trading-journal, behavioral-review and educational tools only.
It does not provide investment advice, trade signals or guarantees of any kind.
```

## 8.2 数据安全

- TLS
- 对象存储服务端加密
- 高敏字段应用层加密
- API Key 使用 KMS/Secrets Manager
- 券商凭据独立表
- 只读权限
- 日志中禁止记录密钥、完整订单和图片URL
- 下载使用短时签名 URL
- 支持删除账户和导出数据
- 管理员访问留审计日志

## 8.3 App Store

必须准备：

- 隐私政策 URL
- 服务条款 URL
- 支持 URL
- 数据删除入口
- App Privacy 数据声明
- 第三方 SDK 隐私清单
- 订阅说明
- 审核演示账户
- 审核备注
- 英文与简体中文元数据

App 名称和副标题均需符合 App Store 字数限制。

建议元数据：

```text
Name EN: RULIVO: Trading Journal
Subtitle EN: AI Discipline & Trade Review

名称中文：律迹：AI交易复盘
副标题中文：看见并改善重复交易错误
```

---

# 9. Codex 分步执行计划

## 阶段 A：项目与设计基础

### 第 1 步：建立项目仓库

- 创建 pnpm + Turborepo monorepo。
- 建立 mobile、api、admin、web、packages。
- 配置 TypeScript strict、ESLint、Prettier、EditorConfig。
- 添加 README、CONTRIBUTING、SECURITY。
- 验收：所有空应用可运行，lint 和 typecheck 通过。

### 第 2 步：环境和配置系统

- 建立 `.env.example`。
- 使用 Zod 校验环境变量。
- 区分 local、test、staging、production。
- 区分 Global/China region。
- 验收：缺少必填配置时启动失败且提示明确。

### 第 3 步：设计系统

- 将品牌色、字体、间距、圆角、阴影写入 tokens。
- 实现 Button、Card、Metric、Badge、Input、Sheet、Modal、EmptyState。
- 完成 Light/Dark，但首发默认 Dark。
- 验收：Storybook 或组件预览页覆盖所有状态。

### 第 4 步：国际化基础

- 建立 `en-US.json`、`zh-CN.json`。
- 禁止组件内硬编码用户可见文本。
- 支持复数、日期、币种、时区。
- 验收：运行时切换语言不重启 App。

### 第 5 步：移动端导航骨架

- 完成 onboarding、auth、tabs、settings 路由。
- 建立登录态和未登录态守卫。
- 验收：深链和返回逻辑正确。

## 阶段 B：后端与账户

### 第 6 步：NestJS API 骨架

- 健康检查、日志、请求 ID、异常过滤。
- OpenAPI 文档。
- 统一响应和错误代码。

### 第 7 步：PostgreSQL 与 Prisma

- 创建首批用户、账户、交易、订阅表。
- 创建迁移和 seed。
- 禁止生产环境自动 destructive migration。

### 第 8 步：认证

- 邮箱验证码。
- Sign in with Apple。
- Google 登录作为海外可选。
- 中国手机号登录放第二阶段，避免首版短信合规和成本阻塞。

### 第 9 步：用户偏好

- 语言、时区、默认币种、交易市场、风险单位。
- 首次 onboarding 收集。

### 第 10 步：权限和审计

- user、support、analyst、admin。
- 管理操作写 audit_logs。

## 阶段 C：交易导入与计算

### 第 11 步：交易领域模型

- 实现 Trade、Execution、Fee、Instrument。
- 支持多次加减仓。
- 支持 long/short。
- 单元测试覆盖手续费和部分成交。

### 第 12 步：CSV 导入框架

- 上传、预览、字段映射、错误行、确认导入。
- 保存 mapping template。
- 支持重复文件检测。

### 第 13 步：首批 CSV 模板

- Binance
- OKX
- Bybit
- Interactive Brokers
- 通用 CSV

### 第 14 步：交易归并

- 将 executions 确定性组合成 trades。
- 处理分批成交、反向开仓和跨日。

### 第 15 步：P&L 与 R 值

- 实现纯函数 analytics-core。
- 金额使用 Decimal 或整数。
- 建立黄金测试样例。

### 第 16 步：核心统计

- 胜率、Profit Factor、回撤、连续盈亏、时段表现、星期表现。

### 第 17 步：行为规则引擎

- 亏损后 N 分钟重开。
- 仓位突然增加。
- 移动止损。
- 超过每日交易次数。
- 计划外交易。

## 阶段 D：截图和语音

### 第 18 步：图片上传

- 相机、相册、裁剪、压缩。
- 获取用户同意。
- 私有对象存储。
- EXIF 清理。

### 第 19 步：截图解析

- 多模态模型返回候选资产、方向、价格、时间周期和标注。
- 所有识别字段必须由用户确认。
- 保存原始模型版本和 prompt 版本。

### 第 20 步：语音记录

- 录音、暂停、删除、上传。
- 展示时长和权限说明。

### 第 21 步：语音转文字

- 转写。
- 用户确认文本。
- 原音频可按用户设置自动删除。

### 第 22 步：心理与理由提取

- 提取情绪、入场理由、策略、计划偏差。
- 不进行医疗或心理诊断。

## 阶段 E：复盘体验

### 第 23 步：交易列表

- 日期、账户、市场、策略、结果和执行评分筛选。

### 第 24 步：单笔交易详情

- 图表、成交、截图、笔记、语音、规则结果。

### 第 25 步：结果评分

- 评分基于风险调整结果、计划目标和交易结果。
- 显示方法说明。

### 第 26 步：执行评分

- 规则遵守、仓位、止损、计划、情绪行为。
- 允许 UNKNOWN，不能强行判错。

### 第 27 步：四象限评价

- 赚钱 + 守规则：优秀交易
- 亏损 + 守规则：合格交易
- 赚钱 + 违规：危险交易
- 亏损 + 违规：错误交易

### 第 28 步：AI 主动追问

- 根据缺失证据生成一个问题。
- 快捷选项 + 自由输入。
- 单次最多追问三轮。

### 第 29 步：自动复盘摘要

- 生成结构化摘要。
- 引用规则、成交和用户语音证据。

## 阶段 F：证据型 AI

### 第 30 步：证据数据集

- 每个行为模式建立可复算的证据快照。
- 修改交易后标记旧证据失效。

### 第 31 步：模式检测任务

- 每日增量计算。
- 每周全量复算。
- 记录算法版本。

### 第 32 步：置信度

- 样本量门槛。
- 效应量。
- 反例数量。
- 数据完整性。

### 第 33 步：AI 解释服务

- AI 只能读取已计算指标。
- 输出 JSON Schema。
- 每个数字关联 evidence_id。

### 第 34 步：证据报告页面

- 结论、样本、影响、时间窗、相关交易、反例、限制。

### 第 35 步：AI 纠错

- 用户可选择不准确、无帮助、证据错误或语气不适。
- 不自动修改历史事实。

## 阶段 G：14 天行为计划

### 第 36 步：计划模板

- 为每类错误建立一个可执行目标。
- 一次只启用一个主要目标。

### 第 37 步：计划生成

- 根据证据推荐计划。
- 用户确认后启动。

### 第 38 步：每日打卡

- 最多四项。
- 支持文字或语音反思。

### 第 39 步：提醒

- 用户选择时间。
- 推送文案不包含敏感盈亏详情。

### 第 40 步：中期和结项

- 第 7 天中期报告。
- 第 14 天结项。
- 与计划前基线比较。

## 阶段 H：AI Coach

### 第 41 步：自然语言查询

- 用户询问自己的交易数据。
- 先调用确定性查询，再由 AI 解释。

### 第 42 步：查询安全

- 用户只能访问自己的数据。
- 防止 prompt injection。
- 限制导出和大范围查询。

### 第 43 步：周报

- 最昂贵错误。
- 最好执行。
- 一项建议。
- 数据不足时明确说明。

### 第 44 步：月报

- 趋势、纪律、行为成本、计划完成情况。

## 阶段 I：订阅与支付

### 第 45 步：权益服务

- entitlement 为唯一权限来源。
- 支持 grace period、expired、refunded。

### 第 46 步：StoreKit/RevenueCat

- 配置沙盒产品。
- 恢复购买。
- Webhook。
- Store Server Notifications。

### 第 47 步：Stripe

- Checkout、Portal、Webhook。
- 测试成功、失败、退款和争议。

### 第 48 步：微信支付

- Native/H5 方案按网站形态选择。
- 回调验签、幂等、对账。

### 第 49 步：支付宝

- 电脑网站/H5 支付。
- 回调验签、幂等、对账。

### 第 50 步：跨渠道权益合并

- 同一账号多渠道购买冲突规则。
- 不重复叠加错误权益。

## 阶段 J：管理后台

### 第 51 步：后台认证与 RBAC

### 第 52 步：用户支持

- 只显示必要数据。
- 敏感交易内容默认遮挡。

### 第 53 步：AI 质量后台

- 低置信结果。
- 用户纠错。
- Prompt 和模型版本。

### 第 54 步：支付后台

- 订单、订阅、退款事件、异常 webhook。

### 第 55 步：内容配置

- 错误定义。
- 计划模板。
- 多语言文案。
- Feature flag。

## 阶段 K：质量与上线

### 第 56 步：自动化测试

- 单元、集成、E2E。
- 金额和统计黄金样例。
- 订阅状态矩阵。

### 第 57 步：安全测试

- 越权。
- 文件上传。
- API 限流。
- Webhook 重放。
- 密钥泄露扫描。

### 第 58 步：性能与稳定

- 首页冷启动。
- 大 CSV。
- 图片压缩。
- AI 超时和重试。
- 降级模式。

### 第 59 步：隐私功能

- 下载数据。
- 删除账户。
- 删除图片和语音。
- 撤销券商连接。

### 第 60 步：App Store 资产

- 图标。
- 6.9/6.7 英寸截图。
- 英文和简体中文文案。
- 预览视频可选。

### 第 61 步：App Store Connect

- Bundle ID。
- App 记录。
- 订阅组。
- 税务和银行信息。
- 隐私标签。

### 第 62 步：TestFlight

- 内部测试。
- 外部测试。
- 崩溃、支付和登录验证。

### 第 63 步：审核准备

- Demo 账户。
- 审核说明。
- 明确产品不交易、不保管资产、不提供信号。
- 说明截图/麦克风用途。

### 第 64 步：灰度发布

- 先少量国家。
- 监控崩溃、试用转化、退款、AI差评。

### 第 65 步：正式发布

- 发布节奏。
- 客服 FAQ。
- 状态页。
- 事故预案。

---

# 10. 测试验收标准

## 10.1 产品验收

- 新用户在 3 分钟内完成首次复盘。
- 已有截图用户在 60 秒内完成一笔复盘。
- AI 每个核心结论都能打开证据。
- 修改成交记录后所有指标重新计算。
- 没有足够数据时不生成强结论。

## 10.2 支付验收

- iOS 购买、续费、取消、退款、恢复购买全部测试。
- Stripe 测试卡全状态覆盖。
- 微信和支付宝回调验签、重复通知和退款覆盖。
- 用户跨设备登录后权益一致。

## 10.3 多语言验收

- 中文、英文无硬编码遗漏。
- 文案扩展 30% 不截断。
- 时区和币种正确。
- App Store 元数据分别本地化。

## 10.4 合规验收

- 无收益保证。
- 无自动下单。
- 无未经许可的外部购买引导。
- 隐私标签与实际 SDK 一致。
- 用户可以删除账户和数据。

---

# 11. 关键指标

北极星指标：

```text
每周完成至少 3 次证据型复盘的活跃用户数
```

核心漏斗：

```text
安装
→ 完成首次导入
→ 完成首次复盘
→ 获得首个证据洞察
→ 启动14天计划
→ 第7天仍活跃
→ 订阅
```

重点指标：

- 首次复盘完成率
- 复盘平均耗时
- D1/D7/D30 留存
- 每周复盘次数
- 14 天计划完成率
- AI 证据点击率
- AI 纠错率
- 试用转付费
- 退款率
- 每付费用户 AI 成本

---

# 12. 上线顺序

## MVP

- iOS
- 简体中文 + 英文
- CSV + 截图 + 语音
- Binance/OKX/Bybit CSV
- 确定性分析
- AI 追问与摘要
- 证据报告
- 14 天计划
- Apple IAP

## V1.1

- 只读 API 同步
- Stripe Web
- 微信/支付宝 Web
- 周报/月报
- 教练共享

## V1.2

- Interactive Brokers
- Prop Firm 规则
- Android 海外版
- 繁中、日语、韩语、西语

---

# 13. 最终风险清单

| 风险 | 应对 |
|---|---|
| AI产生错误分析 | 确定性计算、证据ID、用户纠错 |
| 用户认为是投资建议 | 产品边界、文案审查、无信号 |
| 券商接口不稳定 | CSV和截图备用 |
| 国内外数据合规 | 区域化部署与正式法律审查 |
| App Store支付拒审 | iOS数字订阅使用IAP |
| 用户不愿持续记录 | 语音、截图、自动导入、主动追问 |
| 功能过多 | MVP只围绕复盘—证据—计划 |
| AI成本过高 | 模型路由、缓存、额度、批处理 |
| 品牌撞名 | 上线前商标和商店检索 |

---

# 14. 最终产品判断

RULIVO 不应成为“功能最多的交易日志”，而应成为“最容易坚持、最能证明问题、最能推动行为改变的交易教练”。

产品的核心闭环只有四步：

```text
自动记录
→ 找到证据
→ 选择一个错误
→ 用14天证明改善
```

只要每一个新功能都服务于这个闭环，产品就能与 TradeZella、TraderSync、TradesViz 和 Edgewonk 形成清晰差异，而不会沦为另一个复杂的交易数据面板。
