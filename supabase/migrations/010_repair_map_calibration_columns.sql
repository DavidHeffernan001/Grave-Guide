alter table public.cemetery_map_calibrations
add column if not exists overlay_width_meters numeric(8, 2) not null default 150;

alter table public.cemetery_map_calibrations
add column if not exists overlay_height_meters numeric(8, 2) not null default 120;

alter table public.cemetery_map_calibrations
add column if not exists rotation_degrees numeric(6, 2) not null default 0;

notify pgrst, 'reload schema';
