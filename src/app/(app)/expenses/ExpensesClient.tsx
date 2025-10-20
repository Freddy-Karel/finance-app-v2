"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageCard from '@/components/PageCard';
import useFocusTrap from '@/hooks/useFocusTrap';
import { formatAmount } from "@/lib/utils";
import { getEnvelopeBalancesS, createTransferS } from "@/server/actions/proxies";
import { useToast } from '@/components/Toast';

type Row = { envelopeId: string; amount: number };
type Env = { envelopeId:string; name:string; balance:number; protected:boolean; active:boolean };

export default function ExpensesClient(){
  const [envs,setEnvs]=useState<Env[]>([]);
  const [allocs,setAllocs]=useState<Row[]>([{ envelopeId:"", amount:0 }]);
  const [override,setOverride]=useState(false);
  const [reason,setReason]=useState("");
  const [message,setMessage]=useState<string|null>(null);
  // No more payloadRef: we use structured form inputs

  // support prefill via URL query param `prefill` (envelopeId)
  useEffect(()=>{ (async()=>{ const rows = await getEnvelopeBalancesS(); setEnvs(rows as Env[]);
    try{ const url = new URL(window.location.href); const pre = url.searchParams.get('prefill'); if(pre){ setAllocs([{ envelopeId: pre, amount: 0 }]); } }catch(_){ }
  })(); },[]);

  const total = useMemo(()=> allocs.reduce((s,a)=> s + Number(a.amount||0), 0), [allocs]);
  const map = useMemo(()=> new Map(envs.map(e=>[e.envelopeId, e])), [envs]);

  const issues = useMemo(()=>{
    return allocs.map(a=>{
      const env = map.get(a.envelopeId);
      const warn: string[] = [];
      if(!env) return { warn: ["Choisissez une enveloppe valide"], level: "warning" as const };
      if(!env.active) warn.push(`Enveloppe '${env.name}' inactive`);
      if(env.protected && !override) warn.push(`Enveloppe '${env.name}' protégée — dérogation requise`);
      if(a.amount>0 && a.amount > (env.balance ?? 0) && !override) warn.push(`Dépassement (${formatAmount(a.amount)} > solde ${formatAmount(env.balance)})`);
      return { warn, level: warn.length ? "warning" as const : "ok" as const };
    });
  }, [allocs, map, override]);

  const hasBlocking = useMemo(()=> issues.some(i=> i.level==="warning"), [issues]);

  const addRow = () => setAllocs([...allocs, { envelopeId:"", amount:0 }]);
  const update = (i:number, k: keyof Row, v:any) => { const c=[...allocs]; (c as any)[i][k] = k==="amount" ? Number(v) : v; setAllocs(c); };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState(override ? reason : "");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const { show } = useToast() as any;
  const confirmRef = React.useRef<HTMLDivElement|null>(null);
  const transferRef = React.useRef<HTMLDivElement|null>(null);
  // apply focus traps for modals
  useFocusTrap(confirmRef, confirmOpen);
  useFocusTrap(transferRef, transferOpen);

  // close modals when the focusTrapEscape event is dispatched (Escape key pressed inside trap)
  useEffect(()=>{
    function onConfirmEscape(){ setConfirmOpen(false); }
    function onTransferEscape(){ setTransferOpen(false); }
    const c = confirmRef.current;
    const t = transferRef.current;
    if(c) c.addEventListener('focusTrapEscape', onConfirmEscape as any);
    if(t) t.addEventListener('focusTrapEscape', onTransferEscape as any);
    return ()=>{
      if(c) c.removeEventListener('focusTrapEscape', onConfirmEscape as any);
      if(t) t.removeEventListener('focusTrapEscape', onTransferEscape as any);
    };
  }, [confirmRef, transferRef]);

  const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // find enclosing form
    const formEl = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    if(hasBlocking && !override){
      setConfirmReason(reason || "");
      setConfirmOpen(true);
      return;
    }
    if(formEl) formEl.requestSubmit();
  };

  const handleConfirm = () => {
    if(!confirmReason || confirmReason.trim().length < 5){
      alert('Veuillez fournir une raison (≥ 5 caractères) pour confirmer la dérogation.');
      return;
    }
    setOverride(true);
    setReason(confirmReason);
    setConfirmOpen(false);
    // submit after a short delay to ensure state propagation
    setTimeout(()=>{
      const formEl = document.querySelector('form[data-testid="expense-allocations"]') as HTMLFormElement | null;
      if(formEl) formEl.requestSubmit();
    }, 50);
  };

  const openTransfer = ()=>{ setTransferOpen(true); setTransferFrom(null); setTransferTo(null); setTransferAmount(0); };

  const handleTransfer = async ()=>{
    if(!transferFrom || !transferTo) { alert('Sélectionnez les deux enveloppes'); return; }
    if(transferFrom === transferTo) { alert('Impossible de transférer vers la même enveloppe'); return; }
    try{
      const res:any = await createTransferS({ fromEnvelopeId: transferFrom, toEnvelopeId: transferTo, amount: Number(transferAmount) });
      if(res && (res.outTransactionId || res.inTransactionId)){
        setTransferOpen(false);
        show('Transfert effectué', 'success');
        const rows = await getEnvelopeBalancesS(); setEnvs(rows as Env[]);
      }else{
        show('Erreur lors du transfert', 'error');
      }
    }catch(e:any){ setMessage(e?.message||'Erreur'); }
  };

  // nothing here — form fields are rendered directly below

  return (
    <div>
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageCard title="Nouvelle dépense" className="p-4">
            <div className="space-y-3">
              {allocs.map((a,i)=>{
                const env = map.get(a.envelopeId);
                const warn = issues[i]?.warn ?? [];
                const canShowBalance = !!env && env.active;
                const balance = env?.balance ?? 0;
                const isOver = a.amount>0 && a.amount>balance;
                return (
                  <div key={i} className="rounded-xl bg-surface p-4 space-y-2">
                    <div className="grid md:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-sm text-white/90" htmlFor={`env-select-${i}`}>Enveloppe</label>
                        <select id={`env-select-${i}`} name={`allocations[${i}].envelopeId`} aria-label={`Enveloppe ${i+1}`} className="w-full rounded-xl bg-surface border border-white/10 h-10 px-3" value={a.envelopeId} onChange={e=>update(i,"envelopeId",e.target.value)}>
                          <option value="">— Choisir —</option>
                          {envs.filter(e=> e.active).map(e=> (
                            <option key={e.envelopeId} value={e.envelopeId}>{e.name}{e.protected?" (protégée)":""}</option>
                          ))}
                        </select>
                      </div>
                      <Input label="Montant" name={`allocations[${i}].amount`} type="number" value={a.amount} onChange={e=>update(i,"amount",e.target.value)} />
                      <div className="flex items-center gap-2">
                        {i===0 ? <Button type="button" variant="ghost" onClick={addRow}>+ Ajouter</Button> : <Button type="button" variant="ghost" onClick={()=>{ const c=[...allocs]; c.splice(i,1); setAllocs(c); }}>Supprimer</Button>}
                      </div>
                    </div>
                    <div className="text-sm">
                      {canShowBalance ? (
                        <span className="text-white/80">
                          Solde disponible : <b>{formatAmount(balance)}</b>
                          {env?.protected ? " — Enveloppe protégée" : ""}
                          {isOver && !override ? (<span className="ml-2 text-danger">• Dépassement</span>) : null}
                        </span>
                      ) : (
                        <span className="text-white/60">Sélectionnez une enveloppe pour voir le solde disponible</span>
                      )}
                    </div>
                    {warn.length>0 && (<ul className="text-sm text-yellow-300/90 list-disc pl-5">{warn.map((w,idx)=>(<li key={idx}>{w}</li>))}</ul>)}
                  </div>
                );
              })}
            </div>
          </PageCard>

          <PageCard title="Actions" className="p-4">
            <div className="space-y-3">
              <div className="text-sm">Total (auto)</div>
              <Input label="Total" name="total" value={total} readOnly />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowOverride" checked={override} onChange={e=>setOverride(e.target.checked)} /> Autoriser dérogation</label>
              </div>
              <Input label="Raison (si dérogation)" name="overrideReason" value={reason} onChange={e=>setReason(e.target.value)} />
              <div className="flex gap-3">
                <Button type="button" onClick={handleSubmitClick} disabled={hasBlocking && !override} aria-disabled={hasBlocking && !override}>Valider la dépense</Button>
                <Button type="button" variant="ghost" onClick={openTransfer}>Transférer entre enveloppes</Button>
              </div>
              {hasBlocking && !override && (<div className="text-sm text-yellow-300/90">Des avertissements bloquants sont présents. Confirmez pour forcer et créer une anomalie.</div>)}
            </div>
          </PageCard>
        </div>
      </section>
      {message && <div className="text-sm">{message}</div>}
    
    {/* Confirmation modal for soft-block override */}
  {confirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={()=>setConfirmOpen(false)} />
        <div ref={confirmRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-50 bg-card p-6 rounded-lg w-[420px] max-w-[90vw] shadow-lg">
          <h3 id="confirm-title" className="text-lg font-semibold mb-2">Confirmer la dérogation</h3>
          <p className="text-sm text-white/80 mb-3">Des avertissements bloquants ont été détectés. Si vous confirmez, une anomalie sera journalisée.</p>
          <label className="text-sm">Raison (≥5 caractères)</label>
          <textarea className="w-full p-2 rounded bg-surface border border-white/10 mt-2" rows={3} value={confirmReason} onChange={e=>setConfirmReason(e.target.value)} />
          <div className="mt-4 flex justify-end gap-2">
            <button aria-label="Annuler dérogation" className="px-4 py-2 rounded bg-white/5" onClick={()=>setConfirmOpen(false)}>Annuler</button>
            <button aria-label="Confirmer dérogation" className="px-4 py-2 rounded bg-amber-500 text-white" onClick={handleConfirm}>Confirmer et valider</button>
          </div>
        </div>
      </div>
    )}

    {/* Transfer modal */}
    {transferOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={()=>setTransferOpen(false)} />
        <div ref={transferRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="relative z-50 bg-card p-6 rounded-lg w-[420px] max-w-[90vw] shadow-lg">
          <h3 id="transfer-title" className="text-lg font-semibold mb-2">Transférer entre enveloppes</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Depuis</label>
              <select className="w-full rounded h-10 bg-surface px-2" value={transferFrom||''} onChange={e=>setTransferFrom(e.target.value||null)}>
                <option value="">— Choisir —</option>
                {envs.map(ev=> (<option key={ev.envelopeId} value={ev.envelopeId}>{ev.name} — {formatAmount(ev.balance)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm">Vers</label>
              <select className="w-full rounded h-10 bg-surface px-2" value={transferTo||''} onChange={e=>setTransferTo(e.target.value||null)}>
                <option value="">— Choisir —</option>
                {envs.map(ev=> (<option key={ev.envelopeId} value={ev.envelopeId}>{ev.name} — {formatAmount(ev.balance)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm">Montant</label>
              <input type="number" className="w-full rounded p-2 bg-surface" value={transferAmount} onChange={e=>setTransferAmount(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button aria-label="Annuler transfert" className="px-4 py-2 rounded bg-white/5" onClick={()=>setTransferOpen(false)}>Annuler</button>
            <button aria-label="Confirmer transfert" className="px-4 py-2 rounded bg-amber-500 text-white" onClick={handleTransfer}>Transférer</button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
