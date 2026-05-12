-- GraveGuide relational schema draft.
-- Target: Postgres / Supabase compatible.
-- This is not wired into the prototype yet.

create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cemeteries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  slug text not null unique,
  town text,
  county text,
  country_code char(2) not null default 'IE',
  osm_bbox numeric(12, 8)[] check (array_length(osm_bbox, 1) = 4),
  default_map_provider text not null default 'osm-hot',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cemetery_entrances (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  name text not null,
  slug text not null,
  qr_code_slug text not null unique,
  start_x_percent numeric(6, 2) not null,
  start_y_percent numeric(6, 2) not null,
  default_heading_degrees numeric(7, 2) not null default 0,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cemetery_id, slug)
);

create table cemetery_blocks (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  code text not null,
  name text not null,
  block_template text not null default 'standard-2',
  line_mode text not null default 'path-guides',
  physical_strips integer not null default 1 check (physical_strips > 0),
  default_rows_per_strip integer not null default 2 check (default_rows_per_strip between 1 and 5),
  logical_rows integer not null default 2 check (logical_rows > 0),
  anchor_x_percent numeric(6, 2) not null,
  anchor_y_percent numeric(6, 2) not null,
  width_px numeric(8, 2) not null check (width_px > 0),
  height_px numeric(8, 2) not null check (height_px > 0),
  rotation_degrees numeric(7, 2) not null default 0,
  cutout_x_percent numeric(6, 2) not null default 0,
  cutout_y_percent numeric(6, 2) not null default 0,
  cutout_width_percent numeric(6, 2) not null default 0,
  cutout_height_percent numeric(6, 2) not null default 0,
  polygon_points jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cemetery_id, code)
);

create table block_strips (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references cemetery_blocks(id) on delete cascade,
  strip_number integer not null check (strip_number > 0),
  row_count integer not null default 2 check (row_count between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, strip_number)
);

create table block_rows (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references cemetery_blocks(id) on delete cascade,
  strip_id uuid references block_strips(id) on delete set null,
  row_number integer not null check (row_number > 0),
  row_number_in_strip integer not null default 1 check (row_number_in_strip > 0),
  expected_plot_count integer not null default 32 check (expected_plot_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, row_number)
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  block_id uuid not null references cemetery_blocks(id) on delete cascade,
  row_id uuid references block_rows(id) on delete set null,
  public_plot_ref text not null,
  row_number integer not null check (row_number > 0),
  plot_number integer not null check (plot_number > 0),
  plot_width_units numeric(5, 2) not null default 1 check (plot_width_units > 0),
  plot_type text not null default 'single' check (plot_type in ('single', 'double', 'triple', 'quad', 'custom')),
  calculated_x_percent numeric(6, 2),
  calculated_y_percent numeric(6, 2),
  calibrated_x_percent numeric(6, 2),
  calibrated_y_percent numeric(6, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, row_number, plot_number),
  unique (cemetery_id, public_plot_ref)
);

create table plot_calibration_anchors (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references cemetery_blocks(id) on delete cascade,
  plot_id uuid references plots(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  plot_number integer not null check (plot_number > 0),
  suggested_x_percent numeric(6, 2) not null,
  suggested_y_percent numeric(6, 2) not null,
  calibrated_x_percent numeric(6, 2),
  calibrated_y_percent numeric(6, 2),
  anchor_role text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, anchor_role)
);

create table burials (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  plot_id uuid not null references plots(id) on delete restrict,
  first_name text not null,
  middle_names text,
  last_name text not null,
  display_name text not null,
  date_of_birth date,
  date_of_death date,
  inscription text,
  source_reference text,
  visibility text not null default 'public' check (visibility in ('public', 'private', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table route_nodes (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  name text not null,
  node_type text not null default 'junction' check (node_type in ('entrance', 'junction', 'block_entry', 'plot')),
  x_percent numeric(6, 2) not null,
  y_percent numeric(6, 2) not null,
  entrance_id uuid references cemetery_entrances(id) on delete set null,
  plot_id uuid references plots(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table route_edges (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid not null references cemeteries(id) on delete cascade,
  from_node_id uuid not null references route_nodes(id) on delete cascade,
  to_node_id uuid not null references route_nodes(id) on delete cascade,
  distance_metres numeric(8, 2),
  is_accessible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_node_id <> to_node_id)
);

create table admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  cemetery_id uuid references cemeteries(id) on delete set null,
  actor_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index cemeteries_slug_idx on cemeteries (slug);
create index cemetery_entrances_cemetery_idx on cemetery_entrances (cemetery_id);
create index cemetery_blocks_cemetery_idx on cemetery_blocks (cemetery_id);
create index block_rows_block_idx on block_rows (block_id);
create index plots_cemetery_idx on plots (cemetery_id);
create index plots_block_row_idx on plots (block_id, row_number);
create index burials_cemetery_idx on burials (cemetery_id);
create index burials_plot_idx on burials (plot_id);
create index burials_name_search_idx on burials using gin (
  to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(middle_names, '') || ' ' || coalesce(last_name, ''))
);
create index route_edges_from_idx on route_edges (from_node_id);
create index route_edges_to_idx on route_edges (to_node_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_set_updated_at before update on organizations
for each row execute function set_updated_at();

create trigger cemeteries_set_updated_at before update on cemeteries
for each row execute function set_updated_at();

create trigger cemetery_entrances_set_updated_at before update on cemetery_entrances
for each row execute function set_updated_at();

create trigger cemetery_blocks_set_updated_at before update on cemetery_blocks
for each row execute function set_updated_at();

create trigger block_strips_set_updated_at before update on block_strips
for each row execute function set_updated_at();

create trigger block_rows_set_updated_at before update on block_rows
for each row execute function set_updated_at();

create trigger plots_set_updated_at before update on plots
for each row execute function set_updated_at();

create trigger plot_calibration_anchors_set_updated_at before update on plot_calibration_anchors
for each row execute function set_updated_at();

create trigger burials_set_updated_at before update on burials
for each row execute function set_updated_at();

create trigger route_nodes_set_updated_at before update on route_nodes
for each row execute function set_updated_at();

create trigger route_edges_set_updated_at before update on route_edges
for each row execute function set_updated_at();
