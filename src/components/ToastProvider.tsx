"use client";
import React, { useState } from 'react';
import { ToastModel, Toast, ToastKind, useToast } from './Toast';

export default function ToastProvider(){
  const { toast, clear } = useToast();
  return <>{toast && <Toast toast={toast} onClose={clear} />}</>;
}




