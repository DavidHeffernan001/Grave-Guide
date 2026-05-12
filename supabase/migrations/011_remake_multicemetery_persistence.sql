create table if not exists public.cemetery_entrance_layouts (
  cemetery_slug text primary key references public.cemeteries(slug) on delete cascade,
  entrances jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cemetery_entrance_layouts enable row level security;

drop policy if exists "Entrance layouts are public" on public.cemetery_entrance_layouts;
drop policy if exists "Published entrance layouts are public" on public.cemetery_entrance_layouts;
create policy "Published entrance layouts are public"
on public.cemetery_entrance_layouts for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cemeteries
    where cemeteries.slug = cemetery_entrance_layouts.cemetery_slug
    and cemeteries.status = 'published'
  )
);

drop policy if exists "Staff can manage entrance layouts" on public.cemetery_entrance_layouts;
create policy "Staff can manage entrance layouts"
on public.cemetery_entrance_layouts for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create table if not exists public.cemetery_prototype_data (
  cemetery_slug text primary key references public.cemeteries(slug) on delete cascade,
  plots jsonb not null default '[]'::jsonb,
  burials jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cemetery_prototype_data enable row level security;

drop policy if exists "Published prototype data is public" on public.cemetery_prototype_data;
create policy "Published prototype data is public"
on public.cemetery_prototype_data for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cemeteries
    where cemeteries.slug = cemetery_prototype_data.cemetery_slug
    and cemeteries.status = 'published'
  )
);

drop policy if exists "Staff can manage prototype data" on public.cemetery_prototype_data;
create policy "Staff can manage prototype data"
on public.cemetery_prototype_data for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

alter table public.burials
add column if not exists plot_spaces integer not null default 1;
