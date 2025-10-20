"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, Toast as ToastUI } from "@/components/Toast";
import { listEnvelopesS, upsertEnvelopeS, toggleEnvelopeActiveS, toggleEnvelopeProtectedS, deleteEnvelopeS, envelopeStatsS, recommendPercentagesS, setOnboardingRevenueS } from '@/server/actions/proxies';
import { formatAmount } from '@/lib/utils';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function EnvelopesSettingsPage(){
  const [rows,setRows]=useState<any[]>([]);
  const [aggs,setAggs]=useState<any[]>([]);
  const [name,setName] = useState("");
  const [emoji,setEmoji]=useState("");
  const [budget,setBudget]=useState("");
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [prot,setProt]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const { toast, show, clear } = useToast() as any;

  const load = async ()=>{ try{ // use aggregated balances so dashboard and envelopes show same numbers
      const r = await envelopeStatsS();
      setRows(r as any[]);
    }catch(e:any){ show(e.message||'Erreur'); } };
  useEffect(()=>{ load(); },[]);

  const handleCreate = async (e?:React.FormEvent) =>{
    e?.preventDefault();
    try{
      const parsedBudget = budget ? parseInt(budget, 10) : undefined;
      if(typeof parsedBudget === 'undefined' || Number.isNaN(parsedBudget)){
        show('Le montant cible est requis', 'error');
        return;
      }
      await upsertEnvelopeS({ name, emoji, protected:prot, budgetTarget: parsedBudget });
      setName(""); setEmoji(""); setBudget(""); setProt(false); setShowModal(false); show('Enveloppe créée', 'success'); await load();
    }catch(e:any){ show(e.message||'Erreur', 'error'); }
  };

  const handleDelete = async (id:string)=>{
    if(!confirm('Confirmer la suppression de cette enveloppe ?')) return;
      try{
        const res = await deleteEnvelopeS({ id });
        if(res && (res as any).deactivated){
          show((res as any).message || 'Enveloppe désactivée', 'success');
        } else if(res && (res as any).deleted){
          show('Enveloppe supprimée', 'success');
        } else {
          show('Opération terminée', 'success');
        }
        await load();
      }catch(e:any){ show(e?.message||'Erreur', 'error'); }
  };

  const getAgg = (id:string)=> aggs.find((a:any)=>a.envelopeId===id) ?? null;

  return <section className="space-y-4"><h2 className="text-xl font-semibold">Enveloppes</h2>
    <div className="flex items-center gap-4">
      <Button onClick={()=>setShowModal(true)} className="inline-flex items-center gap-2">➕ Nouvelle enveloppe</Button>
    </div>
    {showModal && (<div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-black/50 absolute inset-0" onClick={()=>setShowModal(false)} />
      <form onSubmit={handleCreate} className="relative z-10 bg-card p-6 rounded-lg w-[420px] max-w-[90vw] shadow-lg">
        <h3 className="text-lg font-medium mb-2">Créer une enveloppe</h3>
        <Input label="Nom" value={name} onChange={e=>setName(e.target.value)} />
        <Input label="Montant cible (optionnel)" type="number" value={budget} onChange={e=>setBudget(e.target.value)} />
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label className="text-sm">Emoji</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prot} onChange={e=>setProt(e.target.checked)} /> Protégée</label>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={()=>setShowEmojiPicker(v=>!v)} className="rounded-lg px-3 py-2 bg-amber-50 border flex items-center gap-2">
              {emoji ? <span className="text-2xl">{emoji}</span> : <span className="text-sm">Sélectionner un emoji</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {showEmojiPicker && <div className="mt-2 max-h-56 overflow-auto z-50 bg-slate-800 text-white rounded-md p-1"><EmojiPicker onEmojiClick={(emojiData:any, event:any)=>{ const value = emojiData?.emoji ?? emojiData?.unified ?? ''; setEmoji(value); setShowEmojiPicker(false); } } /></div>}
        </div>
        <div className="mt-4 flex gap-2 justify-end"><Button type="submit">Créer</Button><Button variant="ghost" onClick={()=>setShowModal(false)}>Annuler</Button></div>
      </form>
    </div>)}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{rows.map((r:any)=>{
      const emojiChar = r.emoji ?? '🎯';
      const allocated = r.allocated ?? 0;
      const spent = r.spent ?? 0;
      const balance = (r.budgetTarget ?? allocated) - spent;
      const outCount = r.outCount ?? 0;
      const denom = (typeof r.budgetTarget === 'number' && r.budgetTarget > 0) ? r.budgetTarget : Math.max(allocated, 1);
      const pct = Math.min(100, Math.round((spent / denom) * 100));
      return (
        <div key={r.envelopeId ?? r.id} className="rounded-2xl bg-card p-6 shadow-card flex flex-col justify-between h-56">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-2xl">{emojiChar}</div>
              <div>
                <div className="font-semibold text-lg">{r.name}</div>
                <div className="text-xs text-white/70">{r.outflow ?? 0} transaction(s)</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Montant</div>
              <div className="font-bold text-xl">{formatAmount(balance)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <div>{formatAmount(spent)} dépensés</div>
              <div>{formatAmount(Math.max(0, balance))} restants</div>
            </div>
            <div className="mt-3 w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div className="h-3 bg-amber-400 transition-all duration-300" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={()=>handleDelete(r.envelopeId ?? r.id)} className="p-2 rounded-full text-red-500 hover:bg-red-600/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      );
    })}</div>
    {toast && <ToastUI toast={toast} onClose={clear} />}
  </section>;
}
