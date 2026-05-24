-- ════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════════
-- This is critical: without RLS, any authenticated user could read
-- any workspace's data. These policies enforce that users can only
-- see records belonging to their own workspace.

-- Enable RLS on every table
alter table workspaces        enable row level security;
alter table users             enable row level security;
alter table contacts          enable row level security;
alter table sourcing_records  enable row level security;
alter table events            enable row level security;
alter table event_sourcing_links enable row level security;
alter table content_items     enable row level security;
alter table deliverables      enable row level security;

-- ──────────────────────────────────────────────────
-- Helper function: get current user's workspace_id
-- ──────────────────────────────────────────────────
create or replace function current_workspace_id()
returns uuid as $$
  select workspace_id from users where id = auth.uid()
$$ language sql security definer stable;

create or replace function current_user_role()
returns user_role as $$
  select role from users where id = auth.uid()
$$ language sql security definer stable;

-- ──────────────────────────────────────────────────
-- WORKSPACES — users can only see their own
-- ──────────────────────────────────────────────────
create policy workspaces_select on workspaces
  for select using (id = current_workspace_id());

-- ──────────────────────────────────────────────────
-- USERS — see all members of your workspace
-- ──────────────────────────────────────────────────
create policy users_select on users
  for select using (workspace_id = current_workspace_id());

create policy users_self_update on users
  for update using (id = auth.uid());

-- ──────────────────────────────────────────────────
-- CONTACTS — workspace-scoped
-- ──────────────────────────────────────────────────
create policy contacts_select on contacts
  for select using (workspace_id = current_workspace_id());

create policy contacts_insert on contacts
  for insert with check (workspace_id = current_workspace_id());

create policy contacts_update on contacts
  for update using (workspace_id = current_workspace_id());

create policy contacts_delete on contacts
  for delete using (
    workspace_id = current_workspace_id()
    and current_user_role() in ('ea', 'creator')
  );

-- ──────────────────────────────────────────────────
-- SOURCING RECORDS — workspace-scoped
-- ──────────────────────────────────────────────────
create policy sourcing_select on sourcing_records
  for select using (workspace_id = current_workspace_id());

create policy sourcing_insert on sourcing_records
  for insert with check (workspace_id = current_workspace_id());

create policy sourcing_update on sourcing_records
  for update using (workspace_id = current_workspace_id());

create policy sourcing_delete on sourcing_records
  for delete using (
    workspace_id = current_workspace_id()
    and current_user_role() in ('ea', 'manager', 'creator')
  );

-- ──────────────────────────────────────────────────
-- EVENTS — workspace-scoped
-- ──────────────────────────────────────────────────
create policy events_select on events
  for select using (workspace_id = current_workspace_id());

create policy events_insert on events
  for insert with check (workspace_id = current_workspace_id());

create policy events_update on events
  for update using (workspace_id = current_workspace_id());

create policy events_delete on events
  for delete using (
    workspace_id = current_workspace_id()
    and current_user_role() in ('ea', 'creator')
  );

-- Event-sourcing link table
create policy event_sourcing_links_all on event_sourcing_links
  for all using (
    event_id in (select id from events where workspace_id = current_workspace_id())
  );

-- ──────────────────────────────────────────────────
-- CONTENT ITEMS — workspace-scoped
-- ──────────────────────────────────────────────────
create policy content_select on content_items
  for select using (workspace_id = current_workspace_id());

create policy content_insert on content_items
  for insert with check (workspace_id = current_workspace_id());

create policy content_update on content_items
  for update using (workspace_id = current_workspace_id());

create policy content_delete on content_items
  for delete using (
    workspace_id = current_workspace_id()
    and current_user_role() in ('ea', 'creator')
  );

-- ──────────────────────────────────────────────────
-- DELIVERABLES — workspace-scoped
-- ──────────────────────────────────────────────────
create policy deliverables_all on deliverables
  for all using (workspace_id = current_workspace_id())
  with check (workspace_id = current_workspace_id());
