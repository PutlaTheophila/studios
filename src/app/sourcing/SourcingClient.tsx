'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SOURCING_STATUSES, STATUS_COLORS } from '@/lib/constants';
import { formatDate, isOverdue, todayISO } from '@/lib/utils';
import type { SourcingRecordWithDeliverables, SourcingStatus } from '@/types/database';
import { SourcingForm } from './SourcingForm';
import { SourcingDetail } from './SourcingDetail';
import { IconPlus } from '@/components/Icons';

export function SourcingClient() {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useQuery<SourcingRecordWithDeliverables[]>({
    queryKey: ['sourcing'],
    queryFn: async () => {
      const r = await fetch('/api/sourcing');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    }
  });

  const today = todayISO();
  const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const stats = {
    active: records.filter(r => r.status !== 'Cancelled' && r.status !== 'Returned').length,
    shipped: records.filter(r => r.status === 'Shipped').length,
    dueSoon: records.filter(r => r.return_date && r.return_date >= today && r.return_date <= inSevenDays && r.status !== 'Returned').length,
    shot: records.filter(r => r.status === 'Shot').length,
    returned: records.filter(r => r.status === 'Returned').length
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Sourcing Board</div>
          <div className="tb-sub">Collabs · Loans · Returns</div>
        </div>
        <div className="tb-right">
          <button className="btn btn-primary" onClick={() => setEditingId('new')}><IconPlus size={14} /> New Sourcing</button>
        </div>
      </div>

      <div className="content-area" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 28px 0' }}>
        <div className="stat-row">
          <StatCard value={stats.active} label="Active loans" highlight />
          <StatCard value={stats.shipped} label="Shipped" />
          <StatCard value={stats.dueSoon} label="Due this week" colorOverride={stats.dueSoon > 0 ? 'var(--amber)' : undefined} />
          <StatCard value={stats.shot} label="Shot" />
          <StatCard value={stats.returned} label="Returned" />
        </div>

        {isLoading ? (
          <div style={{ padding: 40, color: 'var(--tx3)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', gap: 11, overflowX: 'auto', flex: 1, paddingBottom: 16 }}>
            {SOURCING_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                records={records.filter(r => r.status === status)}
                onCardClick={(id) => setViewingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <SourcingForm
          recordId={editingId === 'new' ? null : editingId}
          onClose={() => setEditingId(null)}
        />
      )}
      {viewingId && (
        <SourcingDetail
          recordId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => { setEditingId(viewingId); setViewingId(null); }}
        />
      )}
    </>
  );
}

function StatCard({ value, label, highlight, colorOverride }: { value: number; label: string; highlight?: boolean; colorOverride?: string }) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <div className="stat-value" style={colorOverride ? { color: colorOverride } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function KanbanColumn({ status, records, onCardClick }: { status: SourcingStatus; records: SourcingRecordWithDeliverables[]; onCardClick: (id: string) => void }) {
  return (
    <div style={{ minWidth: 240, maxWidth: 240, background: 'var(--surf)', borderRadius: 'var(--rl)', border: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', transition: 'all var(--t) var(--ease)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: STATUS_COLORS[status] }}>{status}</span>
        <span style={{ fontSize: 10, background: 'var(--surf3)', color: 'var(--tx3)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{records.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {records.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: 11, textAlign: 'center', padding: 24, fontStyle: 'italic' }}>—</div>
        ) : records.map(r => {
          const od = isOverdue(r.return_date, r.status);
          const delCount = (r.deliverables || []).reduce((sum, d) => sum + d.quantity, 0);
          return (
            <div key={r.id} onClick={() => onCardClick(r.id)} className="card-tap" style={{
              background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)',
              padding: '12px 14px', cursor: 'pointer', borderLeft: `4px solid ${STATUS_COLORS[status]}`
            }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 4, letterSpacing: '-0.01em' }}>{r.brand}</div>
              <div style={{ fontSize: 11.5, color: 'var(--tx2)', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.outfit}</div>
              {r.source_date && <div style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'var(--fm)' }}>Sourced: {formatDate(r.source_date)}</div>}
              {r.return_date && <div style={{ fontSize: 10.5, color: od ? 'var(--red)' : 'var(--tx3)', fontFamily: 'var(--fm)' }}>Return: {formatDate(r.return_date)}</div>}
              {delCount > 0 && <div style={{ marginTop: 6 }}><span className="badge badge-neutral" style={{ fontSize: 9 }}>{delCount} deliverable{delCount === 1 ? '' : 's'}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
