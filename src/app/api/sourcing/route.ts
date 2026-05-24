// GET /api/sourcing — list all sourcing records for the workspace
// POST /api/sourcing — create a new record

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk, dateOrNull } from '@/lib/api-helpers';

const DeliverableInput = z.object({
  content_type: z.enum(['reel', 'post', 'story', 'carousel', 'live']),
  quantity: z.number().int().min(1).max(100)
});

const SourcingSchema = z.object({
  brand: z.string().min(1),
  outfit: z.string().nullable().optional(),
  agency: z.string().nullable().optional(),
  poc_contact_id: z.string().uuid().nullable().optional(),
  poc_name: z.string().nullable().optional(),
  poc_phone: z.string().nullable().optional(),
  poc_email: z.string().email().nullable().or(z.literal('')).optional(),
  event: z.string().nullable().optional(),
  source_date: dateOrNull.optional(),
  return_date: dateOrNull.optional(),
  deliverables_text: z.string().nullable().optional(),
  deliverables: z.array(DeliverableInput).optional(),
  status: z.enum(['Shipped', 'Returned', 'Shot', 'Pending', 'Cancelled']),
  notes: z.string().nullable().optional()
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data: items, error } = await supabase
    .from('sourcing_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return jsonError(error.message, 500);

  const ids = (items || []).map(i => i.id);
  const { data: dels } = await supabase
    .from('deliverables')
    .select('*')
    .eq('parent_type', 'sourcing')
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
  const parsed = SourcingSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const { deliverables, ...sourcingData } = parsed.data;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('sourcing_records')
    .insert({
      ...sourcingData,
      workspace_id: auth.user.workspace_id,
      created_by: auth.user.id
    })
    .select()
    .single();

  if (error || !data) return jsonError(error?.message || 'Failed to create', 500);

  if (deliverables && deliverables.length > 0) {
    const rows = deliverables.map(d => ({
      ...d,
      workspace_id: auth.user.workspace_id,
      parent_type: 'sourcing' as const,
      parent_id: data.id
    }));
    const { error: delErr } = await supabase.from('deliverables').insert(rows);
    if (delErr) return jsonError(delErr.message, 500);
  }

  return jsonOk({ ...data, deliverables: deliverables || [] });
}
