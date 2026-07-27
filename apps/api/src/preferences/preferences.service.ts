import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { PreferenceInput } from "./preference-validation.js";

export interface PreferenceResult extends PreferenceInput {
  onboardingComplete: boolean;
}

const defaults: PreferenceInput = {
  defaultCurrency: "USD",
  defaultMarket: "UNITED_STATES",
  locale: "zh-CN",
  riskUnit: "PERCENT_OF_EQUITY",
  timeZone: "UTC"
};

@Injectable()
export class PreferencesService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async get(userId: string): Promise<PreferenceResult> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (profile === null) return { ...defaults, onboardingComplete: false };
    return {
      defaultCurrency: profile.defaultCurrency.trim(),
      defaultMarket: profile.defaultMarket,
      locale: profile.locale as PreferenceResult["locale"],
      onboardingComplete: profile.onboardingCompletedAt !== null,
      riskUnit: profile.riskUnit,
      timeZone: profile.timeZone
    };
  }

  public async save(userId: string, input: PreferenceInput): Promise<PreferenceResult> {
    const completedAt = new Date();
    const profile = await this.prisma.userProfile.upsert({
      create: {
        ...input,
        onboardingCompletedAt: completedAt,
        userId
      },
      update: {
        ...input,
        onboardingCompletedAt: completedAt
      },
      where: { userId }
    });
    return {
      defaultCurrency: profile.defaultCurrency.trim(),
      defaultMarket: profile.defaultMarket,
      locale: profile.locale as PreferenceResult["locale"],
      onboardingComplete: true,
      riskUnit: profile.riskUnit,
      timeZone: profile.timeZone
    };
  }
}
