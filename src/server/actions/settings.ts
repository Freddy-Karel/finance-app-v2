"use server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UpdateDistributionRuleSchema, UpsertEnvelopeSchema, ToggleEnvelopeActiveSchema, ToggleEnvelopeProtectedSchema, UpsertServiceSchema, ToggleServiceSchema } from "@/server/validators/settings";
import { getActiveDistributionRule as _get } from "@/server/queries/rules";
import { TypePoliciesSchema } from "@/server/validators/policies";
import { z } from "zod";

export async function updateDistributionRule(items:{envelopeId:string;percent:number}[]){
  await requireRole(["manager"]);
  const parsed=UpdateDistributionRuleSchema.safeParse({items}); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  const ids=parsed.data.items.map(i=>i.envelopeId);
  const envs=await prisma.envelope.findMany({ where:{ id:{ in:ids } } });
  if(envs.length!==ids.length) throw new Error("Certaines enveloppes n'existent pas");
  if(envs.some(e=>!e.active)) throw new Error("Certaines enveloppes sont inactives");
  const now=new Date();
  await prisma.distributionRule.updateMany({ where:{ startsAt:{ lte:now }, OR:[{endsAt:null},{endsAt:{gt:now}}] }, data:{ endsAt:now } });
  const rule=await prisma.distributionRule.create({ data:{ startsAt: now } });
  await prisma.distributionRuleItem.createMany({ data: parsed.data.items.map(i=>({ ruleId:rule.id, envelopeId:i.envelopeId, percent:i.percent })) });
  return { ruleId: rule.id };
}
export async function listEnvelopes(){ await requireRole(["operator","manager","auditor"]); return prisma.envelope.findMany({ orderBy:{ createdAt:"asc" } }); }
export async function listRecurringCharges(){ await requireRole(["operator","manager","auditor"]); return prisma.recurringCharge.findMany({ orderBy:{ createdAt:"asc" } }); }

export async function upsertRecurringCharge(input:{ id?:string; name:string; amount:number; frequency?:string; envelopeId?:string|null }){
  await requireRole(["manager"]);
  const p = input;
  const data:any = { name: p.name, amount: p.amount, frequency: p.frequency ?? 'monthly', envelopeId: p.envelopeId ?? null };
  if(p.id) return prisma.recurringCharge.update({ where:{ id: p.id }, data });
  return prisma.recurringCharge.create({ data });
}

