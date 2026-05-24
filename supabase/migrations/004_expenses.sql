-- ════════════════════════════════════════════════════════════════
-- EXPENSES — operational spend tracking
-- ════════════════════════════════════════════════════════════════
-- Workspace-scoped expenses with category, vendor, and reimbursement
-- tracking. Uses a text column + check constraint for category to
-- keep things simple (no new enum type required).

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  category text not null check (category in (
    'travel', 'sourcing', 'production', 'equipment', 'subscription', 'other'
  )),
  expense_date date not null,
  vendor text,
  notes text,
  reimbursable boolean not null default false,
  reimbursed boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expenses_workspace on expenses(workspace_id);
create index idx_expenses_date on expenses(workspace_id, expense_date desc);
create index idx_expenses_category on expenses(workspace_id, category);

-- ──────────────────────────────────────────────────
-- Trigger: bump updated_at on every update
-- ──────────────────────────────────────────────────
create trigger expenses_updated_at before update on expenses
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────
-- RLS — workspace-scoped (mirrors contacts pattern)
-- ──────────────────────────────────────────────────
alter table expenses enable row level security;

create policy expenses_select on expenses
  for select using (workspace_id = current_workspace_id());

create policy expenses_insert on expenses
  for insert with check (workspace_id = current_workspace_id());

create policy expenses_update on expenses
  for update using (workspace_id = current_workspace_id());

create policy expenses_delete on expenses
  for delete using (
    workspace_id = current_workspace_id()
    and current_user_role() in ('ea', 'creator')
  );
