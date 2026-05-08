create table if not exists public.cemetery_block_layouts (
  cemetery_slug text primary key references public.cemeteries(slug) on delete cascade,
  blocks jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cemetery_block_layouts enable row level security;

drop policy if exists "Published block layouts are public" on public.cemetery_block_layouts;
create policy "Published block layouts are public"
on public.cemetery_block_layouts for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cemeteries
    where cemeteries.slug = cemetery_block_layouts.cemetery_slug
    and cemeteries.status = 'published'
  )
);

drop policy if exists "Staff can manage block layouts" on public.cemetery_block_layouts;
create policy "Staff can manage block layouts"
on public.cemetery_block_layouts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

insert into public.cemetery_block_layouts (cemetery_slug, blocks)
values (
  'sligo-town-cemetery',
  '[
    {
      "id": "A",
      "cemeteryId": "sligo-town-cemetery",
      "name": "Block A",
      "physicalStrips": 9,
      "rowsPerStrip": 2,
      "stripRowCounts": { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2, "7": 2, "8": 2, "9": 2 },
      "blockTemplate": "standard-2",
      "logicalRows": 18,
      "rowPlotCounts": { "1": 26, "2": 26, "3": 32, "4": 32, "5": 32, "6": 32, "7": 32, "8": 32, "9": 32, "10": 32, "11": 32, "12": 32, "13": 32, "14": 32, "15": 32, "16": 32, "17": 32, "18": 32 },
      "rowRules": [{ "rows": [1, 2], "plotsPerRow": 26 }, { "rows": [3, 18], "plotsPerRow": 32 }],
      "calibration": { "x": 75.8, "y": 22.2, "width": 97, "height": 121, "rotate": 39, "cutout": { "x": -2, "y": -1, "width": 10, "height": 15 } },
      "x": 75.8,
      "y": 22.2,
      "width": 22,
      "height": 30,
      "rotate": 39
    },
    {
      "id": "B",
      "cemeteryId": "sligo-town-cemetery",
      "name": "Block B",
      "physicalStrips": 10,
      "rowsPerStrip": 2,
      "stripRowCounts": { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2, "7": 2, "8": 2, "9": 2, "10": 2 },
      "blockTemplate": "standard-2",
      "logicalRows": 20,
      "rowPlotCounts": { "1": 18, "2": 18, "3": 18, "4": 18, "5": 18, "6": 18, "7": 18, "8": 18, "9": 18, "10": 18, "11": 18, "12": 18, "13": 18, "14": 18, "15": 18, "16": 18, "17": 18, "18": 18, "19": 18, "20": 18 },
      "rowRules": [{ "rows": [1, 20], "plotsPerRow": 18 }],
      "calibration": { "x": 91.1, "y": 31.7, "width": 109, "height": 60, "rotate": 39, "cutout": { "x": 0, "y": 0, "width": 0, "height": 0 } },
      "x": 91.1,
      "y": 31.7,
      "width": 24,
      "height": 15,
      "rotate": 39
    },
    {
      "id": "C",
      "cemeteryId": "sligo-town-cemetery",
      "name": "Block C",
      "physicalStrips": 1,
      "rowsPerStrip": 2,
      "stripRowCounts": { "1": 2 },
      "blockTemplate": "standard-2",
      "logicalRows": 2,
      "rowPlotCounts": { "1": 32, "2": 32 },
      "rowRules": [{ "rows": [1, 2], "plotsPerRow": 32 }],
      "calibration": { "x": 100.3, "y": 26.4, "width": 111, "height": 63, "rotate": 39, "cutout": { "x": 0, "y": 0, "width": 0, "height": 0 } },
      "x": 100.3,
      "y": 26.4,
      "width": 24,
      "height": 16,
      "rotate": 39
    }
  ]'::jsonb
)
on conflict (cemetery_slug) do update set
  blocks = excluded.blocks,
  updated_at = now();
