"use client";
import { useState, useEffect } from "react";

export type ToastKind = "info"|"success"|"error";
export type ToastModel = { id: number; message: string; kind: ToastKind; duration?: number };

export function Toast({ toast, onClose }: { toast: ToastModel; onClose: ()=>void }){
  const { message, kind, duration = 3500 } = toast;
  useEffect(()=>{ const t = setTimeout(()=> onClose && onClose(), duration); return ()=>clearTimeout(t); },[toast]);
  const color = kind === 'error' ? 'bg-red-600' : kind === 'success' ? 'bg-green-500' : 'bg-blue-500';
  const iconSvg = kind === 'success' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) : kind === 'error' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
  );
  return (
    <div className={`fixed right-6 bottom-6 z-50 w-80 max-w-[90vw] ${color} text-white rounded-lg shadow-lg overflow-hidden transform animate-toast-in`} role="status" aria-live="polite">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-xl font-bold">{iconSvg}</div>
        <div className="flex-1 text-sm">{message}</div>
        <button aria-label="close" onClick={onClose} className="opacity-80 hover:opacity-100">✕</button>
      </div>
      <div className="h-1 bg-white/20">
        <div className="h-1 bg-white" style={{ animation: `toast-progress ${duration}ms linear forwards` }} />
      </div>
      <style>{`@keyframes toast-progress { from { width: 100%; } to { width: 0%; } } @keyframes toast-in { from { opacity:0; transform: translateY(12px) scale(.98);} to { opacity:1; transform: translateY(0) scale(1);} } .animate-toast-in { animation: toast-in 260ms cubic-bezier(.22,.98,.31,1); }`}</style>
    </div>
  );
}

// Lightweight global toast provider hook (local fallback supported)
let globalShow: ((m:string,k:ToastKind,d?:number)=>void)|null = null;
let globalClear: (()=>void)|null = null;

export function useToast(){
  const [t,setT] = useState<ToastModel|null>(null);
  useEffect(()=>{ globalShow = (message:string, kind:ToastKind='info', duration=3500)=> setT({ id: Date.now(), message, kind, duration }); globalClear = ()=> setT(null); return ()=>{ globalShow = null; globalClear = null }; },[]);
  const show = (message: string, kind: ToastKind = 'info', duration = 3500) => {
    if(globalShow) return globalShow(message, kind, duration);
    setT({ id: Date.now(), message, kind, duration });
  };
  const clear = () => { if(globalClear) return globalClear(); setT(null); };
  return { toast: t, show, clear };
}

export function toastExternally(message:string, kind:ToastKind='info', duration=3500){ if(globalShow) globalShow(message, kind, duration); }


