import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const noteSchema = z.object({ body: z.string().trim().min(1).max(10_000) }).strict();

export function parseTradeNote(input: unknown): { body: string } {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }
  return parsed.data;
}
