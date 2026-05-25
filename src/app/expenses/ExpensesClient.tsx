'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS, MONTH_NAMES
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Expense, ExpenseCategory } from '@/types/database';
import { IconPlus, IconClose, IconSearch } from '@/components/Icons';
import { toast } from '@/components/Toast';
import { confirmDialog } from '@/components/Confirm';

// ── Helpers ─────────────────────────────────────────────────

function formatMoney(amount: number, currency: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback if the currency code is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function monthKey(iso: string): string {
  // Expect "YYYY-MM-DD" — keep as YYYY-MM
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function isSameMonth(iso: string, ref: Date): boolean {
  const [y, m] = iso.split('-');
  return parseInt(y, 10) === ref.getFullYear() && parseInt(m, 10) === ref.getMonth() + 1;
}

function isSameYear(iso: string, ref: Date): boolean {
  return parseInt(iso.slice(0, 4), 10) === ref.getFullYear();
}

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Main client ─────────────────────────────────────────────

export function ExpensesClient() {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');

  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const r = await fetch('/api/expenses');
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Request failed: ${r.status}`);
      return r.json();
    },
    retry: false
  });

  const now = useMemo(() => new Date(), []);
  const thisMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const stats = useMemo(() => {
    const monthExpenses = expenses.filter(e => isSameMonth(e.expense_date, now));
    const yearExpenses = expenses.filter(e => isSameYear(e.expense_date, now));
    const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const yearTotal = yearExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const reimbursableOutstanding = expenses
      .filter(e => e.reimbursable && !e.reimbursed)
      .reduce((s, e) => s + Number(e.amount), 0);
    const reimbursedCount = expenses.filter(e => e.reimbursed).length;

    // Top category for the current month (fallback to overall if no month data)
    const catBuckets = (monthExpenses.length > 0 ? monthExpenses : expenses).reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    const topCategoryEntry = Object.entries(catBuckets).sort((a, b) => b[1] - a[1])[0];
    const topCategory: ExpenseCategory | null = topCategoryEntry ? (topCategoryEntry[0] as ExpenseCategory) : null;

    // Currency used by the most recent expense (best effort) for the header total
    const currency = monthExpenses[0]?.currency || expenses[0]?.currency || 'INR';

    return { monthTotal, yearTotal, reimbursableOutstanding, reimbursedCount, topCategory, currency };
  }, [expenses, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (q) {
        const hay = `${e.title} ${e.vendor || ''} ${e.notes || ''} ${EXPENSE_CATEGORY_LABELS[e.category]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, categoryFilter]);

  // Group by month — already sorted desc by API, but group preserving order
  const grouped = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, Expense[]> = {};
    for (const e of filtered) {
      const k = monthKey(e.expense_date);
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(e);
    }
    return order.map(k => ({
      key: k,
      label: monthLabel(k),
      items: map[k],
      total: map[k].reduce((s, e) => s + Number(e.amount), 0),
      currency: map[k][0]?.currency || 'INR'
    }));
  }, [filtered]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="tb-title">Expenses</div>
          <div className="tb-sub">
            {thisMonthLabel} · {formatMoney(stats.monthTotal, stats.currency)} spent
          </div>
        </div>
        <div className="tb-right">
          <button className="btn btn-primary" onClick={() => setEditingId('new')}>
            <IconPlus size={14} /> New Expense
          </button>
        </div>
      </div>

      <div className="content-area">
        <div className="stat-row">
          <div className="stat-card highlight">
            <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(stats.monthTotal, stats.currency)}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 22, color: stats.reimbursableOutstanding > 0 ? 'var(--amber)' : undefined }}>
              {formatMoney(stats.reimbursableOutstanding, stats.currency)}
            </div>
            <div className="stat-label">Reimbursable Outstanding</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reimbursedCount}</div>
            <div className="stat-label">Reimbursed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 18, color: stats.topCategory ? EXPENSE_CATEGORY_COLORS[stats.topCategory] : undefined }}>
              {stats.topCategory ? EXPENSE_CATEGORY_LABELS[stats.topCategory] : '—'}
            </div>
            <div className="stat-label">Top Category</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 22 }}>{formatMoney(stats.yearTotal, stats.currency)}</div>
            <div className="stat-label">Year to Date</div>
          </div>
        </div>

        <div className="search-bar">
          <span className="search-icon"><IconSearch size={14} /></span>
          <input
            placeholder="Search title, vendor, notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="search-clear">
              <IconClose size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          <CategoryTab
            label="All"
            active={categoryFilter === 'all'}
            color="var(--acc)"
            onClick={() => setCategoryFilter('all')}
          />
          {EXPENSE_CATEGORIES.map(c => (
            <CategoryTab
              key={c}
              label={EXPENSE_CATEGORY_LABELS[c]}
              active={categoryFilter === c}
              color={EXPENSE_CATEGORY_COLORS[c]}
              onClick={() => setCategoryFilter(c)}
            />
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: 40, color: 'var(--tx3)' }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: 24, background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 'var(--r)', color: 'var(--red)', fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Failed to load expenses</div>
            <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>{(error as Error).message}</div>
            <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
              If the table doesn't exist, apply <code>supabase/migrations/004_expenses.sql</code> to your database.
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No expenses yet</div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 6 }}>
              {search || categoryFilter !== 'all' ? 'Try clearing your filters.' : 'Tap “New Expense” to log your first one.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {grouped.map(group => (
              <div key={group.key}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--bdr)'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tx3)' }}>
                    {group.label}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--tx2)', fontWeight: 600 }}>
                    {formatMoney(group.total, group.currency)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(e => (
                    <ExpenseRow key={e.id} expense={e} onClick={() => setViewingId(e.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingId && (
        <ExpenseDetail
          expenseId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => { setEditingId(viewingId); setViewingId(null); }}
        />
      )}
      {editingId && (
        <ExpenseForm
          expenseId={editingId === 'new' ? null : editingId}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

// ── Category tab pill ───────────────────────────────────────

function CategoryTab({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 18, fontSize: 11, fontWeight: 600,
        border: `1px solid ${active ? color : 'var(--bdr2)'}`,
        background: active ? 'var(--aglow)' : 'transparent',
        color: active ? color : 'var(--tx3)',
        cursor: 'pointer',
        transition: 'all var(--t) var(--ease)'
      }}
    >
      {label}
    </button>
  );
}

// ── Row in list ─────────────────────────────────────────────

function ExpenseRow({ expense, onClick }: { expense: Expense; onClick: () => void }) {
  const catColor = EXPENSE_CATEGORY_COLORS[expense.category];
  return (
    <div
      onClick={onClick}
      className="card-tap"
      style={{
        background: 'var(--surf)',
        border: '1px solid var(--bdr)',
        borderRadius: 'var(--rl)',
        padding: '12px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: `3px solid ${catColor}`
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>{expense.title}</div>
          <span
            style={{
              fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 10,
              background: 'var(--surf3)', color: catColor
            }}
          >
            {EXPENSE_CATEGORY_LABELS[expense.category]}
          </span>
          {expense.reimbursable && (
            <span
              className={expense.reimbursed ? 'badge badge-green' : 'badge badge-amber'}
              style={{ fontSize: 9.5 }}
            >
              {expense.reimbursed ? 'Reimbursed' : 'Reimbursable'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {expense.vendor && <span>{expense.vendor}</span>}
          <span style={{ fontFamily: 'var(--fm)' }}>{formatDate(expense.expense_date)}</span>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--fm)', fontSize: 14, fontWeight: 600,
        color: 'var(--tx)', textAlign: 'right', whiteSpace: 'nowrap'
      }}>
        {formatMoney(Number(expense.amount), expense.currency)}
      </div>
    </div>
  );
}

// ── Detail modal (read-only) ────────────────────────────────

function ExpenseDetail({ expenseId, onClose, onEdit }: { expenseId: string; onClose: () => void; onEdit: () => void }) {
  const qc = useQueryClient();
  const [expense, setExpense] = useState<Expense | null>(() => {
    const cached = qc.getQueryData<Expense[]>(['expenses']);
    return cached?.find(e => e.id === expenseId) ?? null;
  });
  const [loading, setLoading] = useState(!expense);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (expense) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/expenses/${expenseId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then(d => { if (!cancelled) { setExpense(d); setLoading(false); } })
      .catch(err => { if (!cancelled) { setLoadError(err.message || 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [expenseId, expense]);

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
  const catColor = expense ? EXPENSE_CATEGORY_COLORS[expense.category] : 'var(--tx3)';

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-bar" style={{ height: 16, width: '55%' }} />
              <div className="skeleton-bar" style={{ height: 10, width: '35%' }} />
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>{expense!.title}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 10, background: 'var(--surf3)', color: catColor }}>
                  {EXPENSE_CATEGORY_LABELS[expense!.category]}
                </span>
                {expense!.reimbursable && (
                  <span className={expense!.reimbursed ? 'badge badge-green' : 'badge badge-amber'}>
                    {expense!.reimbursed ? 'Reimbursed' : 'Reimbursable'}
                  </span>
                )}
              </div>
            </div>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="skeleton-bar" style={{ height: 60, borderRadius: 'var(--r)' }} />
              {[1,2,3,4].map(i => <div key={i} className="skeleton-bar" style={{ height: 16 }} />)}
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Amount</div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>
                  {formatMoney(Number(expense!.amount), expense!.currency)}
                </div>
              </div>
              <DetailRow label="Date" value={formatDate(expense!.expense_date)} />
              {expense!.vendor && <DetailRow label="Vendor" value={expense!.vendor} />}
              <DetailRow label="Currency" value={expense!.currency} />
              <DetailRow label="Reimbursable" value={expense!.reimbursable ? 'Yes' : 'No'} />
              <DetailRow label="Reimbursed" value={expense!.reimbursed ? 'Yes' : 'No'} />
              {expense!.notes && (
                <>
                  <hr style={{ border: 0, borderTop: '1px solid var(--bdr)', margin: '12px 0' }} />
                  <DetailRow label="Notes" value={expense!.notes} />
                </>
              )}
            </>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7 }}>
          <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 100, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ── Edit / Create form modal ────────────────────────────────

interface FormProps { expenseId: string | null; onClose: () => void; }

function ExpenseForm({ expenseId, onClose }: FormProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState(() => {
    const defaultForm = {
      title: '', amount: '', currency: 'INR', category: 'other' as ExpenseCategory,
      expense_date: todayISODate(), vendor: '', notes: '', reimbursable: false, reimbursed: false
    };
    if (!expenseId) return defaultForm;
    const cached = qc.getQueryData<Expense[]>(['expenses']);
    const found = cached?.find(e => e.id === expenseId);
    if (!found) return defaultForm;
    return {
      title: found.title || '',
      amount: found.amount != null ? String(found.amount) : '',
      currency: found.currency || 'INR',
      category: found.category,
      expense_date: found.expense_date || '',
      vendor: found.vendor || '',
      notes: found.notes || '',
      reimbursable: !!found.reimbursable,
      reimbursed: !!found.reimbursed
    };
  });

  const [formLoading, setFormLoading] = useState(() => {
    if (!expenseId) return false;
    const cached = qc.getQueryData<Expense[]>(['expenses']);
    return !cached?.find(e => e.id === expenseId);
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId || !formLoading) return;
    let cancelled = false;
    setLoadError(null);
    fetch(`/api/expenses/${expenseId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || `Request failed: ${r.status}`);
        return r.json();
      })
      .then((d: Expense) => {
        if (cancelled) return;
        setForm({
          title: d.title || '',
          amount: d.amount != null ? String(d.amount) : '',
          currency: d.currency || 'INR',
          category: d.category,
          expense_date: d.expense_date || '',
          vendor: d.vendor || '',
          notes: d.notes || '',
          reimbursable: !!d.reimbursable,
          reimbursed: !!d.reimbursed
        });
        setFormLoading(false);
      })
      .catch(err => { if (!cancelled) { setLoadError(err.message || 'Failed to load'); setFormLoading(false); } });
    return () => { cancelled = true; };
  }, [expenseId, formLoading]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const amt = parseFloat(form.amount);
    if (!Number.isFinite(amt) || amt < 0) { toast.error('Amount must be a non-negative number'); return; }
    if (!form.expense_date) { toast.error('Expense date is required'); return; }
    if (!form.currency.trim()) { toast.error('Currency is required'); return; }

    setLoading(true);
    const payload = {
      title: form.title.trim(),
      amount: amt,
      currency: form.currency.trim().toUpperCase(),
      category: form.category,
      expense_date: form.expense_date,
      vendor: form.vendor.trim() || null,
      notes: form.notes.trim() || null,
      reimbursable: form.reimbursable,
      reimbursed: form.reimbursed
    };

    const prev = qc.getQueryData<Expense[]>(['expenses']) ?? [];
    if (expenseId) {
      qc.setQueryData<Expense[]>(['expenses'], old =>
        (old ?? []).map(e => e.id === expenseId ? { ...e, ...payload } : e)
      );
    } else {
      const tempId = `opt-${Date.now()}`;
      qc.setQueryData<Expense[]>(['expenses'], old =>
        [{ ...payload, id: tempId, created_at: new Date().toISOString() } as Expense, ...(old ?? [])]
      );
    }
    onClose();

    const url = expenseId ? `/api/expenses/${expenseId}` : '/api/expenses';
    const method = expenseId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Save failed');
      qc.setQueryData(['expenses'], prev);
      return;
    }
    toast.success(expenseId ? 'Expense updated' : 'Expense created');
    qc.invalidateQueries({ queryKey: ['expenses'] });
  }

  async function remove() {
    if (!expenseId) return;
    const ok = await confirmDialog({
      title: 'Delete expense',
      message: 'This will permanently remove this expense. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;

    const prev = qc.getQueryData<Expense[]>(['expenses']) ?? [];
    qc.setQueryData<Expense[]>(['expenses'], old => (old ?? []).filter(e => e.id !== expenseId));
    onClose();

    const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    } else {
      toast.error('Delete failed');
      qc.setQueryData(['expenses'], prev);
    }
  }

  return (
    <div className="overlay center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ padding: '17px 20px 13px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 600 }}>
            {expenseId ? 'Edit Expense' : 'New Expense'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'inline-flex' }}><IconClose size={18} /></button>
        </div>
        <div style={{ padding: '17px 20px' }}>
          {loadError && (
            <div style={{ background: 'rgba(184,50,50,0.08)', color: 'var(--red)', padding: '8px 12px', borderRadius: 7, fontSize: 12, marginBottom: 12 }}>
              {loadError}
            </div>
          )}
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

          <div className="form-row">
            <label>Title *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Mumbai flight" />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="form-row">
              <label>Currency</label>
              <input
                value={form.currency}
                onChange={e => update('currency', e.target.value)}
                placeholder="INR"
                maxLength={6}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value as ExpenseCategory)}>
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Date *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={e => update('expense_date', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <label>Vendor</label>
            <input value={form.vendor} onChange={e => update('vendor', e.target.value)} placeholder="Who did you pay?" />
          </div>

          <div className="form-row">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tx2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.reimbursable}
                onChange={e => update('reimbursable', e.target.checked)}
              />
              Reimbursable
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--tx2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.reimbursed}
                onChange={e => update('reimbursed', e.target.checked)}
              />
              Reimbursed
            </label>
          </div>
          </>)}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
          {expenseId && <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading || formLoading}>{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
