"use client";
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }){
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(pathname);
  const [stage, setStage] = useState<'entering'|'entered'|'exiting'>('entered');

  useEffect(()=>{
    if(pathname === animKey) return;
    setStage('exiting');
    const t = setTimeout(()=>{
      setAnimKey(pathname);
      setStage('entering');
      const t2 = setTimeout(()=> setStage('entered'), 260);
      return ()=> clearTimeout(t2);
    }, 200);
    return ()=> clearTimeout(t);
  },[pathname]);

  return (
    <div className={`page-transition page-${stage}`} key={animKey}>
      {children}
    </div>
  );
}




