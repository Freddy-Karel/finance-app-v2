import { prisma } from "@/lib/prisma";
export async function getAllEnvelopeBalances(){
  // Only consider active envelopes for balances shown in the app (dashboard, lists)
  const envs=await prisma.envelope.findMany({ where: { active: true }, select:{id:true,name:true,protected:true,active:true, emoji:true, budgetTarget:true}});
  const dist=await prisma.transactionAllocation.groupBy({by:["envelopeId"], _sum:{amount:true}, where:{transaction:{kind:"DIST"}}});
  const outs=await prisma.transactionAllocation.groupBy({by:["envelopeId"], _sum:{amount:true}, where:{transaction:{kind:"OUT"}}});
  const mapD=new Map(dist.map(d=>[d.envelopeId, d._sum.amount??0])); const mapO=new Map(outs.map(o=>[o.envelopeId, o._sum.amount??0]));
  return envs.map(e=>{ const inflow=mapD.get(e.id)??0, outflow=mapO.get(e.id)??0; const total = typeof e.budgetTarget === 'number' ? e.budgetTarget : inflow; const balance = total - outflow; return { envelopeId:e.id, name:e.name, protected:e.protected, active:e.active, emoji: e.emoji ?? null, budgetTarget: e.budgetTarget ?? null, inflow, outflow, balance }; });
}

// Retourne la couverture (en mois) des enveloppes classées "blocked" ou protégées.
export async function getBlockedEnvelopeCoverage(){
  const now = new Date();
  const daysWindow = 90; // use last 90 days to compute average
  const since = new Date(now.getTime() - daysWindow * 24 * 3600 * 1000);

  const envs = await prisma.envelope.findMany({ where: { active: true, OR: [{ protected: true }, { classification: 'blocked' }] }, select: { id:true, name:true, emoji:true, budgetTarget:true } });
  if(envs.length===0) return [] as any[];

  const ids = envs.map(e=>e.id);

  // sum of OUT amounts over the window
  const outs = await prisma.transactionAllocation.groupBy({
    by: ['envelopeId'],
    where: { envelopeId: { in: ids }, transaction: { kind: 'OUT', at: { gte: since } } },
    _sum: { amount: true }
  });

  const outMap = new Map(outs.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  // current balances using existing helper logic: inflow/outflow all-time
  const dist = await prisma.transactionAllocation.groupBy({ by: ['envelopeId'], where: { envelopeId: { in: ids }, transaction: { kind: 'DIST' } }, _sum: { amount: true } });
  const outsAll = await prisma.transactionAllocation.groupBy({ by: ['envelopeId'], where: { envelopeId: { in: ids }, transaction: { kind: 'OUT' } }, _sum: { amount: true } });
  const distMap = new Map(dist.map(d=>[d.envelopeId, d._sum.amount ?? 0]));
  const outsAllMap = new Map(outsAll.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  const res = envs.map(e=>{
    const allocated = distMap.get(e.id) ?? 0;
    const spentAll = outsAllMap.get(e.id) ?? 0;
    const balance = (typeof e.budgetTarget === 'number' ? e.budgetTarget : allocated) - spentAll;
    const outLast90 = outMap.get(e.id) ?? 0;
    const avgMonthly = outLast90 / daysWindow * 30; // approximate month
    const months = avgMonthly > 0 ? Number((balance / avgMonthly).toFixed(1)) : (balance > 0 ? Infinity : 0);
    return { envelopeId: e.id, name: e.name, emoji: e.emoji ?? null, balance, avgMonthly: Math.round(avgMonthly), monthsCoverage: months };
  });

  return res;
}

// Retourne la couverture (en mois) pour toutes les enveloppes actives.
export async function getEnvelopeCoverageAll(options?: { daysWindow?: number }){
  const daysWindow = options?.daysWindow ?? 90;
  const now = new Date();
  const since = new Date(now.getTime() - daysWindow * 24 * 3600 * 1000);

  const envs = await prisma.envelope.findMany({ where: { active: true }, select: { id:true, name:true, emoji:true, budgetTarget:true } });
  if(envs.length===0) return [] as any[];

  const ids = envs.map(e=>e.id);

  const outs = await prisma.transactionAllocation.groupBy({
    by: ['envelopeId'],
    where: { envelopeId: { in: ids }, transaction: { kind: 'OUT', at: { gte: since } } },
    _sum: { amount: true }
  });

  const outMap = new Map(outs.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  const dist = await prisma.transactionAllocation.groupBy({ by: ['envelopeId'], where: { envelopeId: { in: ids }, transaction: { kind: 'DIST' } }, _sum: { amount: true } });
  const outsAll = await prisma.transactionAllocation.groupBy({ by: ['envelopeId'], where: { envelopeId: { in: ids }, transaction: { kind: 'OUT' } }, _sum: { amount: true } });
  const distMap = new Map(dist.map(d=>[d.envelopeId, d._sum.amount ?? 0]));
  const outsAllMap = new Map(outsAll.map(o=>[o.envelopeId, o._sum.amount ?? 0]));

  const res = envs.map(e=>{
    const allocated = distMap.get(e.id) ?? 0;
    const spentAll = outsAllMap.get(e.id) ?? 0;
    const balance = (typeof e.budgetTarget === 'number' ? e.budgetTarget : allocated) - spentAll;
    const outLast = outMap.get(e.id) ?? 0;
    const avgMonthly = outLast / daysWindow * 30;
    const months = avgMonthly > 0 ? Number((balance / avgMonthly).toFixed(1)) : (balance > 0 ? Infinity : 0);
    return { envelopeId: e.id, name: e.name, emoji: e.emoji ?? null, balance, avgMonthly: Math.round(avgMonthly), monthsCoverage: months };
  });

  return res;
}
