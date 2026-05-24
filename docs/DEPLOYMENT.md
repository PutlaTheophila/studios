# Deployment Guide

## Local development

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase credentials
npm run dev
```

## Setting up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for it to provision (~2 minutes)
3. Open the SQL Editor (left sidebar)
4. Copy contents of `supabase/migrations/001_initial_schema.sql` and run it
5. Then `002_rls_policies.sql`
6. Then `003_auth_trigger.sql`
7. Go to Project Settings > API. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
8. Go to Authentication > Providers. Email is enabled by default.
9. Optionally disable email confirmations during dev: Authentication > Settings > Email Auth > "Confirm email" off

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com and click "Add New Project"
3. Import your GitHub repo
4. In the deployment settings, add the same environment variables from `.env.local`
5. Click Deploy. Build takes ~2 minutes.
6. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL after first deploy
7. Add the Vercel URL to Supabase Auth > URL Configuration > Redirect URLs

## Inviting team members

The auth trigger checks for `workspace_id` in user metadata at signup. To invite an EA:

1. The creator generates an invite link with their workspace_id encoded
2. The EA signs up using that link, which passes `workspace_id` and `role: 'ea'` in metadata
3. Trigger places them in the existing workspace instead of creating a new one

Implementation: build an `/invite/[token]` page that signs the EA up with `supabase.auth.signUp({ email, password, options: { data: { workspace_id, role } } })`.

## Monitoring

- Vercel dashboard: deployment logs, runtime errors
- Supabase dashboard: database queries, slow query log, RLS policy violations
- Both have built-in error tracking that's adequate for early stage
