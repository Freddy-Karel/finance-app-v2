import { NextResponse } from 'next/server';
import { createTransfer } from '@/server/actions/transactions';

export async function POST(req: Request){
  try{
    const body = await req.json();
    const res = await createTransfer(body);
    return NextResponse.json(res);
  }catch(e:any){ return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status: 500 }); }
}




