import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk, blankDatesToNull } from '@/lib/api-helpers';

const EVENT_DATE_FIELDS = ['start_date', 'end_date', 'travel_depart_date', 'travel_return_date'] as const;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data: ev, error } = await supabase
    .from('events').select('*').eq('id', params.id).single();
  if (error) return jsonError(error.message, 404);

  const [{ data: dels }, { data: links }] = await Promise.all([
    supabase.from('deliverables').select('*').eq('parent_type', 'event').eq('parent_id', params.id),
    supabase.from('event_sourcing_links')
      .select('sourcing_records(*)')
      .eq('event_id', params.id)
  ]);

  return jsonOk({
    ...ev,
    deliverables: dels || [],
    sourcing_links: (links || []).map((l: any) => l.sourcing_records).filter(Boolean)
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const { deliverables, sourcing_ids, ...rest } = body;
  blankDatesToNull(rest, EVENT_DATE_FIELDS);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('events').update(rest).eq('id', params.id).select().single();
  if (error) return jsonError(error.message, 500);

  if (Array.isArray(deliverables)) {
    await supabase.from('deliverables')
      .delete().eq('parent_type', 'event').eq('parent_id', params.id);
    if (deliverables.length > 0) {
      await supabase.from('deliverables').insert(
        deliverables.map((d: any) => ({
          workspace_id: auth.user.workspace_id,
          parent_type: 'event',
          parent_id: params.id,
          content_type: d.content_type,
          quantity: d.quantity
        }))
      );
    }
  }

  if (Array.isArray(sourcing_ids)) {
    await supabase.from('event_sourcing_links').delete().eq('event_id', params.id);
    if (sourcing_ids.length > 0) {
      await supabase.from('event_sourcing_links').insert(
        sourcing_ids.map((sid: string) => ({ event_id: params.id, sourcing_id: sid }))
      );
    }
  }

  return jsonOk(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  await supabase.from('deliverables')
    .delete().eq('parent_type', 'event').eq('parent_id', params.id);
  await supabase.from('event_sourcing_links').delete().eq('event_id', params.id);
  const { error } = await supabase.from('events').delete().eq('id', params.id);
  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
