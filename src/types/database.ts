// ════════════════════════════════════════════════════════════════
// Database type definitions
// ════════════════════════════════════════════════════════════════
// These mirror the SQL schema in supabase/migrations/.
// Keep them in sync — when you change the schema, update this file.

export type UserRole = 'creator' | 'ea' | 'manager';

export type SourcingStatus = 'Shipped' | 'Returned' | 'Shot' | 'Pending' | 'Cancelled';

export type EventType =
  | 'brand_launch'
  | 'photoshoot'
  | 'press_day'
  | 'personal_appearance'
  | 'travel'
  | 'other';

export type ContentCategory =
  | 'personal'
  | 'branded'
  | 'paid'
  | 'event_coverage'
  | 'travel';

export type ContentStage =
  | 'concept'
  | 'scripting'
  | 'shooting'
  | 'editing'
  | 'brand_approval'
  | 'approved'
  | 'scheduled'
  | 'posted'
  | 'archived';

export type ContentType = 'reel' | 'post' | 'story' | 'carousel' | 'live';

export type DeliverableParentType = 'content' | 'event' | 'sourcing';

// ──────────────────────────────────────────────────
// Entity interfaces
// ──────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  agency: string | null;
  city: string | null;
  profession: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourcingRecord {
  id: string;
  workspace_id: string;
  brand: string;
  outfit: string | null;
  agency: string | null;
  poc_contact_id: string | null;
  poc_name: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  event: string | null;
  source_date: string | null;
  return_date: string | null;
  deliverables_text: string | null;
  status: SourcingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  workspace_id: string;
  name: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  city: string | null;
  venue: string | null;
  importance: number; // 1-5
  organiser: string | null;
  poc_contact_id: string | null;
  poc_name: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  travel_required: boolean;
  travel_destination: string | null;
  travel_depart_date: string | null;
  travel_return_date: string | null;
  travel_hotel: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  workspace_id: string;
  title: string;
  category: ContentCategory;
  stage: ContentStage;
  planned_date: string | null;
  scheduled_date: string | null;
  posted_date: string | null;
  poc_contact_id: string | null;
  poc_name: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  event_id: string | null;
  sourcing_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  workspace_id: string;
  parent_type: DeliverableParentType;
  parent_id: string;
  content_type: ContentType;
  quantity: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

// Convenience type for entities with their deliverables loaded
export interface ContentItemWithDeliverables extends ContentItem {
  deliverables: Deliverable[];
}

export interface EventWithDetails extends Event {
  deliverables: Deliverable[];
  sourcing_links: SourcingRecord[];
}

export interface SourcingRecordWithDeliverables extends SourcingRecord {
  deliverables: Deliverable[];
}

// ──────────────────────────────────────────────────
// Todo — Eisenhower matrix (urgency × importance)
// ──────────────────────────────────────────────────

export type TodoUrgency = 'high' | 'low';
export type TodoImportance = 'high' | 'low';
export type TodoQuadrant = 'do' | 'schedule' | 'delegate' | 'delete';
export type TodoStatus = 'pending' | 'completed';
export type TodoSourceType = 'manual' | 'sourcing' | 'content' | 'events';

export interface Todo {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  urgency: TodoUrgency;
  importance: TodoImportance;
  status: TodoStatus;
  due_date: string | null;
  category: string | null;
  source_type: TodoSourceType;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────
// Expense
// ──────────────────────────────────────────────────

export type ExpenseCategory =
  | 'travel'
  | 'sourcing'
  | 'production'
  | 'equipment'
  | 'subscription'
  | 'other';

export interface Expense {
  id: string;
  workspace_id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expense_date: string;
  vendor: string | null;
  notes: string | null;
  reimbursable: boolean;
  reimbursed: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
