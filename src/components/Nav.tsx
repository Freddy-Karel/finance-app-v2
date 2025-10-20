"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  HomeIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Entrées" },
  { href: "/expenses", label: "Dépenses" },
  { href: "/distribution", label: "Distribution" },
  { href: "/settings/envelopes", label: "Enveloppes" },
  { href: "/settings/distribution", label: "Répartition" },
  { href: "/settings/services", label: "Prestations" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/reports", label: "Rapports" },
];

// helper: fetch anomalies count (client-only) via proxy
async function fetchAnomaliesCount(){ const { listAnomaliesS } = await import('@/server/actions/proxies'); const res = await listAnomaliesS({ status: 'open', limit:1, offset:0 }); return res.total || 0; }

export default function Nav() {
  const pathname = usePathname() || "/";
  const [anomalyCount, setAnomalyCount] = React.useState<number | null>(null);
  const prevCountRef = React.useRef<number | null>(null);
  const [pulse, setPulse] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(()=>{ let mounted=true; const load = async ()=>{ try{ const c = await fetchAnomaliesCount(); if(mounted){
          // pulse when count increases
          if(prevCountRef.current !== null && c > (prevCountRef.current||0)){
            setPulse(true);
            setTimeout(()=> setPulse(false), 2500);
          }
          prevCountRef.current = c;
          setAnomalyCount(c);
        }
      }catch(e){ if(mounted) setAnomalyCount(null); } } ; load(); const id = setInterval(load, 30000); return ()=>{ mounted=false; clearInterval(id); }; },[]);

  return (
    <nav className="relative">
      {/* Desktop nav */}
      <div className="hidden md:flex gap-3 text-sm items-center glass p-2 rounded-2xl">
        {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ((): any => {
          switch (item.href) {
            case "/dashboard": return HomeIcon;
            case "/transactions": return BanknotesIcon;
            case "/expenses": return CurrencyDollarIcon;
            case "/distribution": return ReceiptPercentIcon;
            case "/reports": return DocumentTextIcon;
            case "/anomalies": return ExclamationTriangleIcon;
            default: return ChartBarIcon;
          }
        })();

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive
              ? "flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md transition transform-gpu hover:scale-[1.02]"
              : "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-white/5 transition text-white/90 hover:scale-[1.01]"}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon className="w-4 h-4 text-white/90" />
            <span className="align-middle">{item.label}</span>
          </Link>
        );
        })}
      </div>

      {/* Mobile: hamburger + slide-down menu */}
      <div className="flex md:hidden items-center gap-2">
        <MobileMenu />
      </div>
      {/* Compact anomalies badge + quick menu */}
      <div className="ml-2 relative">
        <button aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)} onBlur={()=> setTimeout(()=> setMenuOpen(false), 150)} className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/50">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-300" />
          {anomalyCount !== null && anomalyCount > 0 && (
            <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-semibold text-white bg-red-600 rounded-full w-5 h-5 ${pulse ? 'animate-pulse-fast' : ''}`} aria-label={`${anomalyCount} anomalies ouvertes`}>
              {anomalyCount > 99 ? '99+' : anomalyCount}
            </span>
          )}
        </button>

        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-40 py-2">
            <Link href="/anomalies" className="block px-4 py-2 text-sm hover:bg-white/5">Voir les anomalies</Link>
            <Link href="/anomalies" className="block px-4 py-2 text-sm hover:bg-white/5">Exporter CSV</Link>
          </div>
        )}
        <style>{`.animate-pulse-fast { animation: pulse-fast 1s ease-out 0s 3; } @keyframes pulse-fast { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.15); opacity: .9 } 100% { transform: scale(1); opacity: 1 } }`}</style>
      </div>
      {/* Archivage icon placed at the right end of the nav (desktop visible) */}
      <div className="hidden md:block ml-3">
        <Link href="/settings/archived-envelopes" className="rounded-full p-2 bg-surface border border-white/10 text-sm hover:bg-white/5 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">⚙️</Link>
      </div>
    </nav>
  );
}

function MobileMenu(){
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname() || "/";
  return (
    <div className="relative">
      <button aria-label="Open menu" onClick={()=>setOpen(v=>!v)} className="p-2 rounded-md bg-white/5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-[90vw] max-w-sm bg-card rounded-xl shadow-card z-50 p-3">
          {navItems.map(it=> (
            <Link key={it.href} href={it.href} className={`block px-3 py-2 rounded-md ${pathname===it.href ? 'bg-primary-50 text-primary-700' : 'hover:bg-white/5'}`} onClick={()=>setOpen(false)}>{it.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}


