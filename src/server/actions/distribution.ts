"use server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { GetDaySummarySchema, DistributeSchema, ReconcileSchema } from "@/server/validators/distribution";
import { getDayTotals } from "@/server/queries/ledger";
import { getActiveDistributionRule } from "@/server/queries/rules";

export async function getDaySummary({ date }:{date:string}){
  const parsed=GetDaySummarySchema.safeParse({date}); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  return getDayTotals(parsed.data.date);
}
export async function distribute(input:{ onHand:number; rows:{ envelopeId:string; percent?:number; amount?:number }[]; allowOverride?:boolean; overrideReason?:string }){
  await requireRole(["operator","manager"]);
  const parsed=DistributeSchema.safeParse(input); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  const total=parsed.data.rows.reduce((s,r)=>s+(r.amount||0),0);
  const rule=await getActiveDistributionRule();
  const warnings:string[]=[];
  if(rule && rule.items.length && total>0){
    const map=new Map(rule.items.map(i=>[i.envelopeId,i.percent]));
    for(const r of parsed.data.rows){ const exp=map.get(r.envelopeId); if(typeof exp==="number"){ const pct=Math.round(((r.amount||0)/total)*100); if(pct!=exp) warnings.push(`Écart barème: ${r.envelopeId} — attendu ${exp}% vs ${pct}%`); } }
  }
  if(warnings.length && !parsed.data.allowOverride) throw new Error("Écarts au barème — confirmation requise (allowOverride + overrideReason).");
  const tx=await prisma.transaction.create({ data:{ kind:"DIST", label:"Distribution", amount:total, at:new Date() } });
  await prisma.transactionAllocation.createMany({ data: parsed.data.rows.map(r=>({ transactionId:tx.id, envelopeId:r.envelopeId, amount:r.amount||0 })) });
  if(warnings.length){ await prisma.anomaly.createMany({ data:warnings.map(w=>({ level:"warning", code:"DISTRIBUTION_RULE_MISMATCH", details: parsed.data.overrideReason?`${w} — Raison: ${parsed.data.overrideReason}`:w, transactionId:tx.id })) }); }
  return { transactionId: tx.id, warnings };
}
export async function reconcile(input:{ declaredOnHand:number }){
  await requireRole(["operator","manager"]);
  const parsed=ReconcileSchema.safeParse(input); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  const todayISO=new Date().toISOString().slice(0,10); const day=await getDayTotals(todayISO);
  const diff=parsed.data.declaredOnHand - day.onHand; if(diff===0) return { ok:true, diff:0, suggestions:[] as string[] };
  return { ok:false, diff, suggestions: diff>0?["Vérifiez une entrée manquante."]:["Vérifiez une dépense manquante."] };
}
