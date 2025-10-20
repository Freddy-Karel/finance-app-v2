import { NextResponse } from 'next/server';
import { getEnvelopesWithStats } from '@/server/actions/envelopes';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const res = await getEnvelopesWithStats(body as any);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}


