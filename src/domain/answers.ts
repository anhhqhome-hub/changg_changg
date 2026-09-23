import { z } from "zod";

export const answerPayloadSchema = z.object({
  selectedOptionIds: z.array(z.string()).optional(),
  textAnswer: z.string().max(20_000).optional(),
  blankAnswers: z.array(z.string()).optional(),
  matchingAnswers: z.record(z.string(), z.string()).optional(),
  orderingAnswers: z.array(z.string()).optional(),
  audioAssetId: z.string().optional(),
  isFlagged: z.boolean().optional(),
  clientUpdatedAt: z.coerce.date().optional()
});

export type AnswerPayload = z.infer<typeof answerPayloadSchema>;

export function normalizeFillBlank(value: string, trimWhitespace = true, caseSensitive = false) {
  let normalized = trimWhitespace ? value.trim() : value;
  normalized = normalized.replace(/\s+/g, " ");
  return caseSensitive ? normalized : normalized.toLocaleLowerCase("en-US");
}
