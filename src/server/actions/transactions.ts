"use server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { CreateIncomeSchema, CreateExpenseSchema } from "@/server/validators/transactions";
import { z } from "zod";
import { getAllEnvelopeBalances } from "@/server/queries/envelopes";
// Type policies removed with ChargeType refactor; policy checks removed/simplified
import type { AnomalyListItem } from "@/server/types";

export async function createIncome(input:{serviceId:string;amount:number;note?:string}){
  await requireRole(["operator","manager"]);
  const parsed=CreateIncomeSchema.safeParse(input); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  const tx=await prisma.transaction.create({ data:{ kind:"IN", label:"Entrée", amount:parsed.data.amount, at:new Date(), serviceId:parsed.data.serviceId } });
  return { transactionId: tx.id };
}

export async function createExpense(input:{ total:number; allocations:{ envelopeId:string; amount:number }[]; allowOverride?:boolean; overrideReason?:string }){
  await requireRole(["operator","manager"]);
  const parsed=CreateExpenseSchema.safeParse(input); if(!parsed.success) throw new Error(parsed.error.errors.map(e=>e.message).join("; "));
  // Charger enveloppes pour validations simples (existence / active / protected)
  const envIds = parsed.data.allocations.map((a:any)=> a.envelopeId);
  const envWithTypes = await prisma.envelope.findMany({ where: { id: { in: envIds } }, select: { id:true, name:true, protected:true, active:true } });
  const map = new Map(envWithTypes.map((e:any)=>[e.id, e]));
  const balances = await getAllEnvelopeBalances();
  const envs = envWithTypes.map((e:any)=>({ id:e.id, name:e.name, protected:e.protected, active:e.active }));
  type Env = { id:string; name:string; protected:boolean; active:boolean };
  type Bal = { envelopeId:string; balance:number };
  const envMap=new Map((envs as Env[]).map((e:Env)=>[e.id,e]));
  const balMap=new Map((balances as Bal[]).map((b:Bal)=>[b.envelopeId,b.balance]));
  const anomalies: {level:"critical"|"warning"; code:string; details:string}[] = [];
  for(const a of parsed.data.allocations){
    const env = envMap.get(a.envelopeId) as Env | undefined;
    if(!env) throw new Error("Enveloppe inconnue");
    if(!env.active) throw new Error(`Enveloppe ${env.name} inactive`);
    const available = balMap.get(a.envelopeId) ?? 0;
    if(env.protected && !parsed.data.allowOverride) throw new Error(`Enveloppe protégée (${env.name}) — dérogation requise`);
    if(env.protected && parsed.data.allowOverride) anomalies.push({ level:"critical", code:"PROTECTED_ENVELOPE_USED", details:`Dépense sur enveloppe protégée (${env.name})` });
    if(a.amount > available){
      if(!parsed.data.allowOverride) throw new Error(`Allocation > solde (${env.name})`);
      anomalies.push({ level:"warning", code:"NEGATIVE_BALANCE", details:`Allocation ${a.amount} > solde ${available} sur ${env.name}` });
    }
  }
  const tx=await prisma.transaction.create({ data:{ kind:"OUT", label:"Dépense", amount:parsed.data.total, at:new Date() } });
  await prisma.transactionAllocation.createMany({ data: parsed.data.allocations.map(a=>({ transactionId:tx.id, envelopeId:a.envelopeId, amount:a.amount })) });
  if(anomalies.length){ await prisma.anomaly.createMany({ data: anomalies.map(an=>({ level:an.level, code:an.code, details: parsed.data.overrideReason?`${an.details} — Raison: ${parsed.data.overrideReason}`:an.details, transactionId:tx.id })) }); }
  return { transactionId: tx.id, anomalies };
}

