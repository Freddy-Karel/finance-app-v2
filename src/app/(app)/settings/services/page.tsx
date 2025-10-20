"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listServicesS, upsertServiceS, toggleServiceS, deleteServiceS } from '@/server/actions/proxies';

export default function ServicesSettingsPage(){
  const [rows,setRows]=useState<any[]>([]);
  const [name,setName]=useState("");
  const load=async()=> setRows(await listServicesS());
  useEffect(()=>{ load(); },[]);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await upsertServiceS({ name }); setName(""); await load(); };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Prestations</h2>
        <div className="text-sm text-muted">Gérer les services disponibles</div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-lg grid md:grid-cols-3 gap-4">
        <Input label="Nom" value={name} onChange={e=>setName(e.target.value)} />
        <div/>
        <div className="flex items-end"><Button type="submit">Ajouter</Button></div>
      </form>

      <div className="space-y-3">
        {rows.map(r=> (
          <div key={r.id} className="rounded-2xl bg-card p-4 shadow-lg grid md:grid-cols-4 gap-3 items-center">
            <div className="font-medium">{r.name}</div>
            <div className="text-sm text-muted">Active: {r.active?"oui":"non"}</div>
            <div/>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={async()=>{ await toggleServiceS({ id:r.id, active:!r.active }); await load(); }}>{r.active?"Désactiver":"Activer"}</Button>
              <Button variant="destructive" onClick={async()=>{ if(!confirm('Supprimer cette prestation ?')) return; await deleteServiceS({ id: r.id }); await load(); }}>Supprimer</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
