"use client";
import clsx from "clsx"; import { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string; };
export function Input({ label, hint, error, id, className, ...rest }: Props){
  const cid=id || rest.name || "input"; const hintId=hint?`${cid}-hint`:undefined; const errId=error?`${cid}-error`:undefined;
  return <div className="space-y-1">
    {label && <label htmlFor={cid} className="text-sm text-white/90">{label}</label>}
    <input id={cid} className={clsx("w-full rounded-xl bg-surface border border-white/10 px-3 h-10", error?"border-danger":"border-white/10", className)} aria-invalid={!!error} aria-describedby={[hintId,errId].filter(Boolean).join(" ")||undefined} {...rest}/>
    {error? <p id={errId} className="text-xs text-danger">{error}</p> : hint? <p id={hintId} className="text-xs text-muted">{hint}</p> : null}
  </div>;
}
