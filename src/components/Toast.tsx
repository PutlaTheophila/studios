'use client';

import { useEffect, useState } from 'react';
import { IconClose } from './Icons';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; }

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];
let seq = 1;

function emit() { listeners.forEach(l => l(items)); }

function push(kind: ToastKind, message: string, ttl = 3800) {
  const id = seq++;
  items = [...items, { id, kind, message }];
  emit();
  if (ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}

function dismiss(id: number) {
  items = items.filter(t => t.id !== id);
  emit();
}

export const toast = {
  success: (m: string) => push('success', m),
  error: (m: string) => push('error', m, 5200),
  info: (m: string) => push('info', m),
  dismiss
};

const kindStyles: Record<ToastKind, { bg: string; fg: string; bdr: string; icon: string }> = {
  success: { bg: 'var(--green-soft)', fg: 'var(--green)', bdr: 'rgba(56,112,56,0.30)', icon: 'M5 12l5 5L20 7' },
  error:   { bg: 'var(--red-soft)',   fg: 'var(--red)',   bdr: 'rgba(184,50,50,0.30)', icon: 'M12 8v5M12 17v.5M5 19h14a2 2 0 0 0 1.73-3L13.73 5a2 2 0 0 0-3.46 0L3.27 16A2 2 0 0 0 5 19z' },
  info:    { bg: 'var(--aglow)',      fg: 'var(--acc)',   bdr: 'var(--aglow-s)',       icon: 'M12 8h.01M11 12h1v5h1' }
};

export function ToastViewport() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setList);
    return () => { listeners.delete(setList); };
  }, []);
  if (list.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {list.map(t => {
        const s = kindStyles[t.kind];
        return (
          <div key={t.id} className="toast" style={{ background: s.bg, color: s.fg, borderColor: s.bdr }} role={t.kind === 'error' ? 'alert' : 'status'}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d={s.icon} />
            </svg>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, display: 'inline-flex' }}>
              <IconClose size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
