'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TODO_QUADRANTS, TODO_QUADRANT_LABELS, TODO_QUADRANT_SUBTITLES, TODO_QUADRANT_COLORS,
  TODO_CATEGORIES, quadrantFor, quadrantToFlags
} from '@/lib/constants';
import type { Todo, TodoQuadrant, TodoStatus, TodoUrgency, TodoImportance, TodoSourceType, ContentItemWithDeliverables, EventWithDetails, SourcingRecord } from '@/types/database';
import { formatDate, todayISO } from '@/lib/utils';
import { IconPlus, IconClose, IconSearch, IconCheck, IconImport, IconTrash } from '@/components/Icons';

const STORAGE_KEY = 'studioos.todos.v2';

let _seq = 0;
function uid() { return `todo_${Date.now()}_${++_seq}`; }

function loadTodos(): Todo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return sampleTodos();
}

function saveTodos(todos: Todo[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch {}
}

function sampleTodos(): Todo[] {
  const now = new Date().toISOString();
  const td = todayISO();
  const mk = (
    title: string, urgency: TodoUrgency, importance: TodoImportance,
    extras: Partial<Todo> = {}
  ): Todo => ({
    id: uid(), workspace_id: '', title, description: null,
    urgency, importance,
    status: 'pending', due_date: null, category: null,
    source_type: 'manual', source_id: null,
    created_by: null, created_at: now, updated_at: now,
    ...extras
  });
  return [
    mk('Review brand deck from Zara', 'high', 'high', { description: 'Confirm deliverables', due_date: td, category: 'Sourcing' }),
    mk('Film Reel for summer collection', 'low', 'high', { category: 'Content' }),
    mk('Reply to PR emails', 'high', 'low', { category: 'Outreach' }),
    mk('Organize wardrobe returns', 'low', 'low', { category: 'Sourcing' }),
  ];
}

export function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<Todo | { _new: true; quadrant?: TodoQuadrant } | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setTodos(loadTodos());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTodos(todos);
  }, [todos, hydrated]);

  const today = todayISO();

  const filtered = useMemo(() => todos.filter(t => {
    if (!showCompleted && t.status === 'completed') return false;
    if (filterCat !== 'all' && t.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [todos, showCompleted, filterCat, search]);

  const stats = useMemo(() => {
    const open = todos.filter(t => t.status === 'pending');
    const done = todos.filter(t => t.status === 'completed').length;
    const total = open.length + done;
    return {
      open: open.length,
      doNow: open.filter(t => quadrantFor(t.urgency, t.importance) === 'do').length,
      dueToday: open.filter(t => t.due_date === today).length,
      completed: done,
      pct: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [todos, today]);

  const toggle = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' as TodoStatus : 'completed' as TodoStatus, updated_at: new Date().toISOString() } : t
    ));
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const moveTo = useCallback((id: string, q: TodoQuadrant) => {
    const { urgency, importance } = quadrantToFlags(q);
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, urgency, importance, updated_at: new Date().toISOString() } : t
    ));
  }, []);

  const saveTodo = useCallback((todo: Partial<Todo> & { title: string; urgency: TodoUrgency; importance: TodoImportance }) => {
    const now = new Date().toISOString();
    setTodos(prev => {
      const existing = prev.find(t => t.id === todo.id);
      if (existing) {
        return prev.map(t => t.id === todo.id ? { ...t, ...todo, updated_at: now } : t);
      }
      return [...prev, {
        id: uid(), workspace_id: '',
        title: todo.title,
        description: todo.description ?? null,
        urgency: todo.urgency,
        importance: todo.importance,
        status: 'pending' as TodoStatus,
        due_date: todo.due_date ?? null,
        category: todo.category ?? null,
        source_type: todo.source_type ?? 'manual',
        source_id: todo.source_id ?? null,
        created_by: null, created_at: now, updated_at: now,
      }];
    });
  }, []);

  const importTodos = useCallback((items: Todo[]) => {
    const existingKeys = new Set(todos.map(t => `${t.source_type}:${t.source_id}`));
    const fresh = items.filter(t => t.source_id && !existingKeys.has(`${t.source_type}:${t.source_id}`));
    if (fresh.length === 0) return 0;
    setTodos(prev => [...prev, ...fresh]);
    return fresh.length;
  }, [todos]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Tasks</div>
          <div className="tb-sub">Eisenhower matrix · Urgency × Importance</div>
        </div>
        <div className="tb-right">
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}><IconImport size={14} /> Import</button>
          <button className="btn btn-primary" onClick={() => setEditing({ _new: true })}><IconPlus size={14} /> New Task</button>
        </div>
      </div>

      <div className="content-area" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 28px 0' }}>
        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div className="stat-card highlight"><div className="stat-value">{stats.open}</div><div className="stat-label">Open tasks</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--red)' }}>{stats.doNow}</div><div className="stat-label">Do now</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.dueToday}</div><div className="stat-label">Due today</div></div>
          <div className="stat-card"><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed</div></div>
        </div>

        <div className="todo-progress" role="group" aria-label="Task completion progress" style={{ marginBottom: 10, padding: '8px 14px' }}>
          <div className="todo-progress-text">
            <strong>{stats.completed}</strong> of <strong>{stats.completed + stats.open}</strong> done
          </div>
          <div className="todo-progress-bar" aria-hidden>
            <div className="todo-progress-fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <div className="todo-progress-pct">{stats.pct}%</div>
        </div>

        <div className="search-bar" style={{ marginBottom: 8 }}>
          <span className="search-icon"><IconSearch size={14} /></span>
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="search-clear">
              <IconClose size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`filter-tab ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>All</button>
          {TODO_CATEGORIES.map(c => (
            <button key={c} className={`filter-tab ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <button
              className={`filter-tab ${showCompleted ? 'active' : ''}`}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide' : 'Show'} completed
            </button>
          </div>
        </div>

        <Matrix
          todos={filtered}
          today={today}
          onCardClick={(t) => setEditing(t)}
          onToggle={toggle}
          onMove={moveTo}
          onAdd={(q) => setEditing({ _new: true, quadrant: q })}
          dragId={dragId}
          setDragId={setDragId}
        />
      </div>

      {editing && (
        <TodoForm
          todo={'_new' in editing ? null : editing}
          defaultQuadrant={'_new' in editing ? editing.quadrant : undefined}
          onClose={() => setEditing(null)}
          onSave={(t) => { saveTodo(t); setEditing(null); }}
          onDelete={(id) => { removeTodo(id); setEditing(null); }}
        />
      )}

      {showImport && (
        <ImportTasksDialog
          existingIds={new Set(todos.filter(t => t.source_id).map(t => `${t.source_type}:${t.source_id}`))}
          onClose={() => setShowImport(false)}
          onImport={(items) => {
            importTodos(items);
            setShowImport(false);
          }}
        />
      )}
    </>
  );
}

