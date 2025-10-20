"use client";
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { recommendPercentagesS, setOnboardingRevenueS, proposePercentAdjustmentsS, applySuggestedPercentsS } from '@/server/actions/proxies';
import { useToast, Toast as ToastUI } from '@/components/Toast';
import PageCard from '@/components/PageCard';
import Link from 'next/link';

export default function OnboardingPage(){
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast, show, clear } = useToast() as any;

  const handlePreview = async ()=>{
    try{ setLoading(true); const v = parseFloat(amount.replace(',','.')); if(!v || v<=0) { show('Revenu invalide','error'); return; }
      const rec:any = await recommendPercentagesS({ amount: v }); setPreview(rec || []);
    }catch(e:any){ show(e?.message||'Erreur', 'error'); } finally{ setLoading(false); }
  };

  const handleApply = async ()=>{
    try{ setLoading(true); const v = parseFloat(amount.replace(',','.')); if(!v || v<=0) { show('Revenu invalide','error'); return; }
      await setOnboardingRevenueS({ amount: v, user: 'manager' }); show('Recommandations appliquées', 'success');
    }catch(e:any){ show(e?.message||'Erreur', 'error'); } finally{ setLoading(false); }
  };

  const handlePropose = async () =>{
    try{
      setLoading(true);
      const res:any = await proposePercentAdjustmentsS({ months: 3 });
      if(res && res.recommendations){
        const v = parseFloat(amount.replace(',','.')) || 0;
        const mapped = res.recommendations.map((r:any)=> ({ envelopeId: r.envelopeId, name: r.name, percent: r.suggestedPercent, amount: Math.round((r.suggestedPercent/100) * v) }));
        setPreview(mapped);
        show('Suggestions générées', 'success');
      }else{ show('Aucune suggestion','info'); }
    }catch(e:any){ show(e?.message||'Erreur','error'); } finally{ setLoading(false); }
  };

  const handleApplySuggestions = async ()=>{
    try{
      setLoading(true);
      if(preview.length===0) { show('Aucune suggestion à appliquer','error'); return; }
      const totalPct = preview.reduce((s,p)=> s + Number(p.percent||0), 0);
      if(totalPct < 99 || totalPct > 101){ show('La somme des pourcentages doit être ≈ 100%','error'); return; }
      await applySuggestedPercentsS({ items: preview.map(p=> ({ envelopeId: p.envelopeId, percent: Number(p.percent) })) });
      show('Pourcentages appliqués', 'success');
    }catch(e:any){ show(e?.message||'Erreur','error'); } finally{ setLoading(false); }
  };

  return (<section className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Onboarding — Configuration revenus</h2>
      <Link href="/settings/envelopes" className="text-sm text-white/70">Retour aux enveloppes</Link>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PageCard title="Revenu moyen (mensuel)">
        <label className="text-sm">Revenu moyen (mensuel)</label>
        <Input value={amount} onChange={(e:any)=>setAmount(e.target.value)} placeholder="Ex: 5000" />
        <div className="mt-4 flex gap-2">
          <Button onClick={handlePreview} disabled={loading}>Prévisualiser</Button>
          <Button onClick={handlePropose} disabled={loading}>Proposer d'après l'historique</Button>
          <Button variant="ghost" onClick={()=>{ setAmount(''); setPreview([]); }}>Réinitialiser</Button>
        </div>
      </PageCard>
      <PageCard title="Prévisualisation des recommandations">
        <div className="mt-3 space-y-2">
          {preview.length===0 && <div className="text-sm text-white/60">Aucune recommandation. Cliquez sur Prévisualiser.</div>}
          {preview.map(p=> (
            <div key={p.envelopeId} className="flex items-center justify-between bg-surface p-2 rounded">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-white/60">{p.percent}% — {p.amount} €</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right flex gap-2 justify-end">
          <Button onClick={handleApplySuggestions} disabled={loading || preview.length===0}>Appliquer les suggestions</Button>
          <Button onClick={handleApply} disabled={loading || preview.length===0}>Appliquer aux enveloppes</Button>
        </div>
      </PageCard>
    </div>
    {toast && <ToastUI toast={toast} onClose={clear} />}
  </section>);
}


