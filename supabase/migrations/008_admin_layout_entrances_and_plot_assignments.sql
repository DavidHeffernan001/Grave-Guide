create table if not exists public.cemetery_entrance_layouts (
  cemetery_slug text primary key references public.cemeteries(slug) on delete cascade,
  entrances jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cemetery_entrance_layouts enable row level security;

drop policy if exists "Entrance layouts are public" on public.cemetery_entrance_layouts;
create policy "Entrance layouts are public"
on public.cemetery_entrance_layouts for select
to anon, authenticated
using (true);

drop policy if exists "Staff can manage entrance layouts" on public.cemetery_entrance_layouts;
create policy "Staff can manage entrance layouts"
on public.cemetery_entrance_layouts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create table if not exists public.grave_plot_assignments (
  id uuid primary key default gen_random_uuid(),
  cemetery_slug text not null references public.cemeteries(slug) on delete cascade,
  burial_id uuid unique references public.burials(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  plot_id uuid references public.grave_plots(id) on delete cascade,
  block_code text not null,
  strip_number integer not null,
  row_number integer not null,
  starting_plot_number integer not null,
  plot_span integer not null default 1,
  occupied_plot_numbers integer[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grave_plot_assignments_positive_values check (
    strip_number > 0
    and row_number > 0
    and starting_plot_number > 0
    and plot_span > 0
  )
);

create index if not exists grave_plot_assignments_lookup_idx
on public.grave_plot_assignments(cemetery_slug, block_code, strip_number, row_number);

alter table public.grave_plot_assignments enable row level security;

drop policy if exists "Plot assignments are public" on public.grave_plot_assignments;
create policy "Plot assignments are public"
on public.grave_plot_assignments for select
to anon, authenticated
using (true);

drop policy if exists "Staff can manage plot assignments" on public.grave_plot_assignments;
create policy "Staff can manage plot assignments"
on public.grave_plot_assignments for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

insert into public.cemetery_entrance_layouts (cemetery_slug, entrances)
values (
  'sligo-town-cemetery',
  '[
    {"id":"sligo-main-entrance","name":"Main Entrance","x":76.3,"y":13.5,"qrCode":"graveguide-sligo-main-entrance","linkedBlockId":null},
    {"id":"sligo-cemetery-road-gate","name":"Cemetery Road Gate","x":42.4,"y":33.4,"qrCode":"graveguide-sligo-cemetery-road-gate","linkedBlockId":null}
  ]'::jsonb
)
on conflict (cemetery_slug) do nothing;
