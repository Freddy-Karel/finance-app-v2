"use client";
import { useEffect } from 'react';

export default function ClientInit(){
  useEffect(()=>{
    // load feather + anime from CDN if available
    try{
      if(typeof window !== 'undefined'){
        // call feather.replace if loaded
        setTimeout(()=>{ try{ (window as any).feather && (window as any).feather.replace(); }catch(e){} }, 200);
      }
    }catch(e){}
  },[]);

  return null;
}



