# API Reference

All endpoints under `/api/*` require an authenticated session. Auth is checked via Supabase cookies in `middleware.ts` and `requireUser()` in route handlers.

## Sourcing

```
GET    /api/sourcing            List all records for workspace
POST   /api/sourcing            Create a new record
GET    /api/sourcing/:id        Get one record
PATCH  /api/sourcing/:id        Update fields
DELETE /api/sourcing/:id        Remove
```

Request schema (POST/PATCH):
```typescript
{
  brand: string;            // required
  outfit?: string;
  agency?: string;
  poc_contact_id?: string;  // UUID, links to contacts
  poc_name?: string;        // fallback if no contact yet
  poc_phone?: string;
  poc_email?: string;
  event?: string;
  source_date?: string;     // YYYY-MM-DD
  return_date?: string;
  deliverables_text?: string;
  status: 'Shipped' | 'Returned' | 'Shot' | 'Pending' | 'Cancelled';
  notes?: string;
}
```

## Content

```
GET    /api/content       List with deliverables attached
POST   /api/content       Create with deliverables array
GET    /api/content/:id   Get one with deliverables
PATCH  /api/content/:id   Update (replaces deliverables array if provided)
DELETE /api/content/:id   Cascade-deletes deliverables
```

POST/PATCH body must include `deliverables: [{ content_type, quantity }, ...]`.

## Events

```
GET    /api/events        List with deliverables and linked sourcing
POST   /api/events        Create
GET    /api/events/:id    Get with full details
PATCH  /api/events/:id    Update
DELETE /api/events/:id    Cascade-deletes deliverables and sourcing links
```

POST/PATCH body supports `deliverables` and `sourcing_ids` arrays.

## Contacts

```
GET    /api/contacts        List
POST   /api/contacts        Create (returns 409 if duplicate name unless x-allow-duplicate header sent)
GET    /api/contacts/:id    Get with linked_sourcing and linked_events arrays
PATCH  /api/contacts/:id    Update
DELETE /api/contacts/:id    Remove (foreign keys set to NULL on referencing records)
```

## Import

```
GET    /api/import        Returns POCs from sourcing/events/content not yet in contacts
POST   /api/import        Bulk-create contacts from selected POCs
```

POST body: `{ sourcing_ids: string[]; event_ids: string[]; content_ids: string[] }`

## Error responses

All errors: `{ error: string }` with 4xx/5xx status. 401 if not authenticated.
