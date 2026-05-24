'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOURCING_STATUSES } from '@/lib/constants';
import type { SourcingStatus, ContentType } from '@/types/database';
import { IconClose } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { confirmDialog } from '@/components/Confirm';

interface Props { recordId: string | null; onClose: () => void; }

export function SourcingForm({ recordId, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    brand: '', outfit: '', agency: '',
    poc_name: '', poc_phone: '', poc_email: '',
    event: '', source_date: '', return_date: '',
    status: 'Pending' as SourcingStatus, notes: ''
  });
  const [deliverables, setDeliverables] = useState<{ content_type: ContentType; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recordId) return;
    fetch(`/api/sourcing/${recordId}`).then(r => r.json()).then((d: any) => {
      setForm({
        brand: d.brand || '', outfit: d.outfit || '', agency: d.agency || '',
        poc_name: d.poc_name || '', poc_phone: d.poc_phone || '', poc_email: d.poc_email || '',
        event: d.event || '', source_date: d.source_date || '', return_date: d.return_date || '',
        status: d.status, notes: d.notes || ''
      });
      const dels = Array.isArray(d.deliverables) ? d.deliverables : [];
      setDeliverables(dels.map((x: any) => ({ content_type: x.content_type, quantity: x.quantity })));
    });
  }, [recordId]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function addDel() { setDeliverables(d => [...d, { content_type: 'reel', quantity: 1 }]); }
  function removeDel(i: number) { setDeliverables(d => d.filter((_, j) => j !== i)); }
  function updateDel(i: number, k: 'content_type' | 'quantity', v: any) {
    setDeliverables(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  async function save() {
    if (!form.brand.trim()) { toast.error('Brand is required'); return; }
    setLoading(true);
    try {
      const url = recordId ? `/api/sourcing/${recordId}` : '/api/sourcing';
      const method = recordId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, deliverables })
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Save failed'); return; }
      qc.invalidateQueries({ queryKey: ['sourcing'] });
      toast.success(recordId ? 'Record updated' : 'Record created');
      onClose();
    } finally { setLoading(false); }
  }

  async function remove() {
    if (!recordId) return;
    const ok = await confirmDialog({
      title: 'Delete record',
      message: 'This will permanently remove this sourcing record. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;
    const res = await fetch(`/api/sourcing/${recordId}`, { method: 'DELETE' });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['sourcing'] });
      toast.success('Record deleted');
      onClose();
    } else {
      toast.error('Delete failed');
    }
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>
            {recordId ? 'Edit Record' : 'New Sourcing Record'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          <div className="form-grid">
            <div className="form-row"><label>Brand Name *</label><input value={form.brand} onChange={e => update('brand', e.target.value)} /></div>
            <div className="form-row"><label>Agency</label><input value={form.agency} onChange={e => update('agency', e.target.value)} /></div>
          </div>
          <div className="form-row"><label>Outfit / Description</label><textarea value={form.outfit} onChange={e => update('outfit', e.target.value)} /></div>
          <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9 }}>Point of Contact</div>
            <div className="form-grid">
              <div className="form-row"><label>POC Name</label><input value={form.poc_name} onChange={e => update('poc_name', e.target.value)} /></div>
              <div className="form-row"><label>Phone</label><input value={form.poc_phone} onChange={e => update('poc_phone', e.target.value)} /></div>
            </div>
            <div className="form-row"><label>Email</label><input type="email" value={form.poc_email} onChange={e => update('poc_email', e.target.value)} /></div>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>Event/Campaign</label><input value={form.event} onChange={e => update('event', e.target.value)} /></div>
            <div className="form-row">
              <label>Status</label>
              <select value={form.status} onChange={e => update('status', e.target.value as SourcingStatus)}>
                {SOURCING_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>Source Date</label><input type="date" value={form.source_date} onChange={e => update('source_date', e.target.value)} /></div>
            <div className="form-row"><label>Return Date</label><input type="date" value={form.return_date} onChange={e => update('return_date', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <label>Deliverables (Type + Quantity)</label>
            {deliverables.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, padding: 7, background: 'var(--surf3)', borderRadius: 7 }}>
                <select value={d.content_type} onChange={e => updateDel(i, 'content_type', e.target.value)}
                  style={{ flex: 1, minWidth: 130, padding: '8px 11px', background: 'var(--surf)', border: '1px solid var(--bdr2)', borderRadius: 7 }}>
                  <option value="reel">Reel</option><option value="post">Post</option>
                  <option value="story">Story</option><option value="carousel">Carousel</option>
                  <option value="live">Live</option>
                </select>
                <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700 }}>×</span>
                <input type="number" min={1} max={30} value={d.quantity} onChange={e => updateDel(i, 'quantity', parseInt(e.target.value) || 1)}
                  style={{ width: 70, padding: '8px 11px', background: 'var(--surf)', border: '1px solid var(--bdr2)', borderRadius: 7, textAlign: 'center' }} />
                <button onClick={() => removeDel(i)} className="btn btn-secondary btn-sm" type="button">✕</button>
              </div>
            ))}
            <button onClick={addDel} className="btn btn-secondary btn-sm" type="button">+ Add Deliverable</button>
          </div>
          <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          {recordId && <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
