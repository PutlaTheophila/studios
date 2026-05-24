import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk } from '@/lib/api-helpers';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return jsonError(error.message, 404);

  // also fetch linked sourcing and events
  const [{ data: sourcing }, { data: events }] = await Promise.all([
    supabase.from('sourcing_records').select('*').eq('poc_contact_id', params.id),
    supabase.from('events').select('*').eq('poc_contact_id', params.id)
  ]);

  return jsonOk({
    ...data,
    linked_sourcing: sourcing || [],
    linked_events: events || []
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contacts')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', params.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
