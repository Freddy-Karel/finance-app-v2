"use client";
import { formatAmount } from '@/lib/utils';
import { useToast, Toast as ToastUI } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { forceDeleteEnvelopeS, toggleEnvelopeActiveS, listEnvelopesS } from '@/server/actions/proxies';

export default function ArchivedEnvelopesPage(){
  const router = useRouter();
  const { toast, show, clear } = useToast() as any;
  const [envs, setEnvs] = useState<any[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // fetch envs on mount via server action
  useEffect(()=>{ (async ()=>{ try{ const rows = await listEnvelopesS(); setEnvs((rows as any[]).filter(r=> r.active === false).sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); }catch(e:any){ show(e?.message||'Erreur', 'error'); } })(); },[]);

  const handleForceDelete = async (id:string)=>{
    try{
      await forceDeleteEnvelopeS({ id });
      show('Enveloppe supprimée définitivement', 'success');
      setEnvs((s:any[])=> s.filter(x=> x.id !== id));
      setConfirmId(null);
      router.refresh();
    }catch(e:any){ show(e?.message||'Erreur', 'error'); }
  };

  const handleRestore = async (id:string)=>{
    try{
      await toggleEnvelopeActiveS({ id, active: true });
      await (await import('@/server/actions/proxies')).logEnvelopeRestoreS({ id, user: 'manager' });
      show('Enveloppe restaurée', 'success');
      setEnvs((s:any[])=> s.filter(x=> x.id !== id));
      router.refresh();
    }catch(e:any){ show(e?.message||'Erreur', 'error'); }
  };

  return (<section className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Archives — Enveloppes désactivées</h2>
      <div className="text-sm text-muted">Gérer les enveloppes archivées</div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {envs.map(e=> (
        <div key={e.id} className="rounded-2xl bg-card p-4 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl">{e.emoji ?? '📁'}</div>
            <div>
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-white/70">Désactivée — {formatAmount(e.budgetTarget ?? 0)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setConfirmId(e.id)} className="text-red-500">Supprimer définitivement</button>
            <button onClick={()=>handleRestore(e.id)} className="text-green-400">Restaurer</button>
          </div>
        </div>
      ))}
    </div>

    {/* Confirmation modal for permanent deletion */}
    {confirmId && (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={()=>setConfirmId(null)} />
        <div className="relative z-50 bg-card p-6 rounded-lg w-[420px] max-w-[90vw] shadow-lg animate-modal-in">
          <h3 className="text-lg font-semibold mb-2">Confirmer la suppression</h3>
          <p className="text-sm text-white/80 mb-4">Voulez-vous supprimer définitivement cette enveloppe&nbsp;? Cette action est irréversible.</p>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 rounded bg-white/5" onClick={()=>setConfirmId(null)}>Annuler</button>
            <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={()=>handleForceDelete(confirmId)}>Supprimer définitivement</button>
          </div>
        </div>
        <style>{`@keyframes modal-in { from { opacity:0; transform: translateY(8px) scale(.98);} to { opacity:1; transform: translateY(0) scale(1);} } .animate-modal-in { animation: modal-in 180ms ease-out; }`}</style>
      </div>
    )}

    {toast && <ToastUI toast={toast} onClose={clear} />}

  </section>);
}


