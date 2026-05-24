// GET /api/expenses/:id — fetch one expense
// PATCH /api/expenses/:id — update
// DELETE /api/expenses/:id — remove

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk } from '@/lib/api-helpers';

const ExpensePatchSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().min(1),
  category: z.enum(['travel', 'sourcing', 'production', 'equipment', 'subscription', 'other']),
  expense_date: z.string().min(1),
  vendor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  reimbursable: z.boolean().optional(),
  reimbursed: z.boolean().optional()
}).partial();

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return jsonError(error.message, 404);
  return jsonOk(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const raw = await req.json();
  const parsed = ExpensePatchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.message);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('expenses')
    .update(parsed.data)
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
    .from('expenses')
    .delete()
    .eq('id', params.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
