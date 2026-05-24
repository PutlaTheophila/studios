// GET /api/content — list content items with deliverables
// POST /api/content — create a new content item with deliverables

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk, dateOrNull } from '@/lib/api-helpers';

const DeliverableInput = z.object({
  content_type: z.enum(['reel', 'post', 'story', 'carousel', 'live']),
  quantity: z.number().int().min(1).max(100)
});

const ContentSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['personal', 'branded', 'paid', 'event_coverage', 'travel']),
  stage: z.enum(['concept', 'scripting', 'shooting', 'editing', 'brand_approval', 'approved', 'scheduled', 'posted', 'archived']),
  planned_date: dateOrNull.optional(),
  scheduled_date: dateOrNull.optional(),
  posted_date: dateOrNull.optional(),
  poc_contact_id: z.string().uuid().nullable().optional(),
  poc_name: z.string().nullable().optional(),
  poc_phone: z.string().nullable().optional(),
  poc_email: z.string().email().nullable().or(z.literal('')).optional(),
  event_id: z.string().uuid().nullable().optional(),
  sourcing_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  deliverables: z.array(DeliverableInput).min(1)
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data: items, error } = await supabase
    .from('content_items')
    .select('*')
    .order('planned_date', { ascending: false, nullsFirst: false });

  if (error) return jsonError(error.message, 500);

  // attach deliverables
  const ids = (items || []).map(i => i.id);
  const { data: dels } = await supabase
    .from('deliverables')
    .select('*')
    .eq('parent_type', 'content')
    .in('parent_id', ids);

  const result = (items || []).map(item => ({
    ...item,
    deliverables: (dels || []).filter(d => d.parent_id === item.id)
  }));

  return jsonOk(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = ContentSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const { deliverables, ...contentData } = parsed.data;
  const supabase = createSupabaseServerClient();

  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      ...contentData,
      workspace_id: auth.user.workspace_id,
      created_by: auth.user.id
    })
    .select()
    .single();

  if (error || !item) return jsonError(error?.message || 'Failed to create', 500);

  // insert deliverables
  if (deliverables.length > 0) {
    const delRows = deliverables.map(d => ({
      ...d,
      workspace_id: auth.user.workspace_id,
      parent_type: 'content' as const,
      parent_id: item.id
    }));
    const { error: delError } = await supabase.from('deliverables').insert(delRows);
    if (delError) return jsonError(delError.message, 500);
  }

  return jsonOk({ ...item, deliverables });
}
