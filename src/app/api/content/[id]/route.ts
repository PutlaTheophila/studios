import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk, blankDatesToNull } from '@/lib/api-helpers';

const CONTENT_DATE_FIELDS = ['planned_date', 'scheduled_date', 'posted_date'] as const;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data: item, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !item) return jsonError(error?.message || 'Not found', 404);

  const { data: dels } = await supabase
    .from('deliverables')
    .select('*')
    .eq('parent_type', 'content')
    .eq('parent_id', params.id);

  return jsonOk({ ...item, deliverables: dels || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const { deliverables, ...rest } = body;
  blankDatesToNull(rest, CONTENT_DATE_FIELDS);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('content_items')
    .update(rest)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  // replace deliverables if provided
  if (Array.isArray(deliverables)) {
    await supabase.from('deliverables')
      .delete()
      .eq('parent_type', 'content')
      .eq('parent_id', params.id);

    if (deliverables.length > 0) {
      await supabase.from('deliverables').insert(
        deliverables.map((d: any) => ({
          workspace_id: auth.user.workspace_id,
          parent_type: 'content',
          parent_id: params.id,
          content_type: d.content_type,
          quantity: d.quantity
        }))
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
    .delete()
    .eq('parent_type', 'content')
    .eq('parent_id', params.id);

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', params.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
