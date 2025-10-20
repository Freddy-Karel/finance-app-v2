import { prisma } from "@/lib/prisma";
export async function getActiveDistributionRule(){
  const now=new Date();
  return prisma.distributionRule.findFirst({ where:{ startsAt:{lte:now}, OR:[{endsAt:null},{endsAt:{gt:now}}] }, include:{ items:{ include:{ envelope:true } } }, orderBy:{ startsAt:"desc" } });
}
export function computeProposal(onHand:number, items:{envelopeId:string;percent:number;envelopeName:string}[]){
  const res=items.map(i=>({ envelopeId:i.envelopeId, name:i.envelopeName, percent:i.percent, suggestedAmount: Math.floor(onHand*i.percent/100) }));
  const sum=res.reduce((s,r)=>s+r.suggestedAmount,0); let diff=onHand-sum, idx=0;
  while(diff>0 && res.length){ res[idx%res.length].suggestedAmount++; idx++; diff--; }
  return res;
}
