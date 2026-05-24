// GET /api/expenses — list all expenses for the workspace
// POST /api/expenses — create a new expense

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk } from '@/lib/api-helpers';

const ExpenseSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().min(1).default('INR'),
  category: z.enum(['travel', 'sourcing', 'production', 'equipment', 'subscription', 'other']),
  expense_date: z.string().min(1),
  vendor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  reimbursable: z.boolean().optional(),
  reimbursed: z.boolean().optional()
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = ExpenseSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...parsed.data,
      workspace_id: auth.user.workspace_id,
      created_by: auth.user.id
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}
