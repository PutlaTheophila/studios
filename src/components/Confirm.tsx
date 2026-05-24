'use client';

import { useEffect, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

let setPending: ((p: PendingConfirm | null) => void) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    if (!setPending) { resolve(window.confirm(opts.message)); return; }
    setPending({ ...opts, resolve });
  });
}

export function ConfirmHost() {
  const [pending, setP] = useState<PendingConfirm | null>(null);
  useEffect(() => {
    setPending = setP;
    return () => { setPending = null; };
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { pending.resolve(false); setP(null); }
      else if (e.key === 'Enter') { pending.resolve(true); setP(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending]);

  if (!pending) return null;
  const { title = 'Confirm', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive } = pending;
  return (
    <div className="overlay center" onClick={e => { if (e.target === e.currentTarget) { pending.resolve(false); setP(null); } }}>
      <div className="modal" style={{ width: 380, maxWidth: '100%' }} role="alertdialog" aria-modal="true">
        <div style={{ padding: '18px 22px 4px', fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ padding: '6px 22px 18px', fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{message}</div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => { pending.resolve(false); setP(null); }} autoFocus={!destructive}>{cancelLabel}</button>
          <button className={destructive ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => { pending.resolve(true); setP(null); }} autoFocus={destructive}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
