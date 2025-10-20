"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/utils";

import { getDaySummaryS, getDistributionProposalS, distributeS, reconcileS } from '@/server/actions/proxies';

type Step = "reconcile" | "distribute";

export default function DistributionPage(){
  const today=new Date().toISOString().slice(0,10);
  const [sum,setSum]=useState({in:0,out:0,onHand:0});
  const [step,setStep]=useState<Step>("reconcile");
  const [declared,setDeclared]=useState<number>(0);
  const [reconMsg,setReconMsg]=useState<string| null>(null);
  const [reconDiff,setReconDiff]=useState<number>(0);
  const [reconSuggestions,setReconSuggestions]=useState<string[]>([]);

  const [rows,setRows]=useState<any[]>([]);
  const [override,setOverride]=useState(false);
  const [reason,setReason]=useState("");
  const [msg,setMsg]=useState<string|null>(null);

  useEffect(()=>{ (async()=>{
    const s=await getDaySummaryS(today);
    setSum(s);
    // Pré-remplir avec le calcul théorique, l'utilisateur doit confirmer ou corriger :
    setDeclared(s.onHand);
  })(); },[]);

  const doReconcile = async () => {
    try{
      const res = await reconcileS({ declaredOnHand: Number(declared||0) });
      if(res.ok){
        setReconMsg("Montant en main validé ✅");
        // Charger la proposition et passer à la distribution
        const p=await getDistributionProposalS(today);
        setRows(p.items);
        setStep("distribute");
      }else{
        setReconMsg("Écart détecté ❗ Merci d’ajouter/corriger une transaction avant de distribuer.");
        setReconDiff(res.diff);
        setReconSuggestions(res.suggestions||[]);
      }
    }catch(e:any){
      setReconMsg(e?.message||"Erreur de réconciliation");
    }
  };

  const updateAmt=(i:number,amt:number)=>{ const c=[...rows]; c[i].amount=amt; setRows(c); };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Distribution de la recette du jour</h2>
        <div className="text-sm text-muted">Synthèse et actions de distribution</div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-lg" data-testid="distribution-summary">
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-sm text-muted">Entrées</div>
            <div className="text-xl font-bold">{formatAmount(sum.in)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Sorties</div>
            <div className="text-xl font-bold">{formatAmount(sum.out)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">En main (calculé)</div>
            <div className="text-xl font-bold">{formatAmount(sum.onHand)}</div>
          </div>
        </div>
      </div>

      {step==="reconcile" && (
        <div className="rounded-2xl bg-card p-6 shadow-lg" data-testid="reconcile-panel">
          <p className="text-sm text-muted">
            Avant de distribuer, <b>validez le montant réellement en main</b> ou corrigez vos transactions.
          </p>
          <div className="grid md:grid-cols-3 gap-4 items-end mt-4">
            <Input label="Montant en main (déclaré)" type="number" value={declared} onChange={e=>setDeclared(Number(e.target.value))} />
            <div className="text-sm text-muted">
              Différence: <b>{formatAmount(Number(declared||0) - sum.onHand)}</b>
            </div>
            <Button type="button" onClick={doReconcile}>Valider le montant</Button>
          </div>
          {reconMsg && (
            <div className="text-sm mt-3 text-muted">
              {reconMsg}
              {reconMsg.includes("Écart détecté") && (
                <div className="mt-2 space-y-2">
                  <div>Écart: <b>{formatAmount(reconDiff)}</b></div>
                  <ul className="list-disc pl-5 text-white/80">
                    {reconSuggestions.map((s,i)=>(<li key={i}>{s}</li>))}
                  </ul>
                  <div className="flex gap-3">
                    <a className="underline text-white/90" href="/transactions">➕ Ajouter une entrée</a>
                    <a className="underline text-white/90" href="/expenses">➖ Ajouter une dépense</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step==="distribute" && (
        <>
          <div className="rounded-2xl bg-card p-4 shadow-lg text-sm text-muted">
            Montant en main <b>validé</b> : {formatAmount(declared)} — vous pouvez procéder à la distribution.
          </div>
          <form
            data-testid="distribution-table"
            onSubmit={async (e) => {
              e.preventDefault();
              try{
                await distributeS({ onHand:Number(declared||0), rows, allowOverride:override, overrideReason:reason });
                setMsg("Distribution effectuée ✅");
              }catch(e:any){ setMsg(e.message||"Erreur"); }
            }}
            className="rounded-2xl bg-card p-6 shadow-lg space-y-4"
          >
            {rows.map((r,i)=>(
              <div key={i} className="grid md:grid-cols-4 gap-4 items-end">
                {/* Hidden envelopeId for submission, visible name for UX */}
                <input type="hidden" name={`rows[${i}].envelopeId`} value={r.envelopeId} />
                <div>
                  <label className="text-sm text-white/90">Enveloppe</label>
                  <div className="rounded-xl bg-surface p-2">{r.name}</div>
                </div>
                <div>
                  <label className="text-sm text-white/90">% barème</label>
                  <div className="rounded-xl bg-surface p-2">{r.percent ?? 0}%</div>
                </div>
                <Input label="Montant à affecter" name={`rows[${i}].amount`} value={r.amount??0} type="number" onChange={e=>updateAmt(i,Number(e.target.value))} />
              </div>
            ))}
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={override} onChange={e=>setOverride(e.target.checked)} /> Dérogation
              </label>
              <Input label="Raison (si dérogation)" value={reason} onChange={e=>setReason(e.target.value)} />
              <Button type="submit">Distribuer</Button>
            </div>
            {msg && <div className="text-sm text-muted">{msg}</div>}
          </form>
        </>
      )}
    </section>
  );
}
