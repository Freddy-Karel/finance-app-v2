"use server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReferencePeriodSchema, AdoptRuleSchema } from "@/server/validators/reference";
import { getSuggestedDistribution } from "@/server/queries/reference";

export async function computeReference(input:{start:string; end:string; basis?: "OUT"|"DIST"}){
  await requireRole(["manager","auditor","operator"]);
  const p = ReferencePeriodSchema.safeParse(input);
  if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; "));
  return getSuggestedDistribution(p.data);
}

export async function adoptSuggestedRule(input:{ items:{envelopeId:string; name?:string; amount:number; percent:number}[] }){
  await requireRole(["manager"]); // adoption de règle réservée au manager
  const p = AdoptRuleSchema.safeParse(input);
  if(!p.success) throw new Error(p.error.errors.map(e=>e.message).join("; "));

  // Vérifier somme = 100
  const sum = p.data.items.reduce((s,i)=> s + i.percent, 0);
  if(sum !== 100) throw new Error("La somme des pourcentages doit être égale à 100%.");

  // Clôturer la règle active actuelle (si existe)
  const now = new Date();
  await prisma.$transaction(async(tx:any)=>{
    const current = await tx.distributionRule.findFirst({
      where: { endsAt: null },
      orderBy: { startsAt: "desc" },
      select: { id:true },
    });
    if(current){
      await tx.distributionRule.update({
        where: { id: current.id },
        data: { endsAt: now },
      });
    }
    // Créer nouvelle règle
    const rule = await tx.distributionRule.create({
      data: {
        startsAt: now,
        items: {
          create: p.data.items.map(i => ({
            envelopeId: i.envelopeId,
            percent: i.percent,
          })),
        },
      },
      select: { id: true },
    });
    return rule.id;
  });

  return { ok:true };
}
