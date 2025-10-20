"use server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export type EnvelopeStats = {
  envelopeId: string;
  name: string;
  emoji: string | null;
  protected: boolean;
  budgetTarget: number | null;
  allocated: number; // DIST
  spent: number; // OUT
  remaining: number;
  outCount: number;
};

// Retourne les stats par enveloppe. Si timeMin/timeMax fournis, filtre sur période, sinon agrégat all-time.
export async function getEnvelopesWithStats(input?: { timeMin?: string; timeMax?: string }){
  await requireRole(["operator","manager","auditor"]);

  let useWindow = false;
  let tMin: Date | undefined = undefined;
  let tMax: Date | undefined = undefined;
  if (input && (input.timeMin || input.timeMax)){
    useWindow = true;
    tMin = input.timeMin ? new Date(input.timeMin) : new Date(0);
    tMax = input.timeMax ? new Date(input.timeMax) : new Date();
  }

  const envs = await prisma.envelope.findMany({ where: { active: true }, orderBy:{ createdAt: "asc" } });
  const ids = envs.map(e=>e.id);
  if(ids.length===0) return [] as EnvelopeStats[];

  const dist = await prisma.transactionAllocation.groupBy({
    by: ["envelopeId"],
    where: useWindow ? { envelopeId: { in: ids }, transaction: { kind: "DIST", at: { gte: tMin, lte: tMax } } } : { envelopeId: { in: ids }, transaction: { kind: "DIST" } },
    _sum: { amount: true }
  });

  const outs = await prisma.transactionAllocation.groupBy({
    by: ["envelopeId"],
    where: useWindow ? { envelopeId: { in: ids }, transaction: { kind: "OUT", at: { gte: tMin, lte: tMax } } } : { envelopeId: { in: ids }, transaction: { kind: "OUT" } },
    _sum: { amount: true }
  });

  const outTxPairs = await prisma.transactionAllocation.groupBy({
    by: ["envelopeId", "transactionId"],
    where: useWindow ? { envelopeId: { in: ids }, transaction: { kind: "OUT", at: { gte: tMin, lte: tMax } } } : { envelopeId: { in: ids }, transaction: { kind: "OUT" } },
  });
  const outCountMap = new Map<string, number>();
  outTxPairs.forEach(r=>{ outCountMap.set(r.envelopeId, (outCountMap.get(r.envelopeId)||0)+1) });

  const distMap = new Map(dist.map(d=>[d.envelopeId, d._sum.amount ?? 0]));
  const outMap = new Map(outs.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  const merged: EnvelopeStats[] = envs.map(e=>{
    const allocated = distMap.get(e.id) ?? 0;
    const spent = outMap.get(e.id) ?? 0;
    // remaining = budgetTarget (if present) OR allocated, minus spent
    const remaining = ( (e as any).budgetTarget ?? allocated ) - spent;
    const outCount = outCountMap.get(e.id) ?? 0;
    return { envelopeId: e.id, name: e.name, emoji: e.emoji ?? null, protected: e.protected, budgetTarget: (e as any).budgetTarget ?? null, allocated, spent, remaining, outCount };
  });

  return merged;
}


