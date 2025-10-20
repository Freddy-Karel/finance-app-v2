import { z } from "zod";

export const ReferencePeriodSchema = z.object({
  start: z.string().min(10, "start manquant (YYYY-MM-DD)"),
  end: z.string().min(10, "end manquant (YYYY-MM-DD)"),
  basis: z.enum(["OUT","DIST"]).default("OUT"),
});

export const SuggestedItemSchema = z.object({
  envelopeId: z.string().min(1),
  name: z.string().optional(),
  amount: z.number().int().nonnegative().default(0),
  percent: z.number().int().min(0).max(100),
});

export const AdoptRuleSchema = z.object({
  items: z.array(SuggestedItemSchema).min(1),
});
