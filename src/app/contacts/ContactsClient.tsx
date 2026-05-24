'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PROFESSIONS } from '@/lib/constants';
import type { Contact } from '@/types/database';
import { IconPhone, IconMail, IconUser, IconClose, IconPlus, IconDownload, IconShirt, IconSparkles, IconCalendar, IconSearch } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { ContactDetail } from './ContactDetail';

export function ContactsClient() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ city: 'all', profession: 'all', agency: 'all' });
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const r = await fetch('/api/contacts');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    }
  });

  const { data: importable } = useQuery<{ sourcing: any[]; events: any[]; content: any[] }>({
    queryKey: ['importable'],
    queryFn: async () => {
      const r = await fetch('/api/import');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    }
  });

  const importCount = (importable?.sourcing.length || 0) + (importable?.events.length || 0) + (importable?.content.length || 0);

  const isStr = (s: string | null): s is string => !!s;
  const cities = Array.from(new Set(contacts.map(c => c.city).filter(isStr))).sort();
  const profs = Array.from(new Set(contacts.map(c => c.profession).filter(isStr))).sort();
  const agencies = Array.from(new Set(contacts.map(c => c.agency).filter(isStr))).sort();

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    if (q && !`${c.name} ${c.agency} ${c.city} ${c.profession}`.toLowerCase().includes(q)) return false;
    if (filters.city !== 'all' && c.city !== filters.city) return false;
    if (filters.profession !== 'all' && c.profession !== filters.profession) return false;
    if (filters.agency !== 'all' && c.agency !== filters.agency) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Contacts</div>
          <div className="tb-sub">Your professional network</div>
        </div>
        <div className="tb-right">
          {importCount > 0 && <button className="btn btn-secondary" onClick={() => setShowImport(true)}><IconDownload size={14} /> Import ({importCount})</button>}
          <button className="btn btn-primary" onClick={() => setEditingId('new')}><IconPlus size={14} /> New Contact</button>
        </div>
      </div>

      <div className="content-area">
        <div className="stat-row">
          <div className="stat-card highlight"><div className="stat-value">{contacts.length}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value">{cities.length}</div><div className="stat-label">Cities</div></div>
          <div className="stat-card"><div className="stat-value">{agencies.length}</div><div className="stat-label">Agencies</div></div>
          <div className="stat-card"><div className="stat-value">{importCount}</div><div className="stat-label">To import</div></div>
        </div>

        <div className="search-bar">
          <span className="search-icon"><IconSearch size={14} /></span>
          <input
            placeholder="Search name, agency, city, profession…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="search-clear">
              <IconClose size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
          <FilterSelect label="All Cities" value={filters.city} options={cities} onChange={v => setFilters({ ...filters, city: v })} />
          <FilterSelect label="All Professions" value={filters.profession} options={profs} onChange={v => setFilters({ ...filters, profession: v })} />
          <FilterSelect label="All Agencies" value={filters.agency} options={agencies} onChange={v => setFilters({ ...filters, agency: v })} />
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilters({ city: 'all', profession: 'all', agency: 'all' }); }}>Clear</button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon"><IconUser size={42} /></div><div className="empty-title">No contacts</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 11 }}>
            {filtered.map(c => (
              <div key={c.id} className="card-tap" onClick={() => setViewingId(c.id)} style={{
                background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)',
                padding: '15px 17px', cursor: 'pointer', display: 'flex', gap: 13
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'var(--aglow)',
                  border: '2px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--fd)', fontSize: 15, color: 'var(--acc)', fontWeight: 700, flexShrink: 0
                }}>{(c.name || '?').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 5 }}>
                    {[c.profession, c.agency, c.city].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ fontSize: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconPhone size={11} /> {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconMail size={11} /> {c.email}</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && <ContactForm contactId={editingId === 'new' ? null : editingId} onClose={() => setEditingId(null)} />}
      {viewingId && (
        <ContactDetail
          recordId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => { setEditingId(viewingId); setViewingId(null); }}
        />
      )}
      {showImport && <ImportDialog importable={importable} onClose={() => setShowImport(false)} />}
    </>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '4px 12px', borderRadius: 18, fontSize: 11, fontWeight: 500,
      border: `1px solid ${value !== 'all' ? 'var(--acc)' : 'var(--bdr2)'}`,
      background: value !== 'all' ? 'var(--aglow)' : 'transparent',
      color: value !== 'all' ? 'var(--acc)' : 'var(--tx3)'
    }}>
      <option value="all">{label}</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ContactForm({ contactId, onClose }: { contactId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', agency: '', city: '', profession: 'Brand Manager',
    phone: '', email: '', instagram: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/contacts/${contactId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then((d: Contact) => {
        if (cancelled) return;
        setForm({
          name: d.name || '',
          agency: d.agency || '',
          city: d.city || '',
          profession: d.profession || 'Brand Manager',
          phone: d.phone || '',
          email: d.email || '',
          instagram: d.instagram || '',
          notes: d.notes || ''
        });
      })
      .catch(err => { if (!cancelled) setLoadError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [contactId]);

  async function save() {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const url = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
      const method = contactId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); toast.error(e.error || 'Save failed'); return; }
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(contactId ? 'Contact updated' : 'Contact created');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{contactId ? 'Edit Contact' : 'New Contact'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loadError && <div style={{ background: 'rgba(184,50,50,0.08)', color: 'var(--red)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>{loadError}</div>}
          <div className="form-row"><label>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-grid">
            <div className="form-row">
              <label>Profession</label>
              <select value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })}>
                {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-row"><label>Agency</label><input value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          <div className="form-grid">
            <div className="form-row"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-row"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Instagram</label><input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" /></div>
          <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function ImportDialog({ importable, onClose }: { importable: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [selectedSourcing, setSelectedSourcing] = useState<Set<string>>(new Set((importable?.sourcing || []).map((s: any) => s.id)));
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set((importable?.events || []).map((e: any) => e.id)));
  const [selectedContent, setSelectedContent] = useState<Set<string>>(new Set((importable?.content || []).map((c: any) => c.id)));
  const [importing, setImporting] = useState(false);

  function toggle(set: Set<string>, setSet: any, id: string) {
    const ns = new Set(set);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSet(ns);
  }

  async function runImport() {
    if (importing) return;
    setImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcing_ids: Array.from(selectedSourcing),
          event_ids: Array.from(selectedEvents),
          content_ids: Array.from(selectedContent)
        })
      });
      if (!res.ok) { toast.error('Import failed'); return; }
      const data = await res.json().catch(() => ({}));
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['importable'] });
      toast.success(`Imported ${data.imported ?? ''} contact${data.imported === 1 ? '' : 's'}`.trim());
      onClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>Import Contacts</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {(['sourcing', 'events', 'content'] as const).map(key => {
            const items = importable?.[key] || [];
            if (items.length === 0) return null;
            const selected = key === 'sourcing' ? selectedSourcing : key === 'events' ? selectedEvents : selectedContent;
            const setSelected = key === 'sourcing' ? setSelectedSourcing : key === 'events' ? setSelectedEvents : setSelectedContent;
            const labels: Record<typeof key, { Icon: React.FC<any>; text: string }> = {
              sourcing: { Icon: IconShirt, text: 'From Sourcing' },
              events:   { Icon: IconSparkles, text: 'From Events' },
              content:  { Icon: IconCalendar, text: 'From Content Calendar' }
            };
            const L = labels[key];
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--tx3)', marginBottom: 7, display: 'inline-flex', alignItems: 'center', gap: 6 }}><L.Icon size={12} /> {L.text}</div>
                {items.map((item: any) => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--bdr)' }}>
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(selected, setSelected, item.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{item.poc_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{item.agency || item.organiser || ''} {item.brand || item.name || item.title}</div>
                    </div>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={importing}>Cancel</button>
          <button className="btn btn-primary" onClick={runImport} disabled={importing}>{importing ? 'Importing…' : 'Import Selected'}</button>
        </div>
      </div>
    </div>
  );
}
