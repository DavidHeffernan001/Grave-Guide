# Supabase Setup

This project is ready for a Supabase-backed GraveGuide build.

## 1. Copy Environment Values

In Supabase, open the project and copy:

- Project URL
- Anon public key
- Service role key
- Database pooler connection string

Add them to Vercel as:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GRAVEGUIDE_ADMIN_TOKEN=
```

Only the two `NEXT_PUBLIC_` values are safe to expose in browser code. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## 2. Run Migrations

In Supabase SQL Editor, run these files in order:

1. `supabase/migrations/001_initial_graveguide_schema.sql`
2. `supabase/migrations/002_seed_sligo_town_cemetery.sql`
3. `supabase/migrations/003_memorial_photo_storage.sql`
4. `supabase/migrations/004_seed_sample_burial_record.sql`
5. `supabase/migrations/005_block_layouts_and_demo_records.sql`
6. `supabase/migrations/006_seed_sligo_demo_records.sql`

The first migration creates the core tables, indexes, triggers, and RLS policies. The second adds the first cemetery seed record. The third creates the private memorial photo bucket and storage policies. The fourth adds one sample published burial record for search testing. The fifth creates the saved block-layout table used by the Admin and Visitor prototypes. The sixth imports the original Sligo demo names, plots, and burials into Supabase.

## 3. Admin Save Token

Add this environment variable in Vercel:

```txt
GRAVEGUIDE_ADMIN_TOKEN
```

Use a long private value. In `/admin`, paste the same value into the Admin token field before saving a layout to Supabase.

## 4. Visitor Search

The `/visitor` page now searches the real Supabase burial records through:

```txt
/api/records?q=andrew
```

That API uses `SUPABASE_SERVICE_ROLE_KEY`, so make sure this key exists in Vercel. Do not put the service role key in browser code or visible text.

If Supabase cannot answer, the visitor page still shows the demo records so the prototype remains usable.

## 5. Auth

Enable email auth in Supabase Auth. New users automatically receive a row in `public.profiles`.

For the first admin account, sign up once, then run:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_ID';
```

You can find the user id in Supabase Auth > Users.

## 6. Storage

The storage migration creates a private bucket named:

```txt
memorial-photos
```

Photo metadata is tracked in `public.memorial_photos`.

## 7. Production Domain

Use `graveguide.ie` as the canonical production domain. Redirect:

- `www.graveguide.ie`
- `graveguide.co.uk`
- `www.graveguide.co.uk`

to `https://graveguide.ie`.
