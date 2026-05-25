'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { EVENT_TYPE_LABELS, IMPORTANCE_LABELS, MONTH_NAMES, DAY_NAMES } from '@/lib/constants';
import { formatDate, todayISO } from '@/lib/utils';
import type { EventWithDetails, EventType } from '@/types/database';
import { IconPlus, IconClose, IconSparkles, IconList, IconCalendar, Stars } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { EventDetail } from './EventDetail';

export function EventsClient() {
  const today = new Date();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calY, setCalY] = useState(today.getFullYear());
  const [calM, setCalM] = useState(today.getMonth());
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [travelFilter, setTravelFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const r = await fetch('/api/events');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    }
  });

  const filtered = events.filter(ev => {
    if (typeFilter !== 'all' && ev.event_type !== typeFilter) return false;
    if (travelFilter === 'yes' && !ev.travel_required) return false;
    if (travelFilter === 'no' && ev.travel_required) return false;
    return true;
  }).sort((a, b) => b.importance - a.importance || a.start_date.localeCompare(b.start_date));

  const tdToday = todayISO();
  const upcoming = events.filter(e => e.start_date >= tdToday).length;
  const essential = events.filter(e => e.importance === 5).length;
  const travel = events.filter(e => e.travel_required).length;
  const totalDels = events.reduce((a, e) => a + (e.deliverables || []).reduce((b, d) => b + d.quantity, 0), 0);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Events</div>
          <div className="tb-sub">{view === 'calendar' ? `${MONTH_NAMES[calM]} ${calY}` : 'Sorted by importance'}</div>
        </div>
        <div className="tb-right">
          <button className="btn btn-primary" onClick={() => setEditingId('new')}>+ New Event</button>
        </div>
      </div>

      <div className="content-area">
        <div className="stat-row">
          <div className="stat-card highlight"><div className="stat-value">{upcoming}</div><div className="stat-label">Upcoming</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#7A6000' }}>{essential}</div><div className="stat-label">Essential</div></div>
          <div className="stat-card"><div className="stat-value">{travel}</div><div className="stat-label">With travel</div></div>
          <div className="stat-card"><div className="stat-value">{totalDels}</div><div className="stat-label">Deliverables</div></div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 13, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}>☰ List</button>
          <button className={`btn btn-sm ${view === 'calendar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('calendar')}>📅 Calendar</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase' }}>Type:</span>
          <FilterTab active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All Types</FilterTab>
          {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
            <FilterTab key={k} active={typeFilter === k} onClick={() => setTypeFilter(k as EventType)}>{v}</FilterTab>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase' }}>Travel:</span>
          <FilterTab active={travelFilter === 'all'} onClick={() => setTravelFilter('all')}>All</FilterTab>
          <FilterTab active={travelFilter === 'yes'} onClick={() => setTravelFilter('yes')}>Travel Only</FilterTab>
          <FilterTab active={travelFilter === 'no'} onClick={() => setTravelFilter('no')}>No Travel</FilterTab>
        </div>

        {view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {isLoading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: '14px 18px', display: 'flex', gap: 15, borderLeft: '5px solid var(--surf3)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 44, alignItems: 'center' }}>
                    <div className="skeleton-bar" style={{ height: 22, width: 32 }} />
                    <div className="skeleton-bar" style={{ height: 9, width: 28 }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton-bar" style={{ height: 13, width: '60%' }} />
                    <div className="skeleton-bar" style={{ height: 11, width: '40%' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty"><div className="empty-icon">✨</div><div className="empty-title">No events</div></div>
            ) : filtered.map(ev => (
              <EventCard key={ev.id} event={ev} onClick={() => setViewingId(ev.id)} />
            ))}
          </div>
        ) : (
          <CalendarGrid year={calY} month={calM} events={filtered}
            onNav={(d) => { let m = calM + d, y = calY; if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; } setCalY(y); setCalM(m); }}
            onEventClick={(id) => setViewingId(id)} />
        )}
      </div>

      {editingId && <EventForm eventId={editingId === 'new' ? null : editingId} onClose={() => setEditingId(null)} />}
      {viewingId && (
        <EventDetail
          recordId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => { setEditingId(viewingId); setViewingId(null); }}
        />
      )}
    </>
  );
}

function FilterTab({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={`filter-tab ${active ? 'active' : ''}`}>
      {children}
    </button>
  );
}

function EventCard({ event, onClick }: { event: EventWithDetails; onClick: () => void }) {
  const d = new Date(event.start_date);
  const day = d.getDate(), mon = MONTH_NAMES[d.getMonth()].slice(0, 3).toUpperCase();
  const dc = (event.deliverables || []).reduce((a, d) => a + d.quantity, 0);
  const past = event.end_date < todayISO();
  const impColors: Record<number, string> = { 5:'#B8960A', 4:'var(--red)', 3:'var(--acc)', 2:'var(--blue)', 1:'var(--tx3)' };
  return (
    <div className="card-tap" onClick={onClick} style={{
      background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)',
      padding: '14px 18px', cursor: 'pointer', borderLeft: `5px solid ${impColors[event.importance]}`,
      display: 'flex', gap: 15, opacity: past ? 0.55 : 1
    }}>
      <div style={{ textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--tx3)', marginTop: 1 }}>{mon}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{event.name}</div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {event.city && <span>📍 {event.city}</span>}
          {event.venue && <span>{event.venue}</span>}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
          <span className="badge badge-neutral">{EVENT_TYPE_LABELS[event.event_type]}</span>
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Stars n={event.importance} size={11} /> {IMPORTANCE_LABELS[event.importance]}</span>
          {event.travel_required && <span className="badge badge-neutral">✈ Travel</span>}
          {dc > 0 && <span className="badge badge-neutral">{dc} del</span>}
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({ year, month, events, onNav, onEventClick }: { year: number; month: number; events: EventWithDetails[]; onNav: (d: number) => void; onEventClick: (id: string) => void }) {
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const total = Math.ceil((startDay + last.getDate()) / 7) * 7;
  const ts = todayISO();
  const impColors: Record<number, string> = { 5:'#B8960A', 4:'var(--red)', 3:'var(--acc)', 2:'var(--blue)', 1:'var(--tx3)' };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onNav(-1)}>‹</button>
        <span style={{ fontFamily: 'var(--fd)', fontSize: 17, fontWeight: 600, minWidth: 160 }}>{MONTH_NAMES[month]} {year}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => onNav(1)}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 1 }}>
        {DAY_NAMES.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', padding: '6px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: 'var(--bdr)' }}>
        {Array.from({ length: total }).map((_, i) => {
          const dn = i - startDay + 1;
          const isCM = dn >= 1 && dn <= last.getDate();
          const dStr = new Date(year, month, dn).toISOString().split('T')[0];
          const isT = dStr === ts;
          const dayEvents = isCM ? events.filter(ev => dStr >= ev.start_date && dStr <= ev.end_date) : [];
          return (
            <div key={i} style={{
              background: !isCM ? 'var(--bg)' : isT ? 'rgba(154,112,64,0.06)' : 'var(--surf)',
              minHeight: 90, padding: 6
            }}>
              <div style={{ fontSize: 11, color: isT ? 'var(--acc)' : 'var(--tx3)', fontWeight: isT ? 700 : 500, marginBottom: 3 }}>{isCM ? dn : ''}</div>
              {dayEvents.map(ev => (
                <div key={ev.id} onClick={() => onEventClick(ev.id)}
                  className="card-tap"
                  style={{ borderRadius: '6px', padding: '3px 7px', marginBottom: '3px',
                    background: `${impColors[ev.importance]}18`, border: '1px solid var(--bdr)', borderLeft: `3px solid ${impColors[ev.importance]}`,
                    fontSize: 10, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all var(--t) var(--ease)' }}>
                  {ev.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

const DEFAULT_EVENT_FORM = {
  name: '', event_type: 'brand_launch', start_date: '', end_date: '',
  city: '', venue: '', importance: 3, organiser: '',
  poc_name: '', poc_phone: '', poc_email: '',
  travel_required: false, travel_destination: '', travel_depart_date: '', travel_return_date: '', travel_hotel: '',
  notes: ''
};

function eventFormFromData(d: any) {
  return {
    name: d.name || '',
    event_type: d.event_type || 'brand_launch',
    start_date: d.start_date || '',
    end_date: d.end_date || '',
    city: d.city || '',
    venue: d.venue || '',
    importance: d.importance ?? 3,
    organiser: d.organiser || '',
    poc_name: d.poc_name || '',
    poc_phone: d.poc_phone || '',
    poc_email: d.poc_email || '',
    travel_required: !!d.travel_required,
    travel_destination: d.travel_destination || '',
    travel_depart_date: d.travel_depart_date || '',
    travel_return_date: d.travel_return_date || '',
    travel_hotel: d.travel_hotel || '',
    notes: d.notes || ''
  };
}

function EventForm({ eventId, onClose }: { eventId: string | null; onClose: () => void }) {
  const qc = useQueryClient();

  const [form, setForm] = useState<any>(() => {
    if (!eventId) return DEFAULT_EVENT_FORM;
    const cached = qc.getQueryData<EventWithDetails[]>(['events']);
    const found = cached?.find(e => e.id === eventId);
    return found ? eventFormFromData(found) : DEFAULT_EVENT_FORM;
  });

  const [formLoading, setFormLoading] = useState(() => {
    if (!eventId) return false;
    const cached = qc.getQueryData<EventWithDetails[]>(['events']);
    return !cached?.find(e => e.id === eventId);
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !formLoading) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/events/${eventId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then((d: any) => {
        if (cancelled) return;
        setForm(eventFormFromData(d));
        setFormLoading(false);
      })
      .catch(err => { if (!cancelled) { setLoadError(err.message || 'Failed to load'); setFormLoading(false); } });
    return () => { cancelled = true; };
  }, [eventId, formLoading]);

  async function save() {
    if (!form.name.trim() || !form.start_date) { toast.error('Name and start date are required'); return; }
    setLoading(true);

    const prev = qc.getQueryData<EventWithDetails[]>(['events']) ?? [];
    if (eventId) {
      qc.setQueryData<EventWithDetails[]>(['events'], old =>
        (old ?? []).map(e => e.id === eventId ? { ...e, ...form, end_date: form.end_date || form.start_date } : e)
      );
    } else {
      const tempId = `opt-${Date.now()}`;
      qc.setQueryData<EventWithDetails[]>(['events'], old =>
        [{ ...form, id: tempId, end_date: form.end_date || form.start_date, deliverables: [], created_at: new Date().toISOString() } as any, ...(old ?? [])]
      );
    }
    onClose();

    const url = eventId ? `/api/events/${eventId}` : '/api/events';
    const method = eventId ? 'PATCH' : 'POST';
    const body: any = { ...form, end_date: form.end_date || form.start_date };
    if (!eventId) { body.deliverables = []; body.sourcing_ids = []; }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || 'Save failed');
      qc.setQueryData(['events'], prev);
      return;
    }
    toast.success(eventId ? 'Event updated' : 'Event created');
    qc.invalidateQueries({ queryKey: ['events'] });
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{eventId ? 'Edit' : 'New'} Event</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loadError && <div style={{ background: 'rgba(184,50,50,0.08)', color: 'var(--red)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>{loadError}</div>}
          {formLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton-bar" style={{ height: 10, width: 80 }} />
                  <div className="skeleton-bar" style={{ height: 36, width: '100%' }} />
                </div>
              ))}
            </div>
          ) : (<>
          <div className="form-row"><label>Event Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-grid">
            <div className="form-row">
              <label>Type</label>
              <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {Object.entries(EVENT_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Importance (1–5)</label>
              <select value={form.importance} onChange={e => setForm({ ...form, importance: parseInt(e.target.value) })}>
                {[5,4,3,2,1].map(i => <option key={i} value={i}>{'★'.repeat(i)}{'☆'.repeat(5 - i)} {IMPORTANCE_LABELS[i]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>Start</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="form-row"><label>End</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="form-grid">
            <div className="form-row"><label>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div className="form-row"><label>Venue</label><input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
          </div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="tr" checked={form.travel_required} onChange={e => setForm({ ...form, travel_required: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor="tr" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--tx2)' }}>Requires Travel</label>
          </div>
          {form.travel_required && (
            <>
              <div className="form-grid">
                <div className="form-row"><label>Destination</label><input value={form.travel_destination} onChange={e => setForm({ ...form, travel_destination: e.target.value })} /></div>
                <div className="form-row"><label>Hotel</label><input value={form.travel_hotel} onChange={e => setForm({ ...form, travel_hotel: e.target.value })} /></div>
              </div>
              <div className="form-grid">
                <div className="form-row"><label>Depart</label><input type="date" value={form.travel_depart_date} onChange={e => setForm({ ...form, travel_depart_date: e.target.value })} /></div>
                <div className="form-row"><label>Return</label><input type="date" value={form.travel_return_date} onChange={e => setForm({ ...form, travel_return_date: e.target.value })} /></div>
              </div>
            </>
          )}
          <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 9 }}>Point of Contact</div>
            <div className="form-grid">
              <div className="form-row"><label>Name</label><input value={form.poc_name} onChange={e => setForm({ ...form, poc_name: e.target.value })} /></div>
              <div className="form-row"><label>Phone</label><input value={form.poc_phone} onChange={e => setForm({ ...form, poc_phone: e.target.value })} /></div>
            </div>
            <div className="form-row"><label>Email</label><input type="email" value={form.poc_email} onChange={e => setForm({ ...form, poc_email: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
