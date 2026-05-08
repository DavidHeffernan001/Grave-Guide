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
      "name": "Block A",
      "x": 75.8,
      "y": 22.2,
      "width": 22,
      "height": 30,
      "rotate": 39,
      "blockType": "standard",
      "stripCount": 3,
      "rowCount": 17,
      "plotsPerRow": 32,
      "firstPlotNumber": 1,
      "rowPrefix": "R",
      "stripPrefix": "S",
      "numberingDirection": "left-to-right",
      "rowOrientation": "horizontal",
      "notes": "Main prototype burial block."
    },
    {
      "id": "B",
      "name": "Block B",
      "x": 91.1,
      "y": 31.7,
      "width": 24,
      "height": 15,
      "rotate": 39,
      "blockType": "standard",
      "stripCount": 2,
      "rowCount": 20,
      "plotsPerRow": 32,
      "firstPlotNumber": 1,
      "rowPrefix": "R",
      "stripPrefix": "S",
      "numberingDirection": "left-to-right",
      "rowOrientation": "horizontal",
      "notes": "Secondary burial block along the east path."
    },
    {
      "id": "C",
      "name": "Block C",
      "x": 100.3,
      "y": 26.4,
      "width": 24,
      "height": 16,
      "rotate": 39,
      "blockType": "cremation",
      "stripCount": 2,
      "rowCount": 12,
      "plotsPerRow": 24,
      "firstPlotNumber": 1,
      "rowPrefix": "R",
      "stripPrefix": "S",
      "numberingDirection": "left-to-right",
      "rowOrientation": "vertical",
      "notes": "Prototype cremation and memorial section."
    }
  ]'::jsonb
)
on conflict (cemetery_slug) do update set
  blocks = excluded.blocks,
  updated_at = now();
