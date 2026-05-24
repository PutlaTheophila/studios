// ════════════════════════════════════════════════════════════════
// Server-side Supabase clients
// ════════════════════════════════════════════════════════════════
// Use these in Server Components, Server Actions, and Route Handlers.
// They read the user's session from cookies and respect RLS policies.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Standard server client — uses the user's session and respects RLS.
 * Use this in API routes and server components for normal operations.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context — cookies can't be set here.
            // Middleware handles session refresh.
          }
        }
      }
    }
  );
}

/**
 * Admin client — bypasses RLS. Use sparingly and only on the server.
 * Useful for scripts, webhooks, and operations that need to span workspaces.
 * NEVER expose this to the browser.
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Get the currently authenticated user's profile, including workspace_id.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, workspace_id, email, name, role')
    .eq('id', user.id)
    .single();

  return profile;
}
