import { z } from "zod";
export const UpdateDistributionRuleSchema = z.object({ items: z.array(z.object({ envelopeId:z.string().min(1), percent:z.number().int().min(0).max(100) })).min(1) }).refine(v=> v.items.reduce((s,i)=>s+i.percent,0)===100, "La somme des pourcentages doit être = 100");
export type UpdateDistributionRuleInput = z.infer<typeof UpdateDistributionRuleSchema>;
export const UpsertEnvelopeSchema = z.object({ id:z.string().optional(), name:z.string().min(2), emoji:z.string().max(8).optional(), protected:z.boolean().optional(), active:z.boolean().optional(), budgetTarget: z.number().int().min(0) });
export const ToggleEnvelopeActiveSchema = z.object({ id:z.string().min(1), active:z.boolean() });
export const ToggleEnvelopeProtectedSchema = z.object({ id:z.string().min(1), protected:z.boolean() });
export type UpsertEnvelopeInput = z.infer<typeof UpsertEnvelopeSchema>;
export const UpsertServiceSchema = z.object({ id:z.string().optional(), name:z.string().min(2), active:z.boolean().optional() });
export const ToggleServiceSchema = z.object({ id:z.string().min(1), active:z.boolean() });
