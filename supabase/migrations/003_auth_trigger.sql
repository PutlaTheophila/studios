-- ════════════════════════════════════════════════════════════════
-- AUTH TRIGGER — auto-create workspace and user record on signup
-- ════════════════════════════════════════════════════════════════
-- When a user signs up via Supabase Auth, we automatically:
-- 1. Create a workspace for them (named after their email)
-- 2. Create a users row linking them to that workspace as 'creator'
--
-- For team invitations (EA, manager joining the creator's workspace),
-- the application code will explicitly handle that — they should NOT
-- get their own workspace.

create or replace function handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
  invite_workspace_id uuid;
  invite_role user_role;
begin
  -- Check if signup came with workspace metadata (invitation flow)
  invite_workspace_id := (new.raw_user_meta_data->>'workspace_id')::uuid;
  invite_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'creator');

  if invite_workspace_id is not null then
    -- Joining existing workspace via invite
    insert into users (id, workspace_id, email, name, role)
    values (
      new.id,
      invite_workspace_id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      invite_role
    );
  else
    -- New workspace owner
    insert into workspaces (name)
    values (coalesce(new.raw_user_meta_data->>'workspace_name', split_part(new.email, '@', 1) || ''' workspace'))
    returning id into new_workspace_id;

    insert into users (id, workspace_id, email, name, role)
    values (
      new.id,
      new_workspace_id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      'creator'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
