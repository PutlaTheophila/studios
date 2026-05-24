# Database Schema

All tables live in PostgreSQL on Supabase. Schema is defined in `supabase/migrations/`.

## Tables overview

| Table | Purpose |
|-------|---------|
| `workspaces` | One per creator account |
| `users` | Members of a workspace (creator, EA, manager) |
| `contacts` | Brand POCs, agencies, event producers — first-class entities |
| `sourcing_records` | Outfit loans / brand collaborations |
| `events` | Appearances, launches, photoshoots, travel |
| `event_sourcing_links` | M2M between events and sourcing |
| `content_items` | Calendar entries |
| `deliverables` | Polymorphic — attached to content/events/sourcing |

## Relationships

```
workspaces (1) ──── (M) users
              └──── (M) contacts
              └──── (M) sourcing_records ── poc_contact_id ──> contacts
              └──── (M) events ── poc_contact_id ──> contacts
              └──── (M) content_items ── poc_contact_id ──> contacts
                                       ── event_id      ──> events
                                       ── sourcing_id   ──> sourcing_records

events (1) ──── (M) event_sourcing_links ──── (M) sourcing_records

deliverables: parent_type + parent_id polymorphic FK to content_items, events, or sourcing_records
```

## Row-Level Security

Every table has RLS enabled. Policies use two helper functions:

- `current_workspace_id()` — returns the workspace_id of the authenticated user
- `current_user_role()` — returns the role of the authenticated user

A user can only:
- SELECT rows where `workspace_id = current_workspace_id()`
- INSERT rows with `workspace_id = current_workspace_id()`
- UPDATE rows in their own workspace
- DELETE rows based on role (creator/EA always; manager only on sourcing)

## Migrations

Run in order:
1. `001_initial_schema.sql` — tables, types, indexes, triggers
2. `002_rls_policies.sql` — RLS policies on every table
3. `003_auth_trigger.sql` — auto-creates workspace + user record when someone signs up
