"use client";
import React, { ReactNode } from 'react';

export default function PageCard({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }){
  return (
    <div className={`rounded-2xl glass p-6 shadow-card panel-entrance ${className}`}>
      {title ? <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white" style={{letterSpacing: '-0.02em'}}>{title}</h3> : null}
      <div>
        {children}
      </div>
    </div>
  );
}



