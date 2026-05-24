# Studio OS

A creator operations platform — content calendar, brand sourcing tracker, events, and contacts in one place.

This is the Next.js + Supabase production version, ported from the static HTML prototype.

## What's in this repo

```
studioos-nextjs/
├── src/
│   ├── app/                  Next.js App Router pages and API routes
│   │   ├── api/              Backend serverless functions
│   │   ├── sourcing/         Sourcing Board page
│   │   ├── calendar/         Content Calendar page
│   │   ├── events/           Events page (list + calendar views)
│   │   └── contacts/         Contacts page
│   ├── components/           Reusable React components
│   ├── lib/                  Database client, utils, constants
│   └── types/                TypeScript type definitions
├── supabase/
│   └── migrations/           SQL schema files (run in order)
├── scripts/
│   └── seed.ts               Optional sample data loader
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.local.example        Copy to .env.local and fill in
```

## Quick start (developer)

Prerequisites: **Node.js 20+** and a free **Supabase** account (https://supabase.com).

```bash
# 1. Install
npm install

# 2. Set up the database
#    - Create a new project at supabase.com
#    - Copy the SQL files from supabase/migrations/ into the SQL Editor
#    - Run them in order (001 first, then 002, etc.)

# 3. Configure environment
cp .env.local.example .env.local
#    Fill in your Supabase URL and keys (found in Project Settings > API)

# 4. (Optional) Seed sample data
npm run seed

# 5. Run locally
npm run dev
#    Open http://localhost:3000
```

## Deploying to Vercel

```bash
# 1. Push this repo to GitHub
# 2. Go to vercel.com, click "Add New Project", import the repo
# 3. Add the same environment variables from .env.local in Vercel dashboard
# 4. Deploy. Vercel will rebuild automatically on every git push.
```

## Architecture

**Frontend** — Next.js 14 App Router with React Server Components. Pages in `src/app/*/page.tsx`.

**Backend** — Next.js API Routes (serverless functions on Vercel) in `src/app/api/*/route.ts`. Every route validates auth via Supabase before reading/writing data.

**Database** — PostgreSQL hosted by Supabase. All schema is in `supabase/migrations/`. Row-Level Security (RLS) is enabled so users can only see their own workspace's data.

**Auth** — Supabase Auth with email/password. Three roles: `creator`, `ea`, `manager`. Stored in `users.role`. Permission logic in `src/lib/permissions.ts`.

**State management** — React Query (`@tanstack/react-query`) for server state. No global Redux/Zustand needed.

## Documentation

- `docs/SCHEMA.md` — Database schema with diagrams
- `docs/API.md` — REST API endpoint reference
- `docs/DEPLOYMENT.md` — Detailed deployment guide
- `docs/ROADMAP.md` — Suggested next features to build

## License

Private / Proprietary. Do not redistribute without permission.
