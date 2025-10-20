"use client";
import React, { useEffect, useState } from 'react';
import PageCard from '@/components/PageCard';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/utils';
import { getTransactionsReportS, getEnvelopeExecutionReportS } from '@/server/actions/proxies';

export default function EnvelopeDetailPage({ params }: { params: { id: string } }){
  const id = params.id;
  const [history, setHistory] = useState<any[]>([]);
  const [exec, setExec] = useState<any[]>([]);
  useEffect(()=>{
    (async ()=>{
      try{
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);
        const txs = await getTransactionsReportS({ start, end, envelopeId: id });
        setHistory(txs || []);
        const execRows = await getEnvelopeExecutionReportS({ start, end });
        setExec(execRows || []);
      }catch(e){ console.error(e); }
    })();
  },[id]);

  const envExec = exec.find((r:any)=> r.envelopeId === id);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Détail de l'enveloppe</h2>
        <div className="text-sm text-muted">Historique & actions</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PageCard title="Résumé">
          <div className="space-y-2">
            <div className="text-sm">Solde</div>
            <div className="text-2xl font-medium">{envExec ? formatAmount(envExec.delta || 0) : '—'}</div>
            <div className="text-sm text-muted">Couverture: {envExec ? (envExec.monthsCoverage ?? '—') : '—'}</div>

            <div className="mt-4">
              <Button onClick={()=>{ window.location.href = `/expenses?prefill=${id}`; }}>Créer une dépense ici</Button>
            </div>
          </div>
        </PageCard>

        <PageCard title="Historique des transactions">
          <div className="space-y-2">
            {history.length===0 ? <div className="text-sm text-white/60">Aucune transaction récente pour cette enveloppe.</div> : (
              <div className="space-y-2">
                {history.map(h=> (
                  <div key={h.id} className="flex items-center justify-between bg-surface p-2 rounded">
                    <div>
                      <div className="font-medium">{h.label || h.kind}</div>
                      <div className="text-xs text-white/60">{new Date(h.at).toLocaleString()} — {h.serviceId ?? ''}</div>
                    </div>
                    <div className="font-medium">{formatAmount(h.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageCard>
      </div>
    </section>
  );
}



