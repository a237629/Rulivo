import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CoreStatisticsController } from "./core-statistics.controller.js";
import { CoreStatisticsService } from "./core-statistics.service.js";
import { EvidenceReportController } from "./evidence-report.controller.js";
import { EvidenceReportService } from "./evidence-report.service.js";
import { PatternConfidenceController } from "./pattern-confidence.controller.js";
import { PatternConfidenceService } from "./pattern-confidence.service.js";
import { PatternExplanationController } from "./pattern-explanation.controller.js";
import { PatternExplanationModel } from "./pattern-explanation-model.service.js";
import { PatternExplanationService } from "./pattern-explanation.service.js";
import { PatternExplanationFeedbackService } from "./pattern-explanation-feedback.service.js";

@Module({
  controllers: [
    CoreStatisticsController,
    EvidenceReportController,
    PatternConfidenceController,
    PatternExplanationController
  ],
  imports: [AuthModule],
  providers: [
    CoreStatisticsService,
    EvidenceReportService,
    PatternConfidenceService,
    PatternExplanationModel,
    PatternExplanationFeedbackService,
    PatternExplanationService
  ]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AnalyticsModule {}
