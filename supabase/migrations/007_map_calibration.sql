create table if not exists public.cemetery_map_calibrations (
  cemetery_slug text primary key references public.cemeteries(slug) on delete cascade,
  center_latitude numeric(10, 7) not null,
  center_longitude numeric(10, 7) not null,
  default_zoom integer not null default 18,
  min_zoom integer not null default 16,
  max_zoom integer not null default 22,
  rotation_degrees numeric(6, 2) not null default 0,
  calibration_notes text,
  updated_at timestamptz not null default now()
);

alter table public.cemetery_map_calibrations enable row level security;

drop policy if exists "Map calibrations are public" on public.cemetery_map_calibrations;
create policy "Map calibrations are public"
on public.cemetery_map_calibrations for select
to anon, authenticated
using (true);

drop policy if exists "Staff can manage map calibrations" on public.cemetery_map_calibrations;
create policy "Staff can manage map calibrations"
on public.cemetery_map_calibrations for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

insert into public.cemetery_map_calibrations (
  cemetery_slug,
  center_latitude,
  center_longitude,
  default_zoom,
  min_zoom,
  max_zoom,
  calibration_notes
) values (
  'sligo-town-cemetery',
  54.2766,
  -8.4761,
  18,
  16,
  22,
  'Initial Sligo Town Cemetery map calibration placeholder. Replace with surveyed entrance and boundary coordinates before public launch.'
) on conflict (cemetery_slug) do update set
  center_latitude = excluded.center_latitude,
  center_longitude = excluded.center_longitude,
  default_zoom = excluded.default_zoom,
  min_zoom = excluded.min_zoom,
  max_zoom = excluded.max_zoom,
  calibration_notes = excluded.calibration_notes,
  updated_at = now();
