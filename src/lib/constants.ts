// Display labels and option lists used by the UI.
// Keeping them centralized so translations and label tweaks happen in one place.

import type { ContentStage, ContentType, EventType, SourcingStatus, ContentCategory, TodoQuadrant, ExpenseCategory } from '@/types/database';

export const STAGE_LABELS: Record<ContentStage, string> = {
  concept: 'Concept',
  scripting: 'Script',
  shooting: 'Shoot',
  editing: 'Edit',
  brand_approval: 'Approval',
  approved: 'Approved',
  scheduled: 'Sched',
  posted: 'Posted',
  archived: 'Archived'
};

export const STAGE_ORDER: ContentStage[] = [
  'concept', 'scripting', 'shooting', 'editing',
  'brand_approval', 'approved', 'scheduled', 'posted', 'archived'
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  reel: 'Reel', post: 'Post', story: 'Story',
  carousel: 'Carousel', live: 'Live'
};

export const CONTENT_TYPE_BADGE: Record<ContentType, string> = {
  reel: 'R', post: 'P', story: 'S', carousel: 'C', live: 'L'
};

export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  personal: 'Personal',
  branded: 'Branded',
  paid: 'Paid Partnership',
  event_coverage: 'Event Coverage',
  travel: 'Travel'
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  brand_launch: 'Brand Launch',
  photoshoot: 'Photoshoot',
  press_day: 'Press Day',
  personal_appearance: 'Personal Appearance',
  travel: 'Travel',
  other: 'Other'
};

export const SOURCING_STATUSES: SourcingStatus[] = [
  'Shipped', 'Returned', 'Shot', 'Pending', 'Cancelled'
];

export const STATUS_COLORS: Record<SourcingStatus, string> = {
  Shipped: 'var(--blue)',
  Returned: 'var(--green)',
  Shot: 'var(--acc)',
  Pending: 'var(--amber)',
  Cancelled: 'var(--red)'
};

export const IMPORTANCE_LABELS: Record<number, string> = {
  5: 'Essential',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Optional'
};

export const PROFESSIONS = [
  'Brand Manager', 'PR Manager', 'Stylist', 'Photographer',
  'Talent Agent', 'Event Producer', 'Agency Head',
  'Creative Director', 'Marketing Manager', 'Other'
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Todo (Eisenhower matrix) ────────────────────────────────

export const TODO_QUADRANTS: TodoQuadrant[] = ['do', 'schedule', 'delegate', 'delete'];

export const TODO_QUADRANT_LABELS: Record<TodoQuadrant, string> = {
  do: 'Do',
  schedule: 'Schedule',
  delegate: 'Delegate',
  delete: 'Delete'
};

export const TODO_QUADRANT_SUBTITLES: Record<TodoQuadrant, string> = {
  do: 'High Urgency / High Importance',
  schedule: 'Low Urgency / High Importance',
  delegate: 'High Urgency / Low Importance',
  delete: 'Low Urgency / Low Importance'
};

export const TODO_QUADRANT_COLORS: Record<TodoQuadrant, string> = {
  do: 'var(--red)',
  schedule: 'var(--blue)',
  delegate: 'var(--amber)',
  delete: 'var(--tx3)'
};

export function quadrantFor(urgency: 'high' | 'low', importance: 'high' | 'low'): TodoQuadrant {
  if (importance === 'high' && urgency === 'high') return 'do';
  if (importance === 'high' && urgency === 'low') return 'schedule';
  if (importance === 'low'  && urgency === 'high') return 'delegate';
  return 'delete';
}

export function quadrantToFlags(q: TodoQuadrant): { urgency: 'high' | 'low'; importance: 'high' | 'low' } {
  switch (q) {
    case 'do':       return { urgency: 'high', importance: 'high' };
    case 'schedule': return { urgency: 'low',  importance: 'high' };
    case 'delegate': return { urgency: 'high', importance: 'low' };
    case 'delete':   return { urgency: 'low',  importance: 'low' };
  }
}

export const TODO_CATEGORIES = [
  'Content', 'Sourcing', 'Events', 'Outreach', 'Admin', 'Personal', 'Other'
];

// ── Expense ─────────────────────────────────────────────────

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'travel', 'sourcing', 'production', 'equipment', 'subscription', 'other'
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  travel: 'Travel',
  sourcing: 'Sourcing',
  production: 'Production',
  equipment: 'Equipment',
  subscription: 'Subscription',
  other: 'Other'
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  travel: 'var(--teal)',
  sourcing: 'var(--acc)',
  production: 'var(--purple)',
  equipment: 'var(--blue)',
  subscription: 'var(--amber)',
  other: 'var(--tx3)'
};
