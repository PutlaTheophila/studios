'use client';

import { useEffect, useState } from 'react';
import { EVENT_TYPE_LABELS, IMPORTANCE_LABELS, CONTENT_TYPE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { EventWithDetails } from '@/types/database';
import { IconClose, IconEdit, Stars } from '@/components/Icons';

export function EventDetail({ recordId, onClose, onEdit }: { recordId: string; onClose: () => void; onEdit: () => void }) {
  const [record, setRecord] = useState<EventWithDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/events/${recordId}`)
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

  const deliverables = record.deliverables || [];
  const deliverablesText = deliverables.length > 0
    ? deliverables.map(d => `${d.quantity}× ${CONTENT_TYPE_LABELS[d.content_type]}`).join(', ')
    : null;
  const sameDay = record.start_date === record.end_date;
  const dateRange = sameDay ? formatDate(record.start_date) : `${formatDate(record.start_date)} → ${formatDate(record.end_date)}`;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{record.name}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-neutral">{EVENT_TYPE_LABELS[record.event_type]}</span>
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Stars n={record.importance} size={11} /> {IMPORTANCE_LABELS[record.importance]}
              </span>
              {record.travel_required && <span className="badge badge-neutral">✈ Travel</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          <DetailRow label="Date" value={dateRange} />
          {record.city && <DetailRow label="City" value={record.city} />}
          {record.venue && <DetailRow label="Venue" value={record.venue} />}
          {record.organiser && <DetailRow label="Organiser" value={record.organiser} />}
          {deliverablesText && <DetailRow label="Deliverables" value={deliverablesText} />}
          {(record.poc_name || record.poc_phone || record.poc_email) && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} />
              <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9 }}>Point of Contact</div>
              {record.poc_name && <DetailRow label="Name" value={record.poc_name} />}
              {record.poc_phone && <DetailRow label="Phone" value={<a href={`tel:${record.poc_phone}`}>{record.poc_phone}</a>} />}
              {record.poc_email && <DetailRow label="Email" value={<a href={`mailto:${record.poc_email}`}>{record.poc_email}</a>} />}
            </>
          )}
          {record.travel_required && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} />
              <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9 }}>Travel</div>
              {record.travel_destination && <DetailRow label="Destination" value={record.travel_destination} />}
              {record.travel_depart_date && <DetailRow label="Depart" value={formatDate(record.travel_depart_date)} />}
              {record.travel_return_date && <DetailRow label="Return" value={formatDate(record.travel_return_date)} />}
              {record.travel_hotel && <DetailRow label="Hotel" value={record.travel_hotel} />}
            </>
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
