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
7. `supabase/migrations/007_map_calibration.sql`
8. `supabase/migrations/008_admin_layout_entrances_and_plot_assignments.sql`
9. `supabase/migrations/009_grave_plot_assignment_unique_burial.sql`
10. `supabase/migrations/010_repair_map_calibration_columns.sql`
11. `supabase/migrations/011_remake_multicemetery_persistence.sql`

The first migration creates the core tables, indexes, triggers, and RLS policies. The second adds the first cemetery seed record. The third creates the private memorial photo bucket and storage policies. The fourth adds one sample published burial record for search testing. The fifth creates the saved block-layout table used by Admin, Map, and Visitor pages. The sixth imports the original Sligo demo names, plots, and burials into Supabase. The seventh creates the first map calibration record. The eighth adds entrance/QR layouts and plot assignment tracking. The ninth makes resident plot assignment updates reliable.
The tenth repairs older map calibration databases where columns were missing. The eleventh adds the Remake persistence table used for multi-cemetery prototype plots, burials, entrances, and multi-plot resident spans.

## 3. Admin Save Token

Add this environment variable in Vercel:

```txt
GRAVEGUIDE_ADMIN_TOKEN
```

Use a long private value. In `/admin`, paste the same value into the Admin token field before saving a layout to Supabase.

The same token is also used for:

- Saving real-map calibration values.
- Adding a new grave record from the Admin form.
- Saving entrances and QR entry points.
- Editing resident details and resident plot placement.

## 4. Visitor Search

The `/visitor` page now searches the real Supabase burial records through:

```txt
/api/records?q=andrew
```

That API uses `SUPABASE_SERVICE_ROLE_KEY`, so make sure this key exists in Vercel. Do not put the service role key in browser code or visible text.

If Supabase cannot answer, the visitor page still shows the demo records so the prototype remains usable.

## 5. Plot Detail Pages

The public plot pages use the plot reference in the address:

```txt
/plots/A-01-001
```

When that plot exists in Supabase, the page shows the Supabase person, burial, cemetery, and plot details. If the plot is not in Supabase yet, it falls back to the demo prototype record where possible.

## 6. Map Calibration

The `/map` page and visitor map now use Leaflet with OpenStreetMap tiles. The cemetery overlay still uses prototype layout coordinates, but migration `007_map_calibration.sql` adds a Supabase place to store real-world map settings.

Run this migration by opening the file, copying all of the SQL inside it, and pasting that SQL into Supabase SQL Editor. Do not paste the file name itself.

In `/admin`, use the Real map calibration panel to adjust the centre point and overlay size. Click `Save map calibration`, then reload `/map` or `/visitor`.

## 7. Admin Layout, Entrances, and Plot Rules

Run migrations `008`, `009`, `010`, and `011` before using the restored Admin tools.

In `/admin` you can now:

- Add, edit, and delete rectangle or polygon blocks.
- Add strips inside each block.
- Set a different row count for each strip.
- Set the maximum number of plots for each row.
- Add resident records with block, strip, row, starting plot, and plot span.
- Stop overlapping plot ranges.
- Stop records from going past the row limit.
- Add entrances, place them on the map, and copy the QR visitor link.
- Search and edit residents, including their plot placement.

The QR link opens `/visitor?entrance=...`. The visitor map starts near that entrance and asks the browser for live location permission when available.

## 8. Remake Live Saves

The Remake prototype is served from `/remake/index.html`. It reads from Supabase when data is available and falls back to the bundled local JSON files when the new Remake tables are not ready yet.

Before using live saves in the Remake admin screen:

1. Run `supabase/migrations/011_remake_multicemetery_persistence.sql` in Supabase SQL Editor.
2. Confirm `GRAVEGUIDE_ADMIN_TOKEN` exists in Vercel.
3. Open `/remake/index.html`, switch to Admin, paste the same admin save key, then save the cemetery, block, entrance, or resident changes.

## 9. Auth

Enable email auth in Supabase Auth. New users automatically receive a row in `public.profiles`.

For the first admin account, sign up once, then run:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_ID';
```

You can find the user id in Supabase Auth > Users.

## 10. Storage

The storage migration creates a private bucket named:

```txt
memorial-photos
```

Photo metadata is tracked in `public.memorial_photos`.

## 11. Production Domain

Use `graveguide.ie` as the canonical production domain. Redirect:

- `www.graveguide.ie`
- `graveguide.co.uk`
- `www.graveguide.co.uk`

to `https://graveguide.ie`.
