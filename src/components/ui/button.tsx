"use client";
import clsx from "clsx";
import { PropsWithChildren, ButtonHTMLAttributes } from "react";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"ghost"|"outline"|"destructive"; size?: "sm"|"md"; isLoading?: boolean; };
const base="rounded-2xl px-4 h-10 shadow-card transition active:scale-[.99] font-medium";
const variants={ primary:"bg-gradient-to-r from-primary-500 to-secondary-500 text-white", ghost:"bg-white/5 hover:bg-white/10 text-gray-900", outline:"border border-gray-200 bg-white text-gray-900", destructive:"bg-red-600 hover:bg-red-700 text-white" } as const;
const sizes={ sm:"h-9 text-sm", md:"h-10 text-base" } as const;
export function Button({ variant="primary", size="md", isLoading=false, className, children, ...rest }: PropsWithChildren<ButtonProps>){
  return <button className={clsx(base, variants[variant], sizes[size], className)} disabled={isLoading||rest.disabled} aria-busy={isLoading?"true":"false"} aria-disabled={isLoading||!!rest.disabled?"true":"false"} {...rest}>{isLoading?"…":children}</button>;
}
