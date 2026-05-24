// POST /api/import - bulk-create contacts from POC fields in sourcing/events/content

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk } from '@/lib/api-helpers';

interface ImportRequest {
  sourcing_ids?: string[];
  event_ids?: string[];
  content_ids?: string[];
}

export async function GET() {
  // Returns the list of POCs available to import (not yet in contacts)
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();

  const [{ data: contacts }, { data: sourcing }, { data: events }, { data: content }] = await Promise.all([
    supabase.from('contacts').select('name'),
    supabase.from('sourcing_records').select('id, poc_name, poc_phone, poc_email, agency, brand').not('poc_name', 'is', null),
    supabase.from('events').select('id, poc_name, poc_phone, poc_email, organiser, name, city').not('poc_name', 'is', null),
    supabase.from('content_items').select('id, poc_name, poc_phone, poc_email, title').not('poc_name', 'is', null)
  ]);

  const existingNames = new Set((contacts || []).map(c => c.name.toLowerCase()));
  const seen = new Set<string>();

  const filterUnique = <T extends { poc_name: string | null }>(items: T[]) =>
    (items || []).filter(item => {
      const k = (item.poc_name || '').toLowerCase();
      if (!k || existingNames.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  return jsonOk({
    sourcing: filterUnique(sourcing || []),
    events: filterUnique(events || []),
    content: filterUnique(content || [])
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const { sourcing_ids = [], event_ids = [], content_ids = [] }: ImportRequest = await req.json();
  const supabase = createSupabaseServerClient();
  const newContacts: any[] = [];

  const { data: existingContacts } = await supabase.from('contacts').select('name');
  const taken = new Set((existingContacts || []).map(c => (c.name || '').toLowerCase()));

  const tryAdd = (name: string | null | undefined, payload: any) => {
    const k = (name || '').trim().toLowerCase();
    if (!k || taken.has(k)) return;
    taken.add(k);
    newContacts.push(payload);
  };

  if (sourcing_ids.length > 0) {
    const { data } = await supabase.from('sourcing_records').select('*').in('id', sourcing_ids);
    (data || []).forEach(s => {
      tryAdd(s.poc_name, {
        workspace_id: auth.user.workspace_id,
        name: s.poc_name,
        agency: s.agency,
        phone: s.poc_phone,
        email: s.poc_email,
        profession: 'Brand Manager',
        notes: `Imported from sourcing: ${s.brand}`,
        created_by: auth.user.id
      });
    });
  }

  if (event_ids.length > 0) {
    const { data } = await supabase.from('events').select('*').in('id', event_ids);
    (data || []).forEach(e => {
      tryAdd(e.poc_name, {
        workspace_id: auth.user.workspace_id,
        name: e.poc_name,
        agency: e.organiser,
        city: e.city,
        phone: e.poc_phone,
        email: e.poc_email,
        profession: 'Event Producer',
        notes: `Imported from event: ${e.name}`,
        created_by: auth.user.id
      });
    });
  }

  if (content_ids.length > 0) {
    const { data } = await supabase.from('content_items').select('*').in('id', content_ids);
    (data || []).forEach(c => {
      tryAdd(c.poc_name, {
        workspace_id: auth.user.workspace_id,
        name: c.poc_name,
        phone: c.poc_phone,
        email: c.poc_email,
        profession: 'Brand Manager',
        notes: `Imported from content: ${c.title}`,
        created_by: auth.user.id
      });
    });
  }

  if (newContacts.length === 0) return jsonOk({ imported: 0 });

  const { data, error } = await supabase
    .from('contacts')
    .insert(newContacts)
    .select();

  if (error) return jsonError(error.message, 500);

  // backfill foreign keys
  for (const contact of data || []) {
    await Promise.all([
      supabase.from('sourcing_records').update({ poc_contact_id: contact.id })
        .ilike('poc_name', contact.name).is('poc_contact_id', null),
      supabase.from('events').update({ poc_contact_id: contact.id })
        .ilike('poc_name', contact.name).is('poc_contact_id', null),
      supabase.from('content_items').update({ poc_contact_id: contact.id })
        .ilike('poc_name', contact.name).is('poc_contact_id', null)
    ]);
  }

  return jsonOk({ imported: data?.length || 0, contacts: data });
}
