# Roadmap

This document captures features the developer can build next, in rough priority order.

## Phase 1: Production-ready core (current scope)

- ✅ Auth, workspaces, RLS
- ✅ All CRUD APIs
- ✅ Sourcing board
- ✅ Content calendar with multi-deliverables
- ✅ Events with list + calendar views
- ✅ Contacts with import from other modules

## Phase 2: Quality of life (next 2-4 weeks)

- **Detail panel for events** — currently the click opens edit; should open read-only detail with tabs (Details, Deliverables, Sourcing, POC, Travel) like the prototype
- **Detail panel for contacts** — show linked sourcing and events
- **Stage transitions on content** — quick-tap stage progression in the detail panel
- **Toast notifications** — confirm save/delete actions
- **Loading and error states** — every page should handle network failures gracefully
- **Empty states** — better illustrations and CTAs when no data

## Phase 3: Team features

- **Invite flow** — creator generates magic links to add EA/manager to workspace
- **Role-based UI** — hide admin actions from manager role
- **Audit log** — show "edited by Priya 2 hours ago" on all entities
- **Comments / mentions** — internal notes on records visible to team

## Phase 4: Power features

- **Image uploads** — sourcing records and events can have photos via Supabase Storage
- **Email reminders** — daily digest of return-due dates, upcoming events
- **Calendar sync** — export to Google Calendar / iCal
- **Shareable summaries** — public read-only links for sharing schedules with brand partners
- **Reporting / analytics** — monthly metrics: posts shipped, brand value delivered, top brands by engagement

## Phase 5: Mobile-first PWA

- Add PWA manifest and service worker
- Optimise touch targets (already done in prototype, port to React)
- Offline-first with React Query + IndexedDB persistence
- Push notifications for return reminders
