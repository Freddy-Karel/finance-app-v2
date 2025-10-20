"use client";
import { useEffect, useState } from 'react';
import { listRecurringChargesS, upsertRecurringChargeS, deleteRecurringChargeS, listEnvelopesS } from '@/server/actions/proxies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChargesPage(){
  const [rows,setRows] = useState<any[]>([]);
  const [name,setName]=useState(''); const [amount,setAmount]=useState<number>(0);
  const [envelopeId,setEnvelopeId]=useState<string | null>(null);
  const [editingId,setEditingId]=useState<string | null>(null);
  const [envelopes,setEnvelopes]=useState<any[]>([]);

  const load = async ()=>{ const r = await listRecurringChargesS(); setRows(r || []); const ev = await listEnvelopesS(); setEnvelopes(ev || []); };
  useEffect(()=>{ load(); },[]);

  const startEdit = (r:any)=>{ setEditingId(r.id); setName(r.name); setAmount(r.amount); setEnvelopeId(r.envelopeId ?? null); };
  const resetForm = ()=>{ setEditingId(null); setName(''); setAmount(0); setEnvelopeId(null); };

  const handleSave = async ()=>{ await upsertRecurringChargeS({ id: editingId || undefined, name, amount, frequency: 'monthly', envelopeId: envelopeId || undefined }); resetForm(); await load(); };
  const handleDelete = async (id:string)=>{ if(!confirm('Supprimer cette charge récurrente ?')) return; await deleteRecurringChargeS({ id }); await load(); };

  return (<section className="space-y-6">
    <h2 className="text-2xl font-semibold">Charges récurrentes</h2>
    <div className="bg-card p-4 rounded">
      <div className="grid grid-cols-4 gap-2 items-end">
        <Input label="Nom" value={name} onChange={e=>setName(e.target.value)} />
        <Input label="Montant" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <div>
          <label className="text-sm">Enveloppe</label>
          <select className="w-full rounded h-10 bg-surface px-2" value={envelopeId || ''} onChange={e=> setEnvelopeId(e.target.value || null)}>
            <option value="">— Aucune —</option>
            {envelopes.map(ev=> (<option key={ev.envelopeId || ev.id} value={ev.envelopeId || ev.id}>{ev.name}</option>))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}>{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
          <Button variant="ghost" onClick={resetForm}>Annuler</Button>
        </div>
      </div>
    </div>
    <div className="space-y-2">
      {rows.map(r=> (
        <div key={r.id} className="rounded bg-surface p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-white/60">{r.amount} € — {r.frequency} {r.envelopeId ? `— lié à ${ (envelopes.find(e=> (e.envelopeId||e.id) === r.envelopeId) || {}).name || ''}`: ''}</div>
          </div>
          <div className="flex gap-2">
            <button className="text-amber-400" onClick={()=>startEdit(r)}>Éditer</button>
            <button className="text-red-500" onClick={()=>handleDelete(r.id)}>Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  </section>);
}


