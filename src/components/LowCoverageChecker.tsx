"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast, Toast as ToastUI } from '@/components/Toast';
import { createLowCoverageAnomaliesS } from '@/server/actions/proxies';
import { useRouter } from 'next/navigation';

export default function LowCoverageChecker(){
  const [loading, setLoading] = useState(false);
  const { toast, show, clear } = useToast() as any;
  const router = useRouter();

  const handleCheck = async ()=>{
    try{
      setLoading(true);
      const res:any = await createLowCoverageAnomaliesS({ thresholdMonths: 2 });
      show(`${res.created || 0} anomalie(s) créées`, 'success');
      router.refresh();
    }catch(e:any){ show(e?.message||'Erreur', 'error'); }
    finally{ setLoading(false); }
  };

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleCheck} disabled={loading} className="px-3 py-2">{loading ? 'Vérification...' : 'Vérifier alertes couverture'}</Button>
      {toast && <ToastUI toast={toast} onClose={clear} />}
    </div>
  );
}



