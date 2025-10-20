import { prisma } from "@/lib/prisma"; import { cache } from "react";
function startEnd(d:string){ return { start:new Date(d+"T00:00:00.000Z"), end:new Date(d+"T23:59:59.999Z") }; }
export const getDayTotals = cache(async (dateISO:string)=>{
  const {start,end}=startEnd(dateISO);
  const [i,o]=await Promise.all([
    prisma.transaction.aggregate({_sum:{amount:true}, where:{kind:"IN", at:{gte:start,lte:end}}}),
    prisma.transaction.aggregate({_sum:{amount:true}, where:{kind:"OUT", at:{gte:start,lte:end}}})
  ]);
  const _in=i._sum.amount??0, _out=o._sum.amount??0; return { in:_in, out:_out, onHand:_in-_out };
});
