import { z } from "zod";
export const CreateIncomeSchema = z.object({ serviceId: z.string().min(1), amount: z.number().int().positive(), note: z.string().max(500).optional() });
export const CreateExpenseSchema = z.object({
  total: z.number().int().positive(),
  allocations: z.array(z.object({ envelopeId:z.string().min(1), amount:z.number().int().positive() })).min(1),
  allowOverride: z.boolean().optional(), overrideReason: z.string().max(500).optional()
}).refine(v=> v.allocations.reduce((s,a)=>s+a.amount,0)===v.total, "Somme des allocations ≠ total"
).refine(v=> !v.allowOverride || (v.overrideReason && v.overrideReason.trim().length>=5), "overrideReason (≥ 5 caractères) requis si allowOverride = true");
