import { prisma } from "@/lib/prisma";
import type { TransactionRow, EnvelopeExecutionRow, Allocation } from "@/server/types";

function parseRange(startStr: string, endStr: string) {
  return { start: new Date(startStr + "T00:00:00.000Z"), end: new Date(endStr + "T23:59:59.999Z") };
}

export async function fetchTransactionsReport(p: { start: string; end: string; type?: "IN" | "OUT" | "DIST"; envelopeId?: string; serviceId?: string; limit: number; offset: number }): Promise<TransactionRow[]> {
  const { start, end } = parseRange(p.start, p.end);
  const where: any = { at: { gte: start, lte: end } };
  if(p.type) where.kind=p.type; if(p.serviceId) where.serviceId=p.serviceId;
  const includeAlloc = !!p.envelopeId || where.kind==="OUT" || where.kind==="DIST" || !where.kind;
  const txs = await prisma.transaction.findMany({
    where,
    include: includeAlloc ? { allocs: p.envelopeId ? { where: { envelopeId: p.envelopeId }, include: { envelope: true } } : { include: { envelope: true } } } : undefined,
    orderBy: { at: "asc" },
    take: p.limit,
    skip: p.offset,
  });

  return txs.map((t) => {
    const rawAllocs = (t as any).allocs as ( { envelopeId: string; envelope?: { name?: string }; amount: number }[] | undefined) ?? [];
    const allocations: Allocation[] = rawAllocs.map((a) => ({ envelopeId: a.envelopeId, envelopeName: a.envelope?.name ?? "", amount: a.amount }));
    return { id: t.id, kind: t.kind as "IN" | "OUT" | "DIST", label: t.label ?? null, amount: t.amount, at: t.at, serviceId: t.serviceId ?? null, allocations };
  });
}
export async function fetchEnvelopeExecution(p:{start:string;end:string}){
  const { start, end } = parseRange(p.start, p.end);
  const inflows = await prisma.transactionAllocation.groupBy({ by: ["envelopeId"], _sum: { amount: true }, where: { transaction: { kind: "DIST", at: { gte: start, lte: end } } } });
  const outflows = await prisma.transactionAllocation.groupBy({ by: ["envelopeId"], _sum: { amount: true }, where: { transaction: { kind: "OUT", at: { gte: start, lte: end } } } });
  const envs=await prisma.envelope.findMany({select:{id:true,name:true,protected:true,active:true}});
  const mapIn=new Map(inflows.map(i=>[i.envelopeId,i._sum.amount??0])); const mapOut=new Map(outflows.map(o=>[o.envelopeId,o._sum.amount??0]));
  return envs.map((e) => { const inflow = mapIn.get(e.id) ?? 0; const outflow = mapOut.get(e.id) ?? 0; return { envelopeId: e.id, name: e.name, protected: e.protected, active: e.active, inflow, outflow, delta: inflow - outflow } as EnvelopeExecutionRow; }).sort((a, b) => a.name.localeCompare(b.name));
}
export function toCSV(rows:Record<string,any>[], headers?:string[]){
  if(!rows.length) return ""; const cols=headers??Object.keys(rows[0]);
  const esc=(v:any)=>{ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
  const out=[cols.join(",")]; for(const r of rows) out.push(cols.map(c=>esc(r[c])).join(",")); return out.join("\n");
}
