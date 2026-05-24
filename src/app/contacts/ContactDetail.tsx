'use client';

import { useEffect, useState } from 'react';
import type { Contact } from '@/types/database';
import { IconClose, IconEdit } from '@/components/Icons';

export function ContactDetail({ recordId, onClose, onEdit }: { recordId: string; onClose: () => void; onEdit: () => void }) {
  const [record, setRecord] = useState<Contact | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/contacts/${recordId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then(d => { if (!cancelled) setRecord(d); })
      .catch(err => { if (!cancelled) setLoadError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [recordId]);

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
  if (!record) return null;

  const instagramHandle = record.instagram ? record.instagram.replace(/^@/, '') : '';

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 13, alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: 'var(--aglow)',
              border: '2px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--fd)', fontSize: 17, color: 'var(--acc)', fontWeight: 700, flexShrink: 0
            }}>{(record.name || '?').charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{record.name}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {record.profession && <span className="badge badge-neutral">{record.profession}</span>}
                {record.agency && <span className="badge badge-neutral">{record.agency}</span>}
                {record.city && <span className="badge badge-neutral">{record.city}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {record.phone && <DetailRow label="Phone" value={<a href={`tel:${record.phone}`}>{record.phone}</a>} />}
          {record.email && <DetailRow label="Email" value={<a href={`mailto:${record.email}`}>{record.email}</a>} />}
          {record.instagram && (
            <DetailRow
              label="Instagram"
              value={<a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noopener noreferrer">@{instagramHandle}</a>}
            />
          )}
          {record.notes && <><hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} /><DetailRow label="Notes" value={record.notes} /></>}
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
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${className || ''}`}>{value}</span>
    </div>
  );
}