export async function createTransfer(input:{ fromEnvelopeId:string; toEnvelopeId:string; amount:number; allowOverride?:boolean; reason?:string }){
  await requireRole(["operator","manager"]);
  const Schema = z.object({ fromEnvelopeId: z.string().min(1), toEnvelopeId: z.string().min(1), amount: z.number().int().positive(), allowOverride: z.boolean().optional(), reason: z.string().max(500).optional() });
  const p = Schema.safeParse(input); if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join('; '));

  const { fromEnvelopeId, toEnvelopeId, amount, allowOverride, reason } = p.data;
  if(fromEnvelopeId === toEnvelopeId) throw new Error("Les enveloppes source et destination doivent être différentes");

  const envs = await prisma.envelope.findMany({ where: { id: { in: [fromEnvelopeId, toEnvelopeId] } }, select: { id:true, name:true, protected:true, active:true } });
  const envMap = new Map(envs.map(e=>[e.id,e]));
  const fromEnv = envMap.get(fromEnvelopeId); const toEnv = envMap.get(toEnvelopeId);
  if(!fromEnv) throw new Error("Enveloppe source introuvable");
  if(!toEnv) throw new Error("Enveloppe destination introuvable");
  if(!fromEnv.active) throw new Error(`Enveloppe source (${fromEnv.name}) inactive`);
  if(!toEnv.active) throw new Error(`Enveloppe destination (${toEnv.name}) inactive`);

  const balances = await getAllEnvelopeBalances();
  const balMap = new Map((balances as any[]).map((b:any)=>[b.envelopeId, b.balance]));
  const available = balMap.get(fromEnvelopeId) ?? 0;

  const anomalies: { level: 'critical'|'warning'; code:string; details:string }[] = [];

  if(fromEnv.protected && !allowOverride) throw new Error(`Enveloppe protégée (${fromEnv.name}) — dérogation requise`);
  if(amount > available){
    if(!allowOverride) throw new Error(`Montant > solde disponible (${fromEnv.name})`);
    anomalies.push({ level: 'warning', code: 'NEGATIVE_BALANCE_TRANSFER', details: `Transfert ${amount} > solde ${available} depuis ${fromEnv.name}` });
  }

  // Create OUT transaction (debit from source)
  const outTx = await prisma.transaction.create({ data: { kind: 'OUT', label: `Transfert vers ${toEnv.name}`, amount, at: new Date() } });
  await prisma.transactionAllocation.create({ data: { transactionId: outTx.id, envelopeId: fromEnvelopeId, amount } });

  // Create IN transaction (credit to destination)
  const inTx = await prisma.transaction.create({ data: { kind: 'IN', label: `Transfert depuis ${fromEnv.name}`, amount, at: new Date() } });
  await prisma.transactionAllocation.create({ data: { transactionId: inTx.id, envelopeId: toEnvelopeId, amount } });

  if(anomalies.length){
    await prisma.anomaly.createMany({ data: anomalies.map(a=>({ level: a.level, code: a.code, details: (a.details + (reason ? ` — Raison: ${reason}` : '')), transactionId: outTx.id })) });
  }

  return { outTransactionId: outTx.id, inTransactionId: inTx.id, anomalies };
}

// Adapter to accept a FormData from a form[action] submission.
export async function createExpenseForm(formData: FormData){
  // Parse structured form fields:
  // total, allowOverride, overrideReason, allocations[i].envelopeId, allocations[i].amount
  const totalRaw = formData.get('total');
  const total = totalRaw ? Number(totalRaw) : 0;
  const allowOverride = formData.get('allowOverride') === 'on' || formData.get('allowOverride') === 'true';
  const overrideReason = String(formData.get('overrideReason') ?? "");

  // Collect allocations by scanning keys like allocations[0].envelopeId and allocations[0].amount
  const allocations: { envelopeId:string; amount:number }[] = [];
  for(const key of Array.from(formData.keys())){
    const m = key.match(/^allocations\[(\d+)\]\.(envelopeId|amount)$/);
    if(m){
      const idx = Number(m[1]);
      const field = m[2];
      allocations[idx] = allocations[idx] ?? { envelopeId: "", amount: 0 };
      const val = formData.get(key);
      if(field === 'envelopeId') allocations[idx].envelopeId = String(val ?? "");
      if(field === 'amount') allocations[idx].amount = Number(val ?? 0);
    }
  }

  // Filter out empty allocation slots
  const allocsFiltered = allocations.filter(a => a && a.envelopeId && Number(a.amount) > 0);

  const input = { total, allocations: allocsFiltered, allowOverride, overrideReason };
  return createExpense(input);
}