export async function deleteRecurringCharge(input:{ id:string }){ await requireRole(["manager"]); const { id } = input; return prisma.recurringCharge.delete({ where:{ id } }); }
export async function listServices(){ await requireRole(["operator","manager","auditor"]); return prisma.service.findMany({ orderBy:{ createdAt:"asc" } }); }
export async function getActiveRule(){ await requireRole(["operator","manager","auditor"]); const r=await _get(); if(!r) return null; return { id:r.id, startsAt:r.startsAt, endsAt:r.endsAt??null, items:r.items.map(i=>({ envelopeId:i.envelopeId, percent:i.percent, envelopeName:i.envelope.name })) }; }
export async function listRulesHistory(){ await requireRole(["operator","manager","auditor"]); const rs=await prisma.distributionRule.findMany({ include:{ items:{ include:{ envelope:true } } }, orderBy:{ startsAt:"desc" } }); return rs.map(r=>({ id:r.id, startsAt:r.startsAt, endsAt:r.endsAt??null, items:r.items.map(i=>({ envelopeId:i.envelopeId, percent:i.percent, envelopeName:i.envelope.name })) })); }
export async function upsertEnvelope(input:{id?:string;name:string;emoji?:string;protected?:boolean;active?:boolean; budgetTarget:number}){
  await requireRole(["manager"]);
  const p=UpsertEnvelopeSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; "));
  const data:any = { name:p.data.name, emoji:p.data.emoji??null, protected:p.data.protected??false, active:p.data.active??true };
  data.budgetTarget = (p.data as any).budgetTarget ?? null;
  if(p.data.id) return prisma.envelope.update({ where:{ id:p.data.id }, data }); return prisma.envelope.create({ data });
}
export async function toggleEnvelopeActive(input:{id:string;active:boolean}){ await requireRole(["manager"]); const p=ToggleEnvelopeActiveSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; ")); return prisma.envelope.update({ where:{ id:p.data.id }, data:{ active:p.data.active } }); }
export async function toggleEnvelopeProtected(input:{id:string;protected:boolean}){ await requireRole(["manager"]); const p=ToggleEnvelopeProtectedSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; ")); return prisma.envelope.update({ where:{ id:p.data.id }, data:{ protected:p.data.protected } }); }
export async function upsertService(input:{id?:string;name:string;active?:boolean}){ await requireRole(["manager"]); const p=UpsertServiceSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; ")); const data={ name:p.data.name, active:p.data.active??true }; if(p.data.id) return prisma.service.update({ where:{ id:p.data.id }, data }); return prisma.service.create({ data }); }
export async function toggleService(input:{id:string;active:boolean}){ await requireRole(["manager"]); const p=ToggleServiceSchema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; ")); return prisma.service.update({ where:{ id:p.data.id }, data:{ active:p.data.active } }); }

export async function deleteService(input:{ id:string }){
  await requireRole(["manager"]);
  const { id } = input;
  const exists = await prisma.service.findUnique({ where:{ id } });
  if(!exists) throw new Error('Service introuvable');
  await prisma.service.delete({ where:{ id } });
  await prisma.auditLog.create({ data: { action: 'service.delete', metaJson: JSON.stringify({ id, name: exists.name }) } });
  return { ok:true };
}

// ChargeType CRUD supprimé — plus de modèle séparé pour les types

export async function deleteEnvelope(input:{id:string}){
  await requireRole(["manager"]);
  const { id } = input;
  // Interdire suppression si des allocations existent
  const allocCount = await prisma.transactionAllocation.count({ where: { envelopeId: id } });
  const ruleRefCount = await prisma.distributionRuleItem.count({ where: { envelopeId: id } });

  // Best practice: do NOT force-delete envelopes that have historical allocations or are referenced by rules.
  // Instead, disable the envelope so data integrity is preserved while removing it from active use.
  if(allocCount>0 || ruleRefCount>0){
    // Mark as inactive (soft-delete) and return an informative result for the caller
    await prisma.envelope.update({ where: { id }, data: { active: false } });
    return { ok:false, deactivated:true, message: "Enveloppe désactivée car liée à des allocations ou à une règle (préservation historique)." };
  }

  // If no historical links, allow real deletion
  await prisma.envelope.delete({ where: { id } });
  return { ok:true, deleted:true };
}

export async function forceDeleteEnvelope(input:{id:string}){
  await requireRole(["manager"]);
  const { id } = input;
  const exists = await prisma.envelope.findUnique({ where:{ id } });
  if(!exists) throw new Error("Enveloppe introuvable");

  // Delete allocations and any distribution rule items referencing it
  await prisma.transactionAllocation.deleteMany({ where: { envelopeId: id } });
  await prisma.distributionRuleItem.deleteMany({ where: { envelopeId: id } });

  // Delete the envelope itself
  await prisma.envelope.delete({ where: { id } });

  // Log an anomaly to record the destructive action
  await prisma.anomaly.create({ data: { level: 'info', code: 'ENVELOPE_FORCE_DELETED', details: `Envelope ${exists.name} (${id}) permanently deleted by manager` } });

  return { ok:true, deleted:true };
}

// Calcule des pourcentages recommandés à partir d'un revenu total (preview only)
export async function recommendPercentages(input:{ amount:number; imprevusPercent?:number }){
  await requireRole(["manager"]);
  const amount = Number(input.amount || 0);
  if(!Number.isFinite(amount) || amount <= 0) throw new Error("Montant de revenu invalide");
  const imprevusPct = typeof input.imprevusPercent === 'number' ? Number(input.imprevusPercent) : 10;

  // Ensure an 'Imprévus' envelope exists before computations
  await ensureImprevusEnvelope();
  const envs = await prisma.envelope.findMany({ where: { active: true } });
  // include recurring charges (normalized to monthly) to be considered as blocked-like obligations
  const recs = await prisma.recurringCharge.findMany({ where: { envelopeId: { in: envs.map(e=>e.id) } } });
  const recMap = new Map<string, number>();
  recs.forEach(r=>{
    let monthly = Number(r.amount || 0);
    if(r.frequency === 'weekly') monthly = Math.round(monthly * 4.345); // weeks to month
    if(r.frequency === 'yearly') monthly = Math.round(monthly / 12);
    if(r.envelopeId) recMap.set(r.envelopeId, (recMap.get(r.envelopeId) || 0) + monthly);
  });
  // identify imprevus envelope
  const imprevus = envs.find(e => (e.name || '').toLowerCase().includes('imprev') || (e.name || '').toLowerCase().includes('imprévu'));

  const totalRevenue = amount;
  let allocated = 0;
  const results: any[] = [];

  // allocate imprevus first
  if(imprevus){
    const imprevusAmount = Math.round(totalRevenue * (imprevusPct/100));
    allocated += imprevusAmount;
    results.push({ envelopeId: imprevus.id, name: imprevus.name, amount: imprevusAmount, percent: +(100 * imprevusAmount / totalRevenue).toFixed(2) });
  }

  // blocked envelopes: those marked protected or classified as 'blocked'
  const blocked = envs.filter(e => (e.protected === true) || (e.classification === 'blocked')).filter(e=> !imprevus || e.id !== imprevus.id);
  // allocate budgetTargets for blocked if present
  for(const b of blocked){
    const budgetAmt = b.budgetTarget ? Number(b.budgetTarget) : 0;
    const recAmt = recMap.get(b.id) ?? 0;
    const amt = budgetAmt + recAmt;
    allocated += amt;
    results.push({ envelopeId: b.id, name: b.name, amount: amt, percent: +(100 * (amt) / totalRevenue).toFixed(2) });
  }

  // remaining for flex envelopes
  const flex = envs.filter(e => !( (e.protected === true) || (e.classification === 'blocked') )).filter(e=> !imprevus || e.id !== imprevus.id);
  const remaining = Math.max(0, totalRevenue - allocated);
  // weights: budgetTarget if present else 1
  const weights = flex.map(f => f.budgetTarget ? Number(f.budgetTarget) : 1);
  const weightSum = weights.reduce((s,w)=>s+w, 0) || 1;
  flex.forEach((f, idx)=>{
    const amt = Math.round(remaining * (weights[idx] / weightSum));
    results.push({ envelopeId: f.id, name: f.name, amount: amt, percent: +(100 * amt / totalRevenue).toFixed(2) });
  });

  // normalize rounding differences: ensure sum of amounts equals totalRevenue
  const sumAllocated = results.reduce((s,r)=> s + Number(r.amount||0), 0);
  const diff = totalRevenue - sumAllocated;
  if(diff !== 0 && results.length){ results[0].amount = Number(results[0].amount) + diff; results[0].percent = +(100 * results[0].amount / totalRevenue).toFixed(2); }

  return results;
}

// Applique les pourcentages recommandés (met à jour Envelope.defaultPercent)
export async function setOnboardingRevenue(input:{ amount:number; imprevusPercent?:number, user?:string }){
  await requireRole(["manager"]);
  const rec = await recommendPercentages({ amount: input.amount, imprevusPercent: input.imprevusPercent });
  // persist defaultPercent per envelope
  const tx = await prisma.$transaction(rec.map(r=> prisma.envelope.update({ where:{ id: r.envelopeId }, data: { defaultPercent: Number(Number(r.percent).toFixed(2)) } })));
  // audit log
  await prisma.auditLog.create({ data: { action: 'setOnboardingRevenue', metaJson: JSON.stringify({ amount: input.amount, user: input.user ?? null, applied: rec.length }) } });
  return { ok:true, applied: rec.length, recommendations: rec };
}

// Analyse historique et propose des ajustements de pourcentages par enveloppe
export async function proposePercentAdjustments(input?:{ months?:number }){
  await requireRole(["manager"]);
  const months = input?.months ?? 3;
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  const envs = await prisma.envelope.findMany({ where: { active: true }, select: { id:true, name:true, defaultPercent:true, protected:true } });
  const ids = envs.map(e=>e.id);
  if(ids.length===0) return [] as any[];

  const outs = await prisma.transactionAllocation.groupBy({ by: ['envelopeId'], where: { envelopeId: { in: ids }, transaction: { kind: 'OUT', at: { gte: since } } }, _sum: { amount: true } });
  const totalOut = outs.reduce((s,o)=> s + (o._sum.amount ?? 0), 0);
  const outMap = new Map(outs.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  const recommendations = envs.map(e=>{
    const outVal = outMap.get(e.id) ?? 0;
    const observedPct = totalOut > 0 ? (outVal / totalOut) * 100 : 0;
    // If envelope is protected, ensure suggested is at least current default
    const suggested = e.protected ? Math.max(e.defaultPercent ?? 0, Number(observedPct.toFixed(2))) : Number(observedPct.toFixed(2));
    return { envelopeId: e.id, name: e.name, observedPercent: Number(observedPct.toFixed(2)), suggestedPercent: Number(suggested.toFixed(2)), currentDefault: e.defaultPercent ?? null };
  }).sort((a,b)=> (b.suggestedPercent - a.suggestedPercent));

  return { months, totalOut, recommendations };
}

export async function applySuggestedPercents(input:{ items:{ envelopeId:string; percent:number }[], user?:string }){
  await requireRole(["manager"]);
  const tx = await prisma.$transaction(input.items.map(it=> prisma.envelope.update({ where:{ id: it.envelopeId }, data: { defaultPercent: Number(Number(it.percent).toFixed(2)) } })));
  await prisma.auditLog.create({ data: { action: 'applySuggestedPercents', metaJson: JSON.stringify({ count: input.items.length, user: input.user ?? null }) } });
  return { ok:true, applied: input.items.length };
}

// Crée des anomalies pour les enveloppes dont la couverture (mois) est inférieure au seuil
export async function createLowCoverageAnomalies(input?: { thresholdMonths?: number }){
  await requireRole(["manager","operator"]);
  const threshold = input?.thresholdMonths ?? 2;
  // reuse coverage helper
  const { getEnvelopeCoverageAll } = await import('@/server/queries/envelopes');
  const covs = await getEnvelopeCoverageAll({ daysWindow: 90 });
  const low = covs.filter((c:any)=> (c.monthsCoverage !== Infinity && c.monthsCoverage < threshold));
  let created = 0;
  for(const c of low){
    // avoid duplicate open anomaly with same code
    const existing = await prisma.anomaly.findFirst({ where: { code: 'LOW_COVERAGE', details: { contains: c.envelopeId } , resolvedAt: null } });
    if(existing) continue;
    // create anomaly + audit log (Slack notifications removed)
    await prisma.anomaly.create({ data: { level: 'warning', code: 'LOW_COVERAGE', details: `Enveloppe ${c.name} (${c.envelopeId}) couverture faible: ${c.monthsCoverage} mois` } });
    await prisma.auditLog.create({ data: { action: 'anomaly.create', metaJson: JSON.stringify({ envelopeId: c.envelopeId, name: c.name, monthsCoverage: c.monthsCoverage }) } });
    created++;
  }
  return { ok:true, created };
}

export async function logEnvelopeRestore(input:{id:string, user?:string}){
  await requireRole(["manager"]);
  const { id, user } = input;
  const env = await prisma.envelope.findUnique({ where:{ id } });
  if(!env) throw new Error("Enveloppe introuvable");
  await prisma.anomaly.create({ data:{ level:'info', code:'ENVELOPE_RESTORED', details: `Envelope ${env.name} (${id}) restored by ${user ?? 'unknown'}` } });
  return { ok:true };
}

export async function getOnboardingRevenue(){
  await requireRole(["operator","manager","auditor"]);
  // read last auditLog entry for setOnboardingRevenue
  const row = await prisma.auditLog.findFirst({ where: { action: 'setOnboardingRevenue' }, orderBy: { createdAt: 'desc' } });
  if(!row) return { amount: null };
  try{ const meta = JSON.parse(row.metaJson || '{}'); return { amount: Number(meta.amount) || null, applied: meta.applied || 0, user: meta.user ?? null, at: row.createdAt }; }
  catch(e){ return { amount: null }; }
}

async function ensureImprevusEnvelope(){
  const nameCandidates = ['imprevus','imprévu','imprevu','buffer','reserve'];
  // SQLite does not support `mode: 'insensitive'` in contains; fallback to simple contains
  const existing = await prisma.envelope.findFirst({ where: { OR: nameCandidates.map(n=>({ name: { contains: n } })) } });
  if(existing) return existing;
  return await prisma.envelope.create({ data: { name: 'Imprévus', emoji: '🧰', protected: false, active:true, budgetTarget: null } });
}
