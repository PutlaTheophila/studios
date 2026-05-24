'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOURCING_STATUSES, CONTENT_TYPE_LABELS } from '@/lib/constants';
import { formatDate, isOverdue } from '@/lib/utils';
import type { SourcingRecordWithDeliverables, SourcingStatus } from '@/types/database';
import { IconClose } from '@/components/Icons';
import { toast } from '@/components/Toast';

export function SourcingDetail({ recordId, onClose, onEdit }: { recordId: string; onClose: () => void; onEdit: () => void }) {
  const qc = useQueryClient();
  const [record, setRecord] = useState<SourcingRecordWithDeliverables | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/sourcing/${recordId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then(d => { if (!cancelled) setRecord(d); })
      .catch(err => { if (!cancelled) setLoadError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [recordId]);

  async function changeStatus(s: SourcingStatus) {
    const prev = record;
    setRecord(r => r ? { ...r, status: s } : r);
    const res = await fetch(`/api/sourcing/${recordId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || 'Status update failed');
      setRecord(prev);
      return;
    }
    qc.invalidateQueries({ queryKey: ['sourcing'] });
    toast.success(`Status changed to ${s}`);
  }

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
  const od = isOverdue(record.return_date, record.status);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{record.brand}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span className="badge badge-neutral">{record.status}</span>
              {record.agency && <span className="badge badge-neutral">{record.agency}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {record.outfit && <DetailRow label="Outfit" value={record.outfit} />}
          {record.event && <DetailRow label="Event" value={record.event} />}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', minWidth: 100 }}>Status</span>
            <select value={record.status} onChange={e => changeStatus(e.target.value as SourcingStatus)}
              style={{ background: 'var(--surf2)', border: '1px solid var(--bdr2)', borderRadius: 7, padding: '6px 9px', fontSize: 12 }}>
              {SOURCING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {record.source_date && <DetailRow label="Sourced" value={formatDate(record.source_date)} />}
          {record.return_date && <DetailRow label="Return By" value={`${formatDate(record.return_date)}${od ? ' — Overdue' : ''}`} className={od ? 'overdue' : ''} />}
          {record.deliverables && record.deliverables.length > 0 && (
            <DetailRow label="Deliverables" value={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {record.deliverables.map((d, i) => (
                  <span key={i} className="badge badge-neutral" style={{ fontSize: 10.5 }}>
                    {d.quantity}× {CONTENT_TYPE_LABELS[d.content_type]}
                  </span>
                ))}
              </div>
            } />
          )}
          {(!record.deliverables || record.deliverables.length === 0) && record.deliverables_text && <DetailRow label="Deliverables" value={record.deliverables_text} />}
          {(record.poc_name || record.poc_phone || record.poc_email) && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} />
              <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9 }}>Point of Contact</div>
              {record.poc_name && <DetailRow label="Name" value={record.poc_name} />}
              {record.poc_phone && <DetailRow label="Phone" value={<a href={`tel:${record.poc_phone}`}>{record.poc_phone}</a>} />}
              {record.poc_email && <DetailRow label="Email" value={<a href={`mailto:${record.poc_email}`}>{record.poc_email}</a>} />}
            </>
          )}
          {record.notes && <><hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} /><DetailRow label="Notes" value={record.notes} /></>}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7 }}>
          <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 100, paddingTop: 1 }}>{label}</span>
      <span className={className} style={{ fontSize: 12, color: className === 'overdue' ? 'var(--red)' : 'var(--tx2)', lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
