import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BehaviorRulesController } from "./behavior-rules.controller.js";
import { BehaviorRulesService } from "./behavior-rules.service.js";
import { TradeAnalyticsController } from "./trade-analytics.controller.js";
import { TradeAnalyticsService } from "./trade-analytics.service.js";
import { TradeListController } from "./trade-list.controller.js";
import { TradeListService } from "./trade-list.service.js";
import { TradeDetailController } from "./trade-detail.controller.js";
import { TradeDetailService } from "./trade-detail.service.js";
import { ResultScoreController } from "./result-score.controller.js";
import { ResultScoreService } from "./result-score.service.js";
import { ExecutionScoreController } from "./execution-score.controller.js";
import { ExecutionScoreService } from "./execution-score.service.js";
import { TradeQuadrantController } from "./trade-quadrant.controller.js";
import { TradeQuadrantService } from "./trade-quadrant.service.js";
import { FollowUpController } from "./follow-up.controller.js";
import { FollowUpService } from "./follow-up.service.js";
import { ReviewSummaryController } from "./review-summary.controller.js";
import { ReviewSummaryService } from "./review-summary.service.js";

@Module({
  controllers: [
    TradeAnalyticsController,
    BehaviorRulesController,
    TradeListController,
    TradeDetailController,
    ResultScoreController,
    ExecutionScoreController,
    TradeQuadrantController,
    FollowUpController,
    ReviewSummaryController
  ],
  imports: [AuthModule],
  providers: [
    TradeAnalyticsService,
    BehaviorRulesService,
    TradeListService,
    TradeDetailService,
    ResultScoreService,
    ExecutionScoreService,
    TradeQuadrantService,
    FollowUpService,
    ReviewSummaryService
  ]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TradesModule {}
