import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk, dateOrNull } from '@/lib/api-helpers';

const EventSchema = z.object({
  name: z.string().min(1),
  event_type: z.enum(['brand_launch', 'photoshoot', 'press_day', 'personal_appearance', 'travel', 'other']),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  city: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  importance: z.number().int().min(1).max(5),
  organiser: z.string().nullable().optional(),
  poc_contact_id: z.string().uuid().nullable().optional(),
  poc_name: z.string().nullable().optional(),
  poc_phone: z.string().nullable().optional(),
  poc_email: z.string().email().nullable().or(z.literal('')).optional(),
  travel_required: z.boolean(),
  travel_destination: z.string().nullable().optional(),
  travel_depart_date: dateOrNull.optional(),
  travel_return_date: dateOrNull.optional(),
  travel_hotel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  deliverables: z.array(z.object({
    content_type: z.enum(['reel', 'post', 'story', 'carousel', 'live']),
    quantity: z.number().int().min(1)
  })).default([]),
  sourcing_ids: z.array(z.string().uuid()).default([])
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) return jsonError(error.message, 500);

  // attach deliverables and sourcing links
  const ids = (events || []).map(e => e.id);

  const [{ data: dels }, { data: links }] = await Promise.all([
    supabase.from('deliverables').select('*').eq('parent_type', 'event').in('parent_id', ids),
    supabase.from('event_sourcing_links').select('event_id, sourcing_id, sourcing_records(*)').in('event_id', ids)
  ]);

  const result = (events || []).map(ev => ({
    ...ev,
    deliverables: (dels || []).filter(d => d.parent_id === ev.id),
    sourcing_links: (links || [])
      .filter(l => l.event_id === ev.id)
      .map(l => l.sourcing_records)
      .filter(Boolean)
  }));

  return jsonOk(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const { deliverables, sourcing_ids, ...eventData } = parsed.data;
  const supabase = createSupabaseServerClient();

  const { data: ev, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      workspace_id: auth.user.workspace_id,
      created_by: auth.user.id
    })
    .select()
    .single();

  if (error || !ev) return jsonError(error?.message || 'Failed', 500);

  if (deliverables.length > 0) {
    await supabase.from('deliverables').insert(
      deliverables.map(d => ({
        ...d,
        workspace_id: auth.user.workspace_id,
        parent_type: 'event' as const,
        parent_id: ev.id
      }))
    );
  }

  if (sourcing_ids.length > 0) {
    await supabase.from('event_sourcing_links').insert(
      sourcing_ids.map(sid => ({ event_id: ev.id, sourcing_id: sid }))
    );
  }

  return jsonOk(ev);
}