// ── Matrix ─────────────────────────────────────────────────
function Matrix({ todos, today, onCardClick, onToggle, onMove, onAdd, dragId, setDragId }: {
  todos: Todo[];
  today: string;
  onCardClick: (t: Todo) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, q: TodoQuadrant) => void;
  onAdd: (q: TodoQuadrant) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
}) {
  // Layout matches the Eisenhower diagram:
  //   ┌──────────────────────────┬──────────────────────────┐
  //   │  Schedule (Low U/High I) │  Do (High U/High I)      │
  //   ├──────────────────────────┼──────────────────────────┤
  //   │  Delete   (Low U/Low I)  │  Delegate (High U/Low I) │
  //   └──────────────────────────┴──────────────────────────┘
  const layout: TodoQuadrant[] = ['schedule', 'do', 'delete', 'delegate'];
  const [over, setOver] = useState<TodoQuadrant | null>(null);

  return (
    <div className="matrix-wrap">
      <div className="matrix-axis-y" aria-hidden>← Importance →</div>
      <div className="matrix-axis-x" aria-hidden>← Urgency →</div>
      <div className="matrix-grid" style={{ gridColumn: 2 }}>
        {layout.map(q => {
          const items = todos.filter(t => quadrantFor(t.urgency, t.importance) === q);
          const openCount = items.filter(t => t.status === 'pending').length;
          const color = TODO_QUADRANT_COLORS[q];
          return (
            <div
              key={q}
              className={`matrix-cell ${over === q ? 'drag-over' : ''}`}
              style={{ ['--q-color' as any]: color, ['--q-soft' as any]: `${colorToSoft(color)}` }}
              onDragOver={(e) => { e.preventDefault(); setOver(q); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId) onMove(dragId, q);
                setDragId(null);
              }}
            >
              <div className="matrix-cell-header">
                <div className="matrix-cell-titles">
                  <div className="matrix-cell-sub">{TODO_QUADRANT_SUBTITLES[q]}</div>
                  <div className="matrix-cell-title">{TODO_QUADRANT_LABELS[q]}</div>
                </div>
                <div className="matrix-cell-count">{openCount}</div>
              </div>
              <div className="matrix-cell-body">
                {items.length === 0 ? (
                  <div className="matrix-cell-empty">
                    No tasks here
                  </div>
                ) : items.map(t => (
                  <MatrixCard
                    key={t.id}
                    todo={t}
                    today={today}
                    onClick={() => onCardClick(t)}
                    onToggle={() => onToggle(t.id)}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    dragging={dragId === t.id}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => onAdd(q)}
                  style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1px dashed var(--bdr2)',
                    borderRadius: 'var(--r)', padding: '6px 10px',
                    cursor: 'pointer', color: 'var(--tx3)', fontSize: 11,
                    fontFamily: 'var(--fb)'
                  }}
                >
                  <IconPlus size={12} /> Add to {TODO_QUADRANT_LABELS[q]}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function colorToSoft(c: string): string {
  // Map common var(--xxx) to the soft variant used in CSS.
  if (c.includes('--red')) return 'var(--red-soft)';
  if (c.includes('--blue')) return 'var(--blue-soft)';
  if (c.includes('--amber')) return 'var(--amber-soft)';
  if (c.includes('--green')) return 'var(--green-soft)';
  if (c.includes('--acc')) return 'var(--aglow)';
  return 'var(--surf3)';
}

function MatrixCard({ todo, today, onClick, onToggle, onDragStart, onDragEnd, dragging }: {
  todo: Todo;
  today: string;
  onClick: () => void;
  onToggle: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const q = quadrantFor(todo.urgency, todo.importance);
  const color = TODO_QUADRANT_COLORS[q];
  const overdue = !!todo.due_date && todo.due_date < today && todo.status === 'pending';
  const isToday = todo.due_date === today && todo.status === 'pending';
  return (
    <div
      className={`matrix-card ${todo.status === 'completed' ? 'completed' : ''} ${dragging ? 'dragging' : ''}`}
      style={{ ['--q-color' as any]: color }}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.status === 'completed'}
        onChange={(e) => { e.stopPropagation(); onToggle(); }}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Toggle ${todo.title}`}
      />
      <div className="matrix-card-body">
        <div className="matrix-card-title">{todo.title}</div>
        <div className="matrix-card-meta">
          {todo.due_date && (
            <span className={`matrix-card-due ${overdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`}>
              {overdue ? '⚠ ' : ''}{isToday ? 'Today' : formatDate(todo.due_date)}
            </span>
          )}
          {todo.category && <span className="badge badge-neutral" style={{ fontSize: 8.5, padding: '1px 6px' }}>{todo.category}</span>}
          {todo.source_type !== 'manual' && (
            <span className="matrix-card-src">{todo.source_type}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Todo Form ──────────────────────────────────────────────
function TodoForm({ todo, defaultQuadrant, onClose, onSave, onDelete }: {
  todo: Todo | null;
  defaultQuadrant?: TodoQuadrant;
  onClose: () => void;
  onSave: (t: Partial<Todo> & { title: string; urgency: TodoUrgency; importance: TodoImportance }) => void;
  onDelete: (id: string) => void;
}) {
  const defaultFlags = defaultQuadrant ? quadrantToFlags(defaultQuadrant) : { urgency: 'high' as TodoUrgency, importance: 'high' as TodoImportance };
  const [form, setForm] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    urgency: todo?.urgency || defaultFlags.urgency,
    importance: todo?.importance || defaultFlags.importance,
    due_date: todo?.due_date || '',
    category: todo?.category || '',
  });

  const currentQuadrant = quadrantFor(form.urgency, form.importance);

  function handleSave() {
    if (!form.title.trim()) return;
    onSave({
      ...(todo ? { id: todo.id } : {}),
      title: form.title,
      description: form.description || null,
      urgency: form.urgency,
      importance: form.importance,
      due_date: form.due_date || null,
      category: form.category || null,
    });
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 480 }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>
            {todo ? 'Edit Task' : 'New Task'}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div className="form-row">
            <label>Task Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add details…" style={{ minHeight: 60 }} />
          </div>
          <div className="form-row">
            <label>Quadrant ({TODO_QUADRANT_LABELS[currentQuadrant]} · {TODO_QUADRANT_SUBTITLES[currentQuadrant]})</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(['schedule', 'do', 'delete', 'delegate'] as TodoQuadrant[]).map(q => {
                const flags = quadrantToFlags(q);
                const active = currentQuadrant === q;
                const color = TODO_QUADRANT_COLORS[q];
                return (
                  <button
                    key={q} type="button"
                    onClick={() => setForm({ ...form, urgency: flags.urgency, importance: flags.importance })}
                    style={{
                      padding: '10px 8px', borderRadius: 8,
                      border: `1.5px solid ${active ? color : 'var(--bdr)'}`,
                      background: active ? colorToSoft(color).replace('var(', 'var(').replace(')', ')') : 'var(--surf)',
                      color: active ? color : 'var(--tx2)',
                      fontFamily: 'var(--fb)', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 180ms ease',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--fd)', fontSize: 13, fontWeight: 700 }}>{TODO_QUADRANT_LABELS[q]}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>{TODO_QUADRANT_SUBTITLES[q]}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">None</option>
                {TODO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          {todo && <button className="btn btn-danger btn-sm" onClick={() => onDelete(todo.id)}><IconTrash size={12} /> Delete</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
            <IconCheck size={13} /> {todo ? 'Update' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Tasks From Other Features ───────────────────────
function ImportTasksDialog({ existingIds, onClose, onImport }: {
  existingIds: Set<string>;
  onClose: () => void;
  onImport: (items: Todo[]) => void;
}) {
  const { data: sourcing = [] } = useQuery<SourcingRecord[]>({
    queryKey: ['sourcing'],
    queryFn: async () => {
      const r = await fetch('/api/sourcing');
      if (!r.ok) return [];
      return r.json();
    }
  });
  const { data: content = [] } = useQuery<ContentItemWithDeliverables[]>({
    queryKey: ['content'],
    queryFn: async () => {
      const r = await fetch('/api/content');
      if (!r.ok) return [];
      return r.json();
    }
  });
  const { data: events = [] } = useQuery<EventWithDetails[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const r = await fetch('/api/events');
      if (!r.ok) return [];
      return r.json();
    }
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = useMemo(() => {
    const now = new Date().toISOString();
    const today = todayISO();
    const items: { key: string; todo: Todo; subtitle: string }[] = [];

    sourcing.forEach(s => {
      const key = `sourcing:${s.id}`;
      if (existingIds.has(key)) return;
      const due = s.return_date;
      const urgency: TodoUrgency = (due && due <= addDays(today, 3)) ? 'high' : 'low';
      const importance: TodoImportance = s.status === 'Pending' ? 'high' : 'low';
      items.push({
        key,
        subtitle: `${s.status}${due ? ' · Return ' + formatDate(due) : ''}`,
        todo: {
          id: '', workspace_id: '', title: `Sourcing: ${s.brand}${s.outfit ? ' — ' + s.outfit : ''}`,
          description: s.notes,
          urgency, importance,
          status: 'pending', due_date: due, category: 'Sourcing',
          source_type: 'sourcing', source_id: s.id,
          created_by: null, created_at: now, updated_at: now,
        }
      });
    });

    content.forEach(c => {
      if (c.stage === 'posted' || c.stage === 'archived') return;
      const key = `content:${c.id}`;
      if (existingIds.has(key)) return;
      const due = c.scheduled_date || c.planned_date;
      const urgency: TodoUrgency = (due && due <= addDays(today, 3)) ? 'high' : 'low';
      const importance: TodoImportance = (c.category === 'paid' || c.category === 'branded') ? 'high' : 'low';
      items.push({
        key,
        subtitle: `${c.stage} · ${due ? formatDate(due) : 'No date'}`,
        todo: {
          id: '', workspace_id: '', title: `Content: ${c.title}`,
          description: c.notes,
          urgency, importance,
          status: 'pending', due_date: due, category: 'Content',
          source_type: 'content', source_id: c.id,
          created_by: null, created_at: now, updated_at: now,
        }
      });
    });

    events.forEach(e => {
      if (e.end_date < today) return;
      const key = `events:${e.id}`;
      if (existingIds.has(key)) return;
      const due = e.start_date;
      const urgency: TodoUrgency = due <= addDays(today, 3) ? 'high' : 'low';
      const importance: TodoImportance = e.importance >= 4 ? 'high' : 'low';
      items.push({
        key,
        subtitle: `${formatDate(due)}${e.city ? ' · ' + e.city : ''}`,
        todo: {
          id: '', workspace_id: '', title: `Event: ${e.name}`,
          description: e.notes,
          urgency, importance,
          status: 'pending', due_date: due, category: 'Events',
          source_type: 'events', source_id: e.id,
          created_by: null, created_at: now, updated_at: now,
        }
      });
    });

    return items;
  }, [sourcing, content, events, existingIds]);

  function toggle(key: string) {
    setSelected(prev => {
      const ns = new Set(prev);
      if (ns.has(key)) ns.delete(key); else ns.add(key);
      return ns;
    });
  }

  function selectAll() {
    setSelected(new Set(candidates.map(c => c.key)));
  }

  function doImport() {
    const items = candidates.filter(c => selected.has(c.key)).map(c => ({ ...c.todo, id: uid() }));
    onImport(items);
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>Import Tasks</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '14px 20px 6px', borderBottom: '1px solid var(--bdr)', fontSize: 11.5, color: 'var(--tx3)' }}>
          Pull open work from Sourcing, Content, and Events into your task matrix.
          <button onClick={selectAll} style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--acc)', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {candidates.length === 0 ? (
            <div style={{ padding: 32, color: 'var(--tx3)', textAlign: 'center', fontSize: 12 }}>
              No new items to import.
            </div>
          ) : candidates.map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', cursor: 'pointer', borderBottom: '1px solid var(--bdr)' }}>
              <input type="checkbox" checked={selected.has(c.key)} onChange={() => toggle(c.key)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.todo.title}</div>
                <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>{c.subtitle}</div>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: 9, padding: '1px 7px' }}>{c.todo.source_type}</span>
            </label>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doImport} disabled={selected.size === 0}>
            Import {selected.size > 0 ? selected.size : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
