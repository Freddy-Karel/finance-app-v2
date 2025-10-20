"use client";
import { useEffect } from 'react';

export default function useFocusTrap(ref: { current: HTMLElement | null } | any, enabled: boolean){
  useEffect(()=>{
    if(!enabled || !ref || !ref.current) return;
    const container: HTMLElement = ref.current;
    const focusable = Array.from(container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const prevActive = document.activeElement as HTMLElement | null;
    if(first) first.focus();

    function onKey(e: KeyboardEvent){
      if(e.key === 'Tab'){
        if(focusable.length === 0){ e.preventDefault(); return; }
        if(e.shiftKey){
          if(document.activeElement === first){ e.preventDefault(); last && last.focus(); }
        } else {
          if(document.activeElement === last){ e.preventDefault(); first && first.focus(); }
        }
      }
      if(e.key === 'Escape'){
        // let caller handle closing via state; dispatch a custom event
        container.dispatchEvent(new CustomEvent('focusTrapEscape', { bubbles: true }));
      }
    }

    document.addEventListener('keydown', onKey);
    return ()=>{
      document.removeEventListener('keydown', onKey);
      if(prevActive) prevActive.focus();
    };
  }, [ref, enabled]);
}




