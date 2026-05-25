'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { MONTH_NAMES, DAY_NAMES, STAGE_LABELS, STAGE_ORDER, CONTENT_TYPE_BADGE, CATEGORY_LABELS } from '@/lib/constants';
import type { ContentItemWithDeliverables, ContentCategory, ContentStage, ContentType } from '@/types/database';
import { toast } from '@/components/Toast';
import { IconPlus } from '@/components/Icons';
import { ContentDetail } from './ContentDetail';

const CATEGORY_COLORS: Record<ContentCategory, { color: string; soft: string }> = {
  personal:        { color: 'var(--blue)',   soft: 'var(--blue-soft)' },
  branded:         { color: 'var(--acc)',    soft: 'var(--aglow)' },
  paid:            { color: 'var(--amber)',  soft: 'var(--amber-soft)' },
  event_coverage:  { color: 'var(--purple)', soft: 'var(--purple-soft)' },
  travel:          { color: 'var(--teal)',   soft: 'rgba(45, 122, 122, 0.08)' },
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function CalendarClient() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [filter, setFilter] = useState<'all' | ContentCategory | 'posted' | 'pending'>('all');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | undefined>();

  const { data: items = [], isLoading } = useQuery<ContentItemWithDeliverables[]>({
    queryKey: ['content'],
    queryFn: async () => {
      const r = await fetch('/api/content');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    }
  });

  // monthly stats
  const yyyymm = `${year}-${String(month+1).padStart(2,'0')}`;
  const monthItems = items.filter(c => (c.posted_date || c.planned_date || '').startsWith(yyyymm));
  const posted = monthItems.filter(c => c.stage === 'posted').length;
  const planned = monthItems.filter(c => c.stage !== 'posted' && c.stage !== 'archived').length;
  const branded = monthItems.filter(c => c.category === 'branded').length;
  const paid = monthItems.filter(c => c.category === 'paid').length;
  const personal = monthItems.filter(c => c.category === 'personal').length;

  // build calendar grid
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalCells = Math.ceil((startDay + last.getDate()) / 7) * 7;
  const todayISO = ymd(today);

  const filtered = useMemo(() => items.filter(c => {
    if (filter === 'posted') return c.stage === 'posted';
    if (filter === 'pending') return c.stage !== 'posted';
    if (filter !== 'all') return c.category === filter;
    return true;
  }), [items, filter]);

  function dateOf(item: ContentItemWithDeliverables): string | null {
    return item.posted_date || item.scheduled_date || item.planned_date || null;
  }

  function nav(dir: number) {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setYear(y); setMonth(m);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Content Calendar</div>
          <div className="tb-sub">{MONTH_NAMES[month]} {year} · Plan, schedule, and publish</div>
        </div>
        <div className="tb-right">
          <button className="btn btn-primary" onClick={() => { setEditingDate(undefined); setEditingId('new'); }}>
            <IconPlus size={14} /> New Content
          </button>
        </div>
      </div>

      <div className="content-area">
        <div className="stat-row">
          <div className="stat-card highlight"><div className="stat-value">{posted}</div><div className="stat-label">Posted this month</div></div>
          <div className="stat-card"><div className="stat-value">{planned}</div><div className="stat-label">Planned</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--acc)' }}>{branded}</div><div className="stat-label">Branded</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--amber)' }}>{paid}</div><div className="stat-label">Paid</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--blue)' }}>{personal}</div><div className="stat-label">Personal</div></div>
        </div>

        <div className="cal-toolbar">
          <div className="cal-nav" role="group" aria-label="Month navigation">
            <button className="cal-nav-btn" onClick={() => nav(-1)} aria-label="Previous month">‹</button>
            <button className="cal-nav-btn today-btn" onClick={goToday} title="Jump to today">Today</button>
            <button className="cal-nav-btn" onClick={() => nav(1)} aria-label="Next month">›</button>
          </div>
          <div className="cal-month-label">
            {MONTH_NAMES[month]}<span className="yr">{year}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="cal-view-switch" role="tablist" aria-label="Calendar view">
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            <button className={view === 'agenda' ? 'active' : ''} onClick={() => setView('agenda')}>Agenda</button>
          </div>
        </div>

        <FilterBar filter={filter} setFilter={setFilter} />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: 'var(--bdr)' }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--surf)', minHeight: 90, padding: 6 }}>
                  <div className="skeleton-bar" style={{ height: 11, width: 20, marginBottom: 6 }} />
                  {i % 5 === 0 && <div className="skeleton-bar" style={{ height: 18, borderRadius: 4 }} />}
                </div>
              ))}
            </div>
          </div>
        ) : view === 'month' ? (
          <>
            <div className="cal-dow">
              {DAY_NAMES.map((d, i) => (
                <div key={d} className={i === 0 || i === 6 ? 'weekend' : ''}>{d}</div>
              ))}
            </div>

            <div className="cal-grid">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dn = i - startDay + 1;
                const isCM = dn >= 1 && dn <= last.getDate();
                const dateObj = new Date(year, month, dn);
                const dStr = ymd(dateObj);
                const isToday = isCM && dStr === todayISO;
                const dow = i % 7;
                const isWeekend = dow === 0 || dow === 6;
                const dayItems = isCM ? filtered.filter(c => {
                  return c.planned_date === dStr || c.scheduled_date === dStr || c.posted_date === dStr;
                }) : [];

                const visible = dayItems.slice(0, 3);
                const overflow = dayItems.length - visible.length;

                const classes = [
                  'cal-day',
                  !isCM && 'other-month',
                  isWeekend && 'weekend',
                  isToday && 'today',
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={i}
                    className={classes}
                    onClick={() => isCM && (setEditingDate(dStr), setEditingId('new'))}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="cal-day-num">{isCM ? dn : ''}</span>
                    </div>
                    {isCM && (
                      <span className="cal-add-hint" aria-hidden>
                        <IconPlus size={10} />
                      </span>
                    )}
                    {visible.map(it => {
                      const cat = CATEGORY_COLORS[it.category];
                      const label = (it.deliverables || []).map(d => CONTENT_TYPE_BADGE[d.content_type]).join('+') || '•';
                      return (
                        <div
                          key={it.id}
                          onClick={(e) => { e.stopPropagation(); setViewingId(it.id); }}
                          className={`cal-event ${it.stage === 'posted' ? 'posted' : ''}`}
                          style={{ ['--ev-color' as any]: cat.color, ['--ev-soft' as any]: cat.soft }}
                          title={`${it.title} · ${CATEGORY_LABELS[it.category]} · ${STAGE_LABELS[it.stage]}`}
                        >
                          <span className="cal-event-type">{label}</span>
                          <span className="cal-event-title">{it.title}</span>
                          <span className="cal-event-stage">{STAGE_LABELS[it.stage]}</span>
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <div
                        className="cal-more"
                        onClick={(e) => { e.stopPropagation(); setView('agenda'); }}
                      >
                        +{overflow} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend" aria-label="Category legend">
              {(Object.entries(CATEGORY_LABELS) as [ContentCategory, string][]).map(([k, label]) => (
                <span key={k} className="cal-legend-item">
                  <span className="cal-legend-dot" style={{ background: CATEGORY_COLORS[k].color }} />
                  {label}
                </span>
              ))}
            </div>
          </>
        ) : !isLoading ? (
          <AgendaView
            items={filtered}
            year={year}
            month={month}
            todayISO={todayISO}
            onItemClick={(id) => setViewingId(id)}
            onDayClick={(d) => { setEditingDate(d); setEditingId('new'); }}
          />
        ) : null}
      </div>

      {editingId && (
        <ContentForm
          contentId={editingId === 'new' ? null : editingId}
          defaultPlannedDate={editingDate}
          onClose={() => setEditingId(null)}
        />
      )}
      {viewingId && (
        <ContentDetail
          recordId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => { setEditingId(viewingId); setViewingId(null); }}
        />
      )}
    </>
  );
}

function AgendaView({
  items, year, month, todayISO, onItemClick, onDayClick
}: {
  items: ContentItemWithDeliverables[];
  year: number;
  month: number;
  todayISO: string;
  onItemClick: (id: string) => void;
  onDayClick: (d: string) => void;
}) {
  const yyyymm = `${year}-${String(month + 1).padStart(2, '0')}`;
  const byDay = new Map<string, ContentItemWithDeliverables[]>();
  for (const it of items) {
    const d = it.posted_date || it.scheduled_date || it.planned_date;
    if (!d || !d.startsWith(yyyymm)) continue;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(it);
  }
  const days = Array.from(byDay.keys()).sort();

  if (days.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📅</div>
        <div className="empty-title">No content scheduled this month</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Switch back to month view to add a new piece.</div>
      </div>
    );
  }

  return (
    <div className="cal-agenda">
      {days.map(d => {
        const date = new Date(`${d}T00:00:00`);
        const dom = date.getDate();
        const dow = DAY_NAMES[date.getDay()];
        const isToday = d === todayISO;
        return (
          <div key={d} className={`cal-agenda-day ${isToday ? 'today' : ''}`}>
            <div className="cal-agenda-date" onClick={() => onDayClick(d)} style={{ cursor: 'pointer' }}>
              <div className="cal-agenda-dom">{dom}</div>
              <div className="cal-agenda-dow">{dow}{isToday ? ' · Today' : ''}</div>
            </div>
            <div className="cal-agenda-items">
              {byDay.get(d)!.map(it => {
                const cat = CATEGORY_COLORS[it.category];
                const label = (it.deliverables || []).map(x => CONTENT_TYPE_BADGE[x.content_type]).join('+') || '•';
                return (
                  <div
                    key={it.id}
                    className={`cal-event ${it.stage === 'posted' ? 'posted' : ''}`}
                    style={{ ['--ev-color' as any]: cat.color, ['--ev-soft' as any]: cat.soft, minHeight: 28 }}
                    onClick={() => onItemClick(it.id)}
                  >
                    <span className="cal-event-type">{label}</span>
                    <span className="cal-event-title">{it.title}</span>
                    <span className="badge badge-neutral" style={{ fontSize: 8.5, padding: '1px 7px' }}>{CATEGORY_LABELS[it.category]}</span>
                    <span className="cal-event-stage">{STAGE_LABELS[it.stage]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterBar({ filter, setFilter }: { filter: any; setFilter: (f: any) => void }) {
  const opts = [
    { v: 'all', l: 'All' }, { v: 'personal', l: 'Personal' },
    { v: 'branded', l: 'Branded' }, { v: 'paid', l: 'Paid' },
    { v: 'event_coverage', l: 'Event' }, { v: 'travel', l: 'Travel' },
    { v: 'posted', l: 'Posted' }, { v: 'pending', l: 'Pending' }
  ];
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 13, flexWrap: 'wrap' }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => setFilter(o.v)} className={`filter-tab ${filter === o.v ? 'active' : ''}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function contentFormFromData(d: any, defaultPlannedDate?: string) {
  return {
    title: d.title || '',
    category: (d.category || 'personal') as ContentCategory,
    stage: (d.stage || 'concept') as ContentStage,
    planned_date: d.planned_date || defaultPlannedDate || '',
    scheduled_date: d.scheduled_date || '',
    posted_date: d.posted_date || '',
    poc_name: d.poc_name || '',
    poc_phone: d.poc_phone || '',
    poc_email: d.poc_email || '',
    notes: d.notes || ''
  };
}

function ContentForm({ contentId, defaultPlannedDate, onClose }: { contentId: string | null; defaultPlannedDate?: string; onClose: () => void }) {
  const qc = useQueryClient();

  const [form, setForm] = useState(() => {
    if (!contentId) return contentFormFromData({}, defaultPlannedDate);
    const cached = qc.getQueryData<ContentItemWithDeliverables[]>(['content']);
    const found = cached?.find(c => c.id === contentId);
    return found ? contentFormFromData(found) : contentFormFromData({}, defaultPlannedDate);
  });

  const [deliverables, setDeliverables] = useState<{ content_type: ContentType; quantity: number }[]>(() => {
    if (!contentId) return [{ content_type: 'reel', quantity: 1 }];
    const cached = qc.getQueryData<ContentItemWithDeliverables[]>(['content']);
    const found = cached?.find(c => c.id === contentId);
    const dels = Array.isArray(found?.deliverables) ? found!.deliverables : [];
    return dels.length > 0
      ? dels.map((x: any) => ({ content_type: x.content_type, quantity: x.quantity }))
      : [{ content_type: 'reel', quantity: 1 }];
  });

  const [formLoading, setFormLoading] = useState(() => {
    if (!contentId) return false;
    const cached = qc.getQueryData<ContentItemWithDeliverables[]>(['content']);
    return !cached?.find(c => c.id === contentId);
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId || !formLoading) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/content/${contentId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then((d: any) => {
        if (cancelled) return;
        setForm(contentFormFromData(d));
        const dels = Array.isArray(d.deliverables) ? d.deliverables : [];
        setDeliverables(
          dels.length > 0
            ? dels.map((x: any) => ({ content_type: x.content_type, quantity: x.quantity }))
            : [{ content_type: 'reel', quantity: 1 }]
        );
        setFormLoading(false);
      })
      .catch(err => { if (!cancelled) { setLoadError(err.message || 'Failed to load'); setFormLoading(false); } });
    return () => { cancelled = true; };
  }, [contentId, formLoading]);

  function addDel() { setDeliverables(d => [...d, { content_type: 'reel', quantity: 1 }]); }
  function removeDel(i: number) { setDeliverables(d => d.filter((_, j) => j !== i)); }
  function updateDel(i: number, k: 'content_type' | 'quantity', v: any) {
    setDeliverables(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (deliverables.length === 0) { toast.error('Add at least one deliverable'); return; }
    setLoading(true);

    const prev = qc.getQueryData<ContentItemWithDeliverables[]>(['content']) ?? [];
    if (contentId) {
      qc.setQueryData(['content'], (old: any[] = []) =>
        old.map(c => c.id === contentId ? { ...c, ...form, deliverables } : c)
      );
    } else {
      const tempId = `opt-${Date.now()}`;
      qc.setQueryData(['content'], (old: any[] = []) =>
        [{ ...form, id: tempId, deliverables, created_at: new Date().toISOString() }, ...old]
      );
    }
    onClose();

    const url = contentId ? `/api/content/${contentId}` : '/api/content';
    const method = contentId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, deliverables }) });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || 'Save failed');
      qc.setQueryData(['content'], prev);
      return;
    }
    toast.success(contentId ? 'Content updated' : 'Content created');
    qc.invalidateQueries({ queryKey: ['content'] });
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{contentId ? 'Edit' : 'New'} Content</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loadError && <div style={{ background: 'rgba(184,50,50,0.08)', color: 'var(--red)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>{loadError}</div>}
          {formLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton-bar" style={{ height: 10, width: 80 }} />
                  <div className="skeleton-bar" style={{ height: 36, width: '100%' }} />
                </div>
              ))}
            </div>
          ) : (<>
          <div className="form-row"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-row">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ContentCategory })}>
              {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
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
                {deliverables.length > 1 && <button onClick={() => removeDel(i)} className="btn btn-secondary btn-sm">✕</button>}
              </div>
            ))}
            <button onClick={addDel} className="btn btn-secondary btn-sm">+ Add Deliverable</button>
          </div>
          <div className="form-row">
            <label>Stage</label>
            <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as ContentStage })}>
              {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>Planned Date</label><input type="date" value={form.planned_date} onChange={e => setForm({ ...form, planned_date: e.target.value })} /></div>
            <div className="form-row"><label>Scheduled</label><input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Posted Date</label><input type="date" value={form.posted_date} onChange={e => setForm({ ...form, posted_date: e.target.value })} /></div>
          <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 9 }}>POC / Brand Contact</div>
            <div className="form-grid">
              <div className="form-row"><label>Name</label><input value={form.poc_name} onChange={e => setForm({ ...form, poc_name: e.target.value })} /></div>
              <div className="form-row"><label>Phone</label><input value={form.poc_phone} onChange={e => setForm({ ...form, poc_phone: e.target.value })} /></div>
            </div>
            <div className="form-row"><label>Email</label><input type="email" value={form.poc_email} onChange={e => setForm({ ...form, poc_email: e.target.value })} /></div>
          </div>
          </>)}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading || formLoading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
