import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEnvelopeCoverageAll } from '@/server/queries/envelopes';

export async function POST(req: Request) {
  const secret = req.headers.get('x-job-secret') || process.env.JOB_SECRET || '';
  if (!secret || secret !== (process.env.JOB_SECRET || '')) return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 });

  try{
    const covs = await getEnvelopeCoverageAll({ daysWindow: 90 });
    let created = 0;
    for(const c of covs){
      if(c.monthsCoverage !== Infinity && c.monthsCoverage < 2){
        const exists = await prisma.anomaly.findFirst({ where: { code: 'LOW_COVERAGE', details: { contains: c.envelopeId }, resolvedAt: null } });
        if(!exists){
          await prisma.anomaly.create({ data: { level: 'warning', code: 'LOW_COVERAGE', details: `Enveloppe ${c.name} (${c.envelopeId}) couverture faible: ${c.monthsCoverage} mois` } });
          created++;
        }
      }
    }
    return NextResponse.json({ ok: true, created });
  }catch(e:any){
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}




