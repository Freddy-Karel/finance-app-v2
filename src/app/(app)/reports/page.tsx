"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEnvelopeExecutionReport,
  getTransactionsReport,
  exportEnvelopeExecutionCSV,
  exportTransactionsCSV,
} from "@/server/actions/reports";

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [tx, setTx] = useState<any[]>([]);
  const [env, setEnv] = useState<any[]>([]);
  const [csv, setCsv] = useState<string>("");

  const downloadCsv = (filename:string, content:string)=>{
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const handleDownloadTransactions = async ()=>{
    try{
      const data = await exportTransactionsCSV({ start, end });
      downloadCsv(`transactions_${start}_${end}.csv`, data);
    }catch(e:any){ console.error(e); }
  };

  const handleDownloadEnvelopeExec = async ()=>{
    try{
      const data = await exportEnvelopeExecutionCSV({ start, end });
      downloadCsv(`envelope_execution_${start}_${end}.csv`, data);
    }catch(e:any){ console.error(e); }
  };

  const handleGeneratePdf = async ()=>{
    // Simple printable view — user can Save as PDF from the print dialog
    const html = `
      <html><head><title>Rapport ${start} - ${end}</title><style>body{font-family:Arial,color:#111;background:#0b0b0b;color:#fff} pre{white-space:pre-wrap;word-wrap:break-word}</style></head>
      <body>
        <h1>Rapport ${start} → ${end}</h1>
        <h2>Transactions</h2>
        <pre>${JSON.stringify(tx, null, 2)}</pre>
        <h2>Exécution Enveloppes</h2>
        <pre>${JSON.stringify(env, null, 2)}</pre>
      </body></html>`;
    const w = window.open('', '_blank'); if(!w) return; w.document.open(); w.document.write(html); w.document.close(); w.focus(); setTimeout(()=> w.print(), 500);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Rapports</h2>
        <div className="text-sm text-muted">Sélectionnez une période puis cliquez sur un rapport</div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-lg grid md:grid-cols-5 gap-4 items-end">
        <Input label="Début (YYYY-MM-DD)" value={start} onChange={e => setStart(e.target.value)} />
        <Input label="Fin (YYYY-MM-DD)" value={end} onChange={e => setEnd(e.target.value)} />
        <Button onClick={async () => setTx(await getTransactionsReport({ start, end }))}>Transactions</Button>
        <Button onClick={async () => setEnv(await getEnvelopeExecutionReport({ start, end }))} className="transform-gpu transition hover:scale-[1.03]">Exécution Enveloppes</Button>
        <Button variant="ghost" onClick={handleDownloadTransactions}>Télécharger CSV Transactions</Button>
        <Button variant="ghost" onClick={handleDownloadEnvelopeExec}>Télécharger CSV Exécution</Button>
        <Button variant="outline" onClick={handleGeneratePdf}>Générer PDF (print)</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card p-6 shadow-lg">
          <h3 className="font-semibold mb-3">Transactions</h3>
          <div className="text-xs whitespace-pre-wrap max-h-80 overflow-auto">{JSON.stringify(tx, null, 2).slice(0, 4000)}</div>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-lg">
          <h3 className="font-semibold mb-3">Exécution Enveloppes</h3>
          <div className="text-xs whitespace-pre-wrap max-h-80 overflow-auto">{JSON.stringify(env, null, 2).slice(0, 4000)}</div>
        </div>
      </div>

      {csv && (
        <div className="rounded-2xl bg-card p-6 shadow-lg">
          <h3 className="font-semibold mb-3">CSV</h3>
          <div className="text-xs whitespace-pre-wrap max-h-80 overflow-auto">{csv.slice(0, 4000)}</div>
        </div>
      )}
    </section>
  );
}
