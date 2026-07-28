import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const querySchema = z
  .object({
    accountId: z.uuid().optional(),
    cursor: z.uuid().optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    executionScoreMax: z.coerce.number().int().min(0).max(100).optional(),
    executionScoreMin: z.coerce.number().int().min(0).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    market: z.string().trim().min(1).max(32).optional(),
    result: z.enum(["WIN", "LOSS", "BREAKEVEN", "UNKNOWN"]).optional(),
    strategyId: z.uuid().optional()
  })
  .strict()
  .refine(
    (query) =>
      query.dateFrom === undefined || query.dateTo === undefined || query.dateFrom <= query.dateTo,
    "dateFrom must not be later than dateTo"
  )
  .refine(
    (query) =>
      query.executionScoreMin === undefined ||
      query.executionScoreMax === undefined ||
      query.executionScoreMin <= query.executionScoreMax,
    "executionScoreMin must not exceed executionScoreMax"
  );

export type TradeListQuery = z.infer<typeof querySchema>;

export function parseTradeListQuery(input: unknown): TradeListQuery {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }
  return parsed.data;
}
