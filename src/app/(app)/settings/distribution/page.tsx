"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listEnvelopesS, getActiveRuleS, updateDistributionRuleS } from "@/server/actions/proxies";

export default function DistributionSettingsPage() {
  const [envs, setEnvs] = useState<any[]>([]);
  const [rows, setRows] = useState<{ envelopeId: string; percent: number }[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [computed, setComputed] = useState<number[]>([]);

  const load = async () => {
    const E = await listEnvelopesS();
    setEnvs(E);
    const rule = await getActiveRuleS();
    setRows(rule?.items ?? E.slice(0, 3).map((e: any) => ({ envelopeId: e.id, percent: Math.floor(100 / Math.max(1, Math.min(3, E.length))) })));
  };

  useEffect(() => { load(); }, []);

  useEffect(()=>{
    const amounts = rows.map(r => Math.floor((Number(totalAmount||0) * (Number(r.percent||0) / 100))));
    let sum = amounts.reduce((s,a)=>s+a,0);
    let diff = Number(totalAmount||0) - sum;
    const out = [...amounts];
    let idx = 0;
    while(diff>0 && out.length){ out[idx%out.length]++; idx++; diff--; }
    setComputed(out);
  },[rows, totalAmount]);

  const update = (i: number, k: "envelopeId" | "percent", v: any) => { const c = [...rows]; (c as any)[i][k] = k === "percent" ? Number(v) : v; setRows(c); };
  const addRow = () => setRows([...rows, { envelopeId: "", percent: 0 }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDistributionRuleS(rows);
    await load();
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Règle de répartition (100%)</h2>
        <div className="text-sm text-muted">Affectation automatique des recettes</div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-lg space-y-4">
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <Input label="Montant total (pour calcul)" type="number" value={totalAmount} onChange={e=>setTotalAmount(Number(e.target.value))} />
          <div className="text-sm text-muted">Montant total utilisé pour estimer les montants par enveloppe</div>
        </div>
        {rows.map((r, i) => (
            <div key={i} className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm text-white/90">Enveloppe</label>
                <select className="w-full rounded h-10 bg-surface px-2" value={r.envelopeId} onChange={e=> update(i, 'envelopeId', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {envs.map(ev=> (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                </select>
              </div>
              <Input label="Pourcentage (%)" type="number" value={r.percent} onChange={e => update(i, "percent", e.target.value)} />
              <Input label="Montant cible" type="number" value={0} readOnly />
              <div className="flex justify-end">{i === 0 ? <Button type="button" variant="ghost" onClick={addRow}>+ Ajouter</Button> : null}</div>
            </div>
        ))}

        <div className="flex justify-end">
          <Button type="submit">Valider la nouvelle règle</Button>
        </div>
      </form>
    </section>
  );
}
