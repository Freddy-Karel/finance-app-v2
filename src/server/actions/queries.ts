"use server";
import { getAllEnvelopeBalances } from "@/server/queries/envelopes";
import { requireRole } from "@/lib/auth";
import { getDayTotals } from "@/server/queries/ledger";
import { getActiveDistributionRule, computeProposal } from "@/server/queries/rules";
import { GetDistributionProposalSchema } from "@/server/validators/distribution";

export async function getEnvelopeBalances(){ await requireRole(["operator","manager","auditor"]); return getAllEnvelopeBalances(); }
export async function getDistributionProposal(input:{date:string}){
  await requireRole(["operator","manager"]);
  const p=GetDistributionProposalSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; "));
  const day=await getDayTotals(p.data.date); const rule=await getActiveDistributionRule();
  if(!rule || !rule.items.length) return { onHand: day.onHand, items: [] as any[] };
  const mapped=rule.items.map(it=>({ envelopeId:it.envelopeId, percent:it.percent, envelopeName:it.envelope.name }));
  const items=computeProposal(day.onHand, mapped); return { onHand: day.onHand, items };
}
