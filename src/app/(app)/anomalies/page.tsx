"use client";
import { useEffect, useState } from "react"; import { Button } from "@/components/ui/button";
import { listAnomaliesS, resolveAnomalyS, exportAnomaliesCSVS } from '@/server/actions/proxies';
export default function AnomaliesPage(){
  const [rows,setRows]=useState<any[]>([]); const [total,setTotal]=useState(0); const [csv,setCsv]=useState<string>("");
  const load=async()=>{ const r=await listAnomaliesS({ status:"open", limit:100, offset:0 }); setRows(r.items); setTotal(r.total); };
  useEffect(()=>{ load(); },[]);
  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await exportAnomaliesCSVS({});
    setCsv(data);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Anomalies</h2>
        <div className="text-sm text-muted">Ouvertes: {total}</div>
      </div>

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="rounded-2xl bg-card p-4 shadow-lg grid md:grid-cols-6 gap-3 items-center">
            <div className="font-medium">{r.level}</div>
            <div className="text-sm text-muted">{r.code}</div>
            <div className="col-span-2 text-sm">{r.details}</div>
            <div className="text-sm">{r.status}</div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={async()=>{ await resolveAnomalyS({ id:r.id, note:"OK" }); await load(); }}>Résoudre</Button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleExport} className="">
        <Button type="submit">Exporter CSV</Button>
      </form>

      {csv && <pre className="text-xs whitespace-pre-wrap max-h-80 overflow-auto">{csv.slice(0,2000)}{csv.length>2000?"\n...":""}</pre>}
    </section>
  );
}
