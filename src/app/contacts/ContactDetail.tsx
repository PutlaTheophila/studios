'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Contact } from '@/types/database';
import { IconClose, IconEdit } from '@/components/Icons';

export function ContactDetail({ recordId, onClose, onEdit }: { recordId: string; onClose: () => void; onEdit: () => void }) {
  const qc = useQueryClient();

  const [record, setRecord] = useState<Contact | null>(() => {
    const cached = qc.getQueryData<Contact[]>(['contacts']);
    return cached?.find(c => c.id === recordId) ?? null;
  });
  const [loading, setLoading] = useState(!record);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (record) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/contacts/${recordId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then(d => { if (!cancelled) { setRecord(d); setLoading(false); } })
      .catch(err => { if (!cancelled) { setLoadError(err.message || 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [recordId, record]);

  if (loadError) {
    return (
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>Failed to load: {loadError}</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', gap: 13, alignItems: 'center' }}>
              <div className="skeleton-bar" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton-bar" style={{ height: 16, width: '60%' }} />
                <div className="skeleton-bar" style={{ height: 10, width: '80%' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 13, alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: 'var(--aglow)',
                border: '2px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--fd)', fontSize: 17, color: 'var(--acc)', fontWeight: 700, flexShrink: 0
              }}>{(record!.name || '?').charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{record!.name}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {record!.profession && <span className="badge badge-neutral">{record!.profession}</span>}
                  {record!.agency && <span className="badge badge-neutral">{record!.agency}</span>}
                  {record!.city && <span className="badge badge-neutral">{record!.city}</span>}
                </div>
              </div>
            </div>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-bar" style={{ height: 16 }} />)}
            </div>
          ) : (
            <>
              {record!.phone && <DetailRow label="Phone" value={<a href={`tel:${record!.phone}`}>{record!.phone}</a>} />}
              {record!.email && <DetailRow label="Email" value={<a href={`mailto:${record!.email}`}>{record!.email}</a>} />}
              {record!.instagram && (
                <DetailRow
                  label="Instagram"
                  value={<a href={`https://instagram.com/${record!.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">@{record!.instagram.replace(/^@/, '')}</a>}
                />
              )}
              {record!.notes && <><hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} /><DetailRow label="Notes" value={record!.notes} /></>}
            </>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7 }}>
          <button className="btn btn-primary btn-sm" onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><IconEdit size={13} /> Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 80, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
