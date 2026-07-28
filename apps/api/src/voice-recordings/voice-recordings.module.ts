import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrivateObjectStore } from "../images/private-object-store.js";
import { VoiceRecordingsController } from "./voice-recordings.controller.js";
import { VoiceRecordingsService } from "./voice-recordings.service.js";
import { SpeechToTextService } from "./speech-to-text.service.js";
import { VoiceTranscriptionsController } from "./voice-transcriptions.controller.js";
import { VoiceTranscriptionsService } from "./voice-transcriptions.service.js";
import { VoiceInsightExtractor } from "./voice-insight-extractor.service.js";
import { VoiceInsightsController } from "./voice-insights.controller.js";
import { VoiceInsightsService } from "./voice-insights.service.js";

@Module({
  controllers: [VoiceRecordingsController, VoiceTranscriptionsController, VoiceInsightsController],
  imports: [AuthModule],
  providers: [
    PrivateObjectStore,
    VoiceRecordingsService,
    SpeechToTextService,
    VoiceTranscriptionsService,
    VoiceInsightExtractor,
    VoiceInsightsService
  ]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class VoiceRecordingsModule {}
