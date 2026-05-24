import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireUser, jsonError, jsonOk } from '@/lib/api-helpers';

const ContactSchema = z.object({
  name: z.string().min(1),
  agency: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  profession: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().or(z.literal('')).optional(),
  instagram: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name', { ascending: true });

  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  const supabase = createSupabaseServerClient();

  // duplicate check by name
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .ilike('name', parsed.data.name)
    .limit(1);

  if (existing && existing.length > 0 && !req.headers.get('x-allow-duplicate')) {
    return jsonError(`Contact "${parsed.data.name}" already exists`, 409);
  }

  const { data, error } = await supabase
    .from('contacts')
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
