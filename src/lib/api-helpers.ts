// Common helpers for API route handlers.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from './supabase-server';
import type { User } from '@/types/database';

// Coerce empty-string date inputs from HTML <input type="date"> to null,
// since Postgres rejects "" for date columns.
export const dateOrNull = z.preprocess(
  v => (v === '' || v === undefined ? null : v),
  z.string().nullable()
);

export function blankDatesToNull<T extends Record<string, unknown>>(obj: T, fields: readonly string[]): T {
  for (const f of fields) {
    if (obj[f] === '') (obj as Record<string, unknown>)[f] = null;
  }
  return obj;
}

export async function requireUser(): Promise<{ user: User } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { user: user as User };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T) {
  return NextResponse.json(data);
}
