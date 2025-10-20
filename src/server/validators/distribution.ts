import { z } from "zod";
export const GetDaySummarySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export type GetDaySummaryInput = z.infer<typeof GetDaySummarySchema>;
export const DistributeSchema = z.object({
  onHand: z.number().int().nonnegative(),
  rows: z.array(z.object({ envelopeId: z.string().min(1), percent: z.number().int().min(0).max(100).optional(), amount: z.number().int().nonnegative().optional() })).min(1),
  allowOverride: z.boolean().optional(), overrideReason: z.string().max(500).optional()
}).refine(v=> v.rows.reduce((s,r)=>s+(r.amount??0),0) <= v.onHand, "Montant distribué > montant en main"
).refine(v=> !v.allowOverride || (v.overrideReason && v.overrideReason.trim().length>=5), "overrideReason (≥ 5 caractères) requis si allowOverride = true");
export type DistributeInput = z.infer<typeof DistributeSchema>;
export const ReconcileSchema = z.object({ declaredOnHand: z.number().int().nonnegative() });
export type ReconcileInput = z.infer<typeof ReconcileSchema>;
export const GetDistributionProposalSchema = GetDaySummarySchema;
export type GetDistributionProposalInput = z.infer<typeof GetDistributionProposalSchema>;
