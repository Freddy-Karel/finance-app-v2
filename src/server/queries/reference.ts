import { prisma } from "@/lib/prisma";
import { ReferencePeriodSchema } from "@/server/validators/reference";

type Basis = "OUT" | "DIST";

export async function getSuggestedDistribution(input:{start:string; end:string; basis?:Basis}){
  const p = ReferencePeriodSchema.parse(input);
  const range = {
    gte: new Date(p.start + "T00:00:00.000Z"),
    lte: new Date(p.end   + "T23:59:59.999Z"),
  };

  // On part par défaut des DÉPENSES réelles (OUT) pour calibrer la règle.
  // Optionnel : utiliser l’historique des DISTRIBUTIONS (DIST).
  const kind = p.basis ?? "OUT";

  // Agrégat par enveloppe via allocations des transactions du type choisi.
  const grouped = await prisma.transactionAllocation.groupBy({
    by: ["envelopeId"],
    where: { transaction: { kind, at: range } },
    _sum: { amount: true },
  });

  // Récupérer noms/propriétés des enveloppes
  type GroupedRow = { envelopeId: string; _sum: { amount: number | null } };
  const ids = grouped.map((g:GroupedRow) => g.envelopeId);
  const envs = await prisma.envelope.findMany({
    where: { id: { in: ids } },
    select: { id:true, name:true },
  });
  const nameMap = new Map(envs.map((e:{id:string;name:string})=>[e.id, e.name]));

  type Row = { envelopeId:string; name:string; amount:number };
  const rows: Row[] = grouped.map((g:GroupedRow) => ({
    envelopeId: g.envelopeId,
    name: nameMap.get(g.envelopeId) ?? g.envelopeId,
    amount: Number(g._sum.amount ?? 0),
  })).filter((r:Row) => r.amount > 0);

  const total = rows.reduce((s,r)=> s + r.amount, 0);
  if(total <= 0){
    return { basis: kind, total: 0, items: [] as { envelopeId:string; name:string; amount:number; percent:number }[] };
  }

  // Pourcentages arrondis qui somment à 100 (méthode "largest remainder")
  const raw = rows.map(r => ({ ...r, exact: (r.amount*100)/total }));
  const base = raw.map(r => ({ ...r, floor: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
  let sum = base.reduce((s,r)=> s + r.floor, 0);
  const need = 100 - sum;
  const sorted = [...base].sort((a,b)=> b.frac - a.frac);
  for(let i=0;i<need;i++){ sorted[i].floor += 1; }
  const result = base.map(r => {
    const found = sorted.find(s=>s.envelopeId===r.envelopeId) ?? r;
    return { envelopeId:r.envelopeId, name:r.name, amount:r.amount, percent: found.floor };
  });

  return { basis: kind, total, items: result };
}
