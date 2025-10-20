import { z } from "zod";

/**
 * Politiques applicables par type d'enveloppe.
 * - forbidOut: interdit toute dépense OUT (ex: Loyer intouchable).
 * - requireOverrideForOut: demande une dérogation (motif) pour OUT.
 * - requireManagerForOverride: si dérogation, elle doit être portée par un MANAGER.
 */
export const TypePoliciesSchema = z.object({
  forbidOut: z.boolean().default(false),
  requireOverrideForOut: z.boolean().default(false),
  requireManagerForOverride: z.boolean().default(false),
});

export type TypePolicies = z.infer<typeof TypePoliciesSchema>;
