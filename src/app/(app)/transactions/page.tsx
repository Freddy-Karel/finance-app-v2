"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageCard from '@/components/PageCard';
import { createIncome } from "@/server/actions/transactions";
import { getEnvelopeBalancesS, distributeS, listServicesS, getOnboardingRevenueS, setOnboardingRevenueS, getTransactionsReportS } from "@/server/actions/proxies";
import { useToast, Toast as ToastUI } from '@/components/Toast';

export default function TransactionsPage(){
  const [serviceId,setServiceId]=useState("");
  const [services,setServices]=useState<any[]>([]);
  const [onboardingAmount,setOnboardingAmount]=useState<number | null>(null);
  const [useOnboardingAsDefault,setUseOnboardingAsDefault]=useState<boolean>(true);
  const [amount,setAmount]=useState<number>(0);
  const [message,setMessage]=useState<string|null>(null);
  const [history,setHistory]=useState<any[]>([]);
  const [envs,setEnvs]=useState<any[]>([]);
  const [rows,setRows]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const { toast, show, clear } = useToast() as any;

  useEffect(()=>{ (async ()=>{ try{ const b = await getEnvelopeBalancesS(); setEnvs(b as any[]); const sv = await listServicesS(); setServices(sv || []); try{ const ob = await getOnboardingRevenueS(); setOnboardingAmount(ob?.amount ?? null); }catch(_){ setOnboardingAmount(null); } }catch(e:any){ console.error(e); } })(); },[]);

  useEffect(()=>{
    // build preview rows from envs and amount using defaultPercent or onboarding
    const baseAmount = useOnboardingAsDefault && onboardingAmount ? onboardingAmount : amount;
    if(!baseAmount || baseAmount <= 0){ setRows([]); return; }
    const preview = (envs || []).map(e=>{
      const pct = typeof e.defaultPercent === 'number' ? Number(e.defaultPercent) : 0;
      const amt = Math.round((pct/100) * baseAmount);
      return { envelopeId: e.envelopeId ?? e.id, name: e.name, percent: pct, amount: amt };
    });
    // normalize rounding diff
    const sum = preview.reduce((s,r)=> s + (r.amount||0), 0);
    const diff = baseAmount - sum;
    if(diff !== 0 && preview.length) preview[0].amount += diff;
    setRows(preview);
  },[envs, amount, onboardingAmount, useOnboardingAsDefault]);

  const totalPreview = useMemo(()=> rows.reduce((s,r)=> s + (r.amount||0), 0), [rows]);

  const handleDistribute = async (e?:React.FormEvent)=>{
    e?.preventDefault();
    try{
      setLoading(true);
      // Determine which amount to use for distribution: onboarding or manual
      const onHand = (useOnboardingAsDefault && onboardingAmount) ? Number(onboardingAmount) : Number(amount);
      if(!onHand || onHand <= 0) { show('Montant invalide','error'); return; }
      // call distributeS
      const distRes = await distributeS({ onHand, rows: rows.map(r=>({ envelopeId: r.envelopeId, amount: Number(r.amount) })) });
      show('Entrée répartie avec succès', 'success');
      // give the toast a short moment to render so E2E can detect it reliably
      await new Promise((res) => setTimeout(res, 150));
      // optionally create income transaction as well (only if a service was selected)
      if(serviceId){ await createIncome({ serviceId, amount: onHand }); }
      // append to local history
      setHistory(h=>[{ at: new Date().toISOString(), serviceId, amount: onHand, distributed: rows }, ...h].slice(0,20));
      setServiceId(''); setAmount(0); setRows([]);
    }catch(err:any){ show(err?.message||'Erreur', 'error'); }
    finally{ setLoading(false); }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Entrées (recettes)</h2>
        <div className="text-sm text-muted">Ajouter une entrée et proposer une répartition</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PageCard title="Nouvelle entrée">
          <form data-testid="income-form" onSubmit={handleDistribute} className="space-y-4">
            <div>
              <label className="text-sm text-white/90">Prestation</label>
              <select className="w-full rounded h-10 bg-surface px-3" value={serviceId} onChange={e=>setServiceId(e.target.value)}>
                <option value="">— Choisir une prestation —</option>
                {services.map((s:any)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/90">Revenu moyen (Onboarding)</label>
              <div className="flex items-center gap-2">
                <input type="number" className="w-full rounded h-10 bg-surface px-2" value={onboardingAmount ?? ''} onChange={e=>setOnboardingAmount(e.target.value ? Number(e.target.value) : null)} placeholder="Ex: 5000" />
                <Button type="button" onClick={async ()=>{
                  const amt = Number(onboardingAmount || 0);
                  if(!amt || amt <= 0){ show('Montant invalide','error'); return; }
                  try{ await setOnboardingRevenueS({ amount: amt }); show('Revenu moyen enregistré','success'); }catch(e:any){ show(e?.message||'Erreur','error'); }
                }}>Enregistrer</Button>
              </div>
            </div>

            <div>
              <Input name="amount" label="Montant" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading}>Prévisualiser & Distribuer</Button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useOnboardingAsDefault} onChange={e=>setUseOnboardingAsDefault(e.target.checked)} /> Utiliser revenu moyen</label>
            </div>

            {message && <div className="text-sm text-muted">{message}</div>}
          </form>
        </PageCard>

        <PageCard title="Prévisualisation de la répartition">
          <div className="space-y-2">
            {rows.length===0 && <div className="text-sm text-white/60">Aucune prévisualisation. Saisissez un montant ou utilisez le revenu moyen.</div>}
            {rows.map((r,i)=> (
              <div key={r.envelopeId} className="flex items-center justify-between bg-surface p-2 rounded">
                <div className="min-w-0">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-white/60">{r.percent}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={r.amount} onChange={ev=>{ const v = Number(ev.target.value||0); const copy=[...rows]; copy[i].amount = v; setRows(copy); }} />
                </div>
              </div>
            ))}
            <div className="mt-3 flex justify-between text-sm text-white/70">
              <div>Total proposé</div>
              <div className="font-medium">{totalPreview} €</div>
            </div>
          </div>
        </PageCard>
      </div>
      <div data-testid="journal" className="rounded-2xl bg-card p-6 shadow-lg">
        <h3 className="font-semibold mb-3">Journal récent</h3>
        {history.length===0 ? <div className="text-sm text-white/60">Aucune entrée récente.</div> : (
          <div className="space-y-2">
            {history.map((h,i)=> (
              <div key={i} className="flex items-center justify-between bg-surface p-2 rounded">
                <div>
                  <div className="font-medium">{h.serviceId || '—'}</div>
                  <div className="text-xs text-white/60">{new Date(h.at).toLocaleString()} — {h.amount} €</div>
                </div>
                <div className="text-sm">{h.distributed?.length ?? 0} allocations</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={async ()=>{ const r = await getTransactionsReportS({ start: new Date().toISOString().slice(0,10), end: new Date().toISOString().slice(0,10) }); setHistory(h=> (r as any[]).slice(0,10).map((x:any)=> ({ at: x.at, serviceId: x.serviceId, amount: x.amount })) ); }}>Charger journal</Button>
      </div>
      {toast && <ToastUI toast={toast} onClose={clear} />}
    </section>
  );
}
