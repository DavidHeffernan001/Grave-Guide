create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.app_role as enum ('admin', 'moderator', 'contributor');
create type public.record_status as enum ('draft', 'pending_review', 'published', 'archived');
create type public.contribution_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'contributor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cemeteries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  town text,
  county text,
  country text not null default 'Ireland',
  description text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  boundary geography(polygon, 4326),
  status public.record_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cemetery_blocks (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references public.cemeteries(id) on delete cascade,
  code text not null,
  name text,
  description text,
  geometry geography(polygon, 4326),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cemetery_id, code)
);

create table public.grave_plots (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references public.cemeteries(id) on delete cascade,
  block_id uuid references public.cemetery_blocks(id) on delete set null,
  plot_reference text not null,
  row_label text,
  plot_number text,
  location geography(point, 4326),
  geometry geography(polygon, 4326),
  notes text,
  status public.record_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cemetery_id, plot_reference)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  given_names text,
  family_name text,
  display_name text generated always as (
    nullif(trim(coalesce(given_names, '') || ' ' || coalesce(family_name, '')), '')
  ) stored,
  date_of_birth date,
  date_of_death date,
  age_text text,
  biography text,
  status public.record_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.burials (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  plot_id uuid not null references public.grave_plots(id) on delete cascade,
  burial_date date,
  inscription text,
  source_notes text,
  status public.record_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, plot_id)
);

create table public.memorial_photos (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references public.cemeteries(id) on delete cascade,
  plot_id uuid references public.grave_plots(id) on delete set null,
  storage_path text not null,
  caption text,
  alt_text text,
  status public.record_status not null default 'pending_review',
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_id uuid,
  payload jsonb not null,
  note text,
  status public.contribution_status not null default 'pending',
  submitted_by uuid not null references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_cemeteries_updated_at
before update on public.cemeteries
for each row execute function public.set_updated_at();

create trigger set_cemetery_blocks_updated_at
before update on public.cemetery_blocks
for each row execute function public.set_updated_at();

create trigger set_grave_plots_updated_at
before update on public.grave_plots
for each row execute function public.set_updated_at();

create trigger set_people_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger set_burials_updated_at
before update on public.burials
for each row execute function public.set_updated_at();

create trigger set_memorial_photos_updated_at
before update on public.memorial_photos
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'moderator'), false)
$$;

create index cemeteries_status_idx on public.cemeteries(status);
create index cemeteries_slug_idx on public.cemeteries(slug);
create index cemetery_blocks_cemetery_idx on public.cemetery_blocks(cemetery_id);
create index grave_plots_cemetery_idx on public.grave_plots(cemetery_id);
create index grave_plots_block_idx on public.grave_plots(block_id);
create index grave_plots_status_idx on public.grave_plots(status);
create index people_name_idx on public.people(family_name, given_names);
create index people_status_idx on public.people(status);
create index burials_person_idx on public.burials(person_id);
create index burials_plot_idx on public.burials(plot_id);
create index burials_status_idx on public.burials(status);
create index memorial_photos_plot_idx on public.memorial_photos(plot_id);
create index memorial_photos_status_idx on public.memorial_photos(status);
create index contributions_submitted_by_idx on public.contributions(submitted_by);
create index contributions_status_idx on public.contributions(status);

alter table public.profiles enable row level security;
alter table public.cemeteries enable row level security;
alter table public.cemetery_blocks enable row level security;
alter table public.grave_plots enable row level security;
alter table public.people enable row level security;
alter table public.burials enable row level security;
alter table public.memorial_photos enable row level security;
alter table public.contributions enable row level security;

create policy "Profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy "Staff can manage profiles"
on public.profiles for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published cemeteries are public"
on public.cemeteries for select
to anon, authenticated
using (status = 'published' or public.is_staff());

create policy "Staff can manage cemeteries"
on public.cemeteries for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published blocks are public"
on public.cemetery_blocks for select
to anon, authenticated
using (
  exists (
    select 1 from public.cemeteries
    where cemeteries.id = cemetery_blocks.cemetery_id
    and (cemeteries.status = 'published' or public.is_staff())
  )
);

create policy "Staff can manage blocks"
on public.cemetery_blocks for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published plots are public"
on public.grave_plots for select
to anon, authenticated
using (status = 'published' or public.is_staff());

create policy "Staff can manage plots"
on public.grave_plots for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published people are public"
on public.people for select
to anon, authenticated
using (status = 'published' or public.is_staff());

create policy "Staff can manage people"
on public.people for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published burials are public"
on public.burials for select
to anon, authenticated
using (status = 'published' or public.is_staff());

create policy "Staff can manage burials"
on public.burials for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Published photos are public"
on public.memorial_photos for select
to anon, authenticated
using (status = 'published' or public.is_staff());

create policy "Signed-in users can upload pending photos"
on public.memorial_photos for insert
to authenticated
with check (uploaded_by = auth.uid() and status = 'pending_review');

create policy "Staff can manage photos"
on public.memorial_photos for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy "Users can submit contributions"
on public.contributions for insert
to authenticated
with check (submitted_by = auth.uid() and status = 'pending');

create policy "Users can read their own contributions"
on public.contributions for select
to authenticated
using (submitted_by = auth.uid() or public.is_staff());

create policy "Staff can review contributions"
on public.contributions for update
to authenticated
using (public.is_staff())
with check (public.is_staff());
