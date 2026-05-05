# GraveGuide

GraveGuide is a Vercel-ready Next.js app backed by Supabase.

## What Is In This Project

- `app/`: public GraveGuide app shell.
- `lib/supabase/`: Supabase browser/server client setup.
- `supabase/migrations/`: initial database schema, RLS policies, and seed data.
- `docs/`: Supabase, Vercel, and domain setup notes.
- `data/`: staging area for cemetery/import data.

## Environment

Copy `.env.example` to `.env.local` for local development and fill in the Supabase values:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Run

```powershell
npm install
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Supabase

Run the migrations in order:

1. `supabase/migrations/001_initial_graveguide_schema.sql`
2. `supabase/migrations/002_seed_sligo_town_cemetery.sql`
3. `supabase/migrations/003_memorial_photo_storage.sql`
4. `supabase/migrations/004_seed_sample_burial_record.sql`

More detail is in `docs/supabase-setup.md`.

## Deployment

Deploy as a Next.js project on Vercel. Use `graveguide.ie` as the primary domain and redirect the `.co.uk` domains to it.

More detail is in `docs/vercel-domain-setup.md`.
