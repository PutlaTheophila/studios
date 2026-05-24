-- ════════════════════════════════════════════════════════════════
-- STUDIO OS — INITIAL SCHEMA
-- ════════════════════════════════════════════════════════════════
-- Run this first in the Supabase SQL Editor.
-- Creates all tables for the application.

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────
-- WORKSPACES — each creator has one workspace
-- ──────────────────────────────────────────────────
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────
-- USERS — extends Supabase auth.users
-- ──────────────────────────────────────────────────
create type user_role as enum ('creator', 'ea', 'manager');

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null unique,
  name text,
  role user_role not null default 'ea',
  created_at timestamptz not null default now()
);

create index idx_users_workspace on users(workspace_id);

-- ──────────────────────────────────────────────────
-- CONTACTS — people in the creator's network
-- ──────────────────────────────────────────────────
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  agency text,
  city text,
  profession text,
  phone text,
  email text,
  instagram text,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_workspace on contacts(workspace_id);
create index idx_contacts_name on contacts(workspace_id, lower(name));

-- ──────────────────────────────────────────────────
-- SOURCING RECORDS — brand collaborations and outfit loans
-- ──────────────────────────────────────────────────
create type sourcing_status as enum ('Shipped', 'Returned', 'Shot', 'Pending', 'Cancelled');

create table sourcing_records (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand text not null,
  outfit text,
  agency text,
  poc_contact_id uuid references contacts(id) on delete set null,
  poc_name text,         -- denormalised fallback if no contact yet
  poc_phone text,
  poc_email text,
  event text,            -- free text for now; could link to events table later
  source_date date,
  return_date date,
  deliverables_text text,  -- free-text description
  status sourcing_status not null default 'Pending',
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sourcing_workspace on sourcing_records(workspace_id);
create index idx_sourcing_status on sourcing_records(workspace_id, status);
create index idx_sourcing_return on sourcing_records(workspace_id, return_date) where return_date is not null;

-- ──────────────────────────────────────────────────
-- EVENTS — appearances, launches, photoshoots, travel
-- ──────────────────────────────────────────────────
create type event_type as enum (
  'brand_launch', 'photoshoot', 'press_day',
  'personal_appearance', 'travel', 'other'
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  event_type event_type not null default 'other',
  start_date date not null,
  end_date date not null,
  city text,
  venue text,
  importance smallint not null default 3 check (importance between 1 and 5),
  organiser text,
  poc_contact_id uuid references contacts(id) on delete set null,
  poc_name text,
  poc_phone text,
  poc_email text,
  travel_required boolean not null default false,
  travel_destination text,
  travel_depart_date date,
  travel_return_date date,
  travel_hotel text,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_workspace on events(workspace_id);
create index idx_events_dates on events(workspace_id, start_date);

-- Many-to-many: events ↔ sourcing records
create table event_sourcing_links (
  event_id uuid not null references events(id) on delete cascade,
  sourcing_id uuid not null references sourcing_records(id) on delete cascade,
  primary key (event_id, sourcing_id)
);

-- ──────────────────────────────────────────────────
-- CONTENT ITEMS — calendar entries
-- ──────────────────────────────────────────────────
create type content_category as enum (
  'personal', 'branded', 'paid', 'event_coverage', 'travel'
);

create type content_stage as enum (
  'concept', 'scripting', 'shooting', 'editing',
  'brand_approval', 'approved', 'scheduled', 'posted', 'archived'
);

create table content_items (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  category content_category not null default 'personal',
  stage content_stage not null default 'concept',
  planned_date date,
  scheduled_date date,
  posted_date date,
  poc_contact_id uuid references contacts(id) on delete set null,
  poc_name text,
  poc_phone text,
  poc_email text,
  event_id uuid references events(id) on delete set null,
  sourcing_id uuid references sourcing_records(id) on delete set null,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_content_workspace on content_items(workspace_id);
create index idx_content_planned on content_items(workspace_id, planned_date);
create index idx_content_posted on content_items(workspace_id, posted_date) where posted_date is not null;
create index idx_content_stage on content_items(workspace_id, stage);

-- ──────────────────────────────────────────────────
-- DELIVERABLES — content obligations attached to content items, events, or sourcing
-- ──────────────────────────────────────────────────
create type deliverable_parent_type as enum ('content', 'event', 'sourcing');
create type content_type as enum ('reel', 'post', 'story', 'carousel', 'live');

create table deliverables (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_type deliverable_parent_type not null,
  parent_id uuid not null,
  content_type content_type not null,
  quantity smallint not null default 1 check (quantity > 0),
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_deliverables_parent on deliverables(parent_type, parent_id);
create index idx_deliverables_workspace on deliverables(workspace_id);

-- ──────────────────────────────────────────────────
-- TRIGGERS — auto-update updated_at timestamps
-- ──────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

create trigger sourcing_updated_at before update on sourcing_records
  for each row execute function set_updated_at();

create trigger events_updated_at before update on events
  for each row execute function set_updated_at();

create trigger content_updated_at before update on content_items
  for each row execute function set_updated_at();
