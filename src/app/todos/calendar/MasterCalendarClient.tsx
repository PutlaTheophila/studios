'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  MONTH_NAMES,
  DAY_NAMES,
  STAGE_LABELS,
  CATEGORY_LABELS,
  CONTENT_TYPE_BADGE,
  EVENT_TYPE_LABELS,
} from '@/lib/constants';
import type {
  ContentItemWithDeliverables,
  EventWithDetails,
  ContentCategory,
} from '@/types/database';

// Match the colour palette used by the Content Calendar page
const CATEGORY_COLORS: Record<ContentCategory, { color: string; soft: string }> = {
  personal:        { color: 'var(--blue)',   soft: 'var(--blue-soft)' },
  branded:         { color: 'var(--acc)',    soft: 'var(--aglow)' },
  paid:            { color: 'var(--amber)',  soft: 'var(--amber-soft)' },
  event_coverage:  { color: 'var(--purple)', soft: 'var(--purple-soft)' },
  travel:          { color: 'var(--teal)',   soft: 'rgba(45, 122, 122, 0.08)' },
};

// Match the importance palette used by the Events page
const IMP_COLORS: Record<number, string> = {
  5: '#B8960A',
  4: 'var(--red)',
  3: 'var(--acc)',
  2: 'var(--blue)',
  1: 'var(--tx3)',
};

type FilterMode = 'both' | 'content' | 'events';

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function dateOfContent(item: ContentItemWithDeliverables): string | null {
  return item.posted_date || item.scheduled_date || item.planned_date || null;
}

export function MasterCalendarClient() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filter, setFilter] = useState<FilterMode>('both');

  const { data: content = [] } = useQuery<ContentItemWithDeliverables[]>({
    queryKey: ['content'],
    queryFn: async () => {
      const r = await fetch('/api/content');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    },
  });

  const { data: events = [] } = useQuery<EventWithDetails[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const r = await fetch('/api/events');
      if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
      return r.json();
    },
  });

  // Grid bounds
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalCells = Math.ceil((startDay + last.getDate()) / 7) * 7;
  const todayStr = ymd(today);
  const yyyymm = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Monthly stats
  const monthContent = useMemo(
    () => content.filter(c => (dateOfContent(c) || '').startsWith(yyyymm)),
    [content, yyyymm]
  );
  const monthEvents = useMemo(
    () => events.filter(ev => ev.start_date.slice(0, 7) === yyyymm || ev.end_date.slice(0, 7) === yyyymm),
    [events, yyyymm]
  );
  const travelCount = useMemo(() => monthEvents.filter(ev => ev.travel_required).length, [monthEvents]);
  const totalDeliverables = useMemo(() => {
    const cd = monthContent.reduce((a, c) => a + (c.deliverables || []).reduce((b, d) => b + d.quantity, 0), 0);
    const ed = monthEvents.reduce((a, e) => a + (e.deliverables || []).reduce((b, d) => b + d.quantity, 0), 0);
    return cd + ed;
  }, [monthContent, monthEvents]);

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

  const showContent = filter === 'both' || filter === 'content';
  const showEvents = filter === 'both' || filter === 'events';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Master Calendar</div>
          <div className="tb-sub">{MONTH_NAMES[month]} {year} · Content + Events</div>
        </div>
      </div>

      <div className="content-area">
        <div className="stat-row">
          <div className="stat-card highlight">
            <div className="stat-value">{monthContent.length}</div>
            <div className="stat-label">Content this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--acc)' }}>{monthEvents.length}</div>
            <div className="stat-label">Events this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--teal)' }}>{travelCount}</div>
            <div className="stat-label">Travel events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{totalDeliverables}</div>
            <div className="stat-label">Deliverables</div>
          </div>
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
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 13, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('both')} className={`filter-tab ${filter === 'both' ? 'active' : ''}`}>Both</button>
          <button onClick={() => setFilter('content')} className={`filter-tab ${filter === 'content' ? 'active' : ''}`}>Content only</button>
          <button onClick={() => setFilter('events')} className={`filter-tab ${filter === 'events' ? 'active' : ''}`}>Events only</button>
        </div>

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
            const isToday = isCM && dStr === todayStr;
            const dow = i % 7;
            const isWeekend = dow === 0 || dow === 6;

            const dayContent = isCM && showContent ? content.filter(c => {
              return c.planned_date === dStr || c.scheduled_date === dStr || c.posted_date === dStr;
            }) : [];
            const dayEvents = isCM && showEvents ? events.filter(ev => dStr >= ev.start_date && dStr <= ev.end_date) : [];

            // Events first (sorted by importance desc), then content
            const sortedEvents = [...dayEvents].sort((a, b) => b.importance - a.importance);

            const MAX = 4;
            const totalChips = sortedEvents.length + dayContent.length;
            const eventSlots = Math.min(sortedEvents.length, MAX);
            const contentSlots = Math.min(dayContent.length, Math.max(0, MAX - eventSlots));
            const overflow = totalChips - (eventSlots + contentSlots);

            const classes = [
              'cal-day',
              !isCM && 'other-month',
              isWeekend && 'weekend',
              isToday && 'today',
            ].filter(Boolean).join(' ');

            return (
              <div key={i} className={classes}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="cal-day-num">{isCM ? dn : ''}</span>
                </div>

                {sortedEvents.slice(0, eventSlots).map(ev => {
                  const c = IMP_COLORS[ev.importance];
                  return (
                    <div
                      key={`e-${ev.id}`}
                      onClick={(e) => { e.stopPropagation(); router.push('/events'); }}
                      className="cal-event"
                      style={{
                        ['--ev-color' as any]: c,
                        ['--ev-soft' as any]: `${c}18`,
                        cursor: 'pointer',
                      }}
                      title={`${ev.name} · ${EVENT_TYPE_LABELS[ev.event_type]}`}
                    >
                      <span
                        className="cal-event-type"
                        style={{ background: c, color: '#fff' }}
                      >EV</span>
                      <span className="cal-event-title">{ev.name}</span>
                      {ev.travel_required && (
                        <span className="cal-event-stage" style={{ color: 'var(--teal)' }}>✈</span>
                      )}
                    </div>
                  );
                })}

                {dayContent.slice(0, contentSlots).map(it => {
                  const cat = CATEGORY_COLORS[it.category];
                  const label = (it.deliverables || []).map(d => CONTENT_TYPE_BADGE[d.content_type]).join('+') || '•';
                  return (
                    <div
                      key={`c-${it.id}`}
                      onClick={(e) => { e.stopPropagation(); router.push('/calendar'); }}
                      className={`cal-event ${it.stage === 'posted' ? 'posted' : ''}`}
                      style={{
                        ['--ev-color' as any]: cat.color,
                        ['--ev-soft' as any]: cat.soft,
                        cursor: 'pointer',
                      }}
                      title={`${it.title} · ${CATEGORY_LABELS[it.category]} · ${STAGE_LABELS[it.stage]}`}
                    >
                      <span className="cal-event-type">{label}</span>
                      <span className="cal-event-title">{it.title}</span>
                      <span className="cal-event-stage">{STAGE_LABELS[it.stage]}</span>
                    </div>
                  );
                })}

                {overflow > 0 && (
                  <div className="cal-more">+{overflow} more</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="cal-legend" aria-label="Legend">
          <span className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: 'var(--tx2)' }} />
            EV badge = Event
          </span>
          {(Object.entries(CATEGORY_LABELS) as [ContentCategory, string][]).map(([k, label]) => (
            <span key={k} className="cal-legend-item">
              <span className="cal-legend-dot" style={{ background: CATEGORY_COLORS[k].color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
