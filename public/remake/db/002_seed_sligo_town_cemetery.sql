-- Seed data for the current Sligo Town Cemetery prototype.
-- Run after 001_initial_schema.sql.

with org as (
  insert into organizations (name, slug)
  values ('Sligo County Council', 'sligo-county-council')
  on conflict (slug) do update set name = excluded.name
  returning id
),
cem as (
  insert into cemeteries (organization_id, name, slug, town, county, country_code, osm_bbox, status)
  select id, 'Sligo Town Cemetery', 'sligo-town-cemetery', 'Sligo', 'Sligo', 'IE',
    array[-8.4666, 54.2587, -8.4628, 54.2604]::numeric[],
    'draft'
  from org
  on conflict (slug) do update set
    name = excluded.name,
    osm_bbox = excluded.osm_bbox,
    status = excluded.status
  returning id
)
insert into cemetery_entrances (
  cemetery_id,
  name,
  slug,
  qr_code_slug,
  start_x_percent,
  start_y_percent,
  default_heading_degrees,
  is_primary
)
select id, 'Main Entrance', 'main-entrance', 'sligo-town-cemetery-main-entrance', 76.3, 13.5, -128, true from cem
union all
select id, 'Cemetery Road Gate', 'cemetery-road-gate', 'sligo-town-cemetery-cemetery-road-gate', 42.4, 33.4, -128, false from cem
on conflict (qr_code_slug) do update set
  start_x_percent = excluded.start_x_percent,
  start_y_percent = excluded.start_y_percent,
  default_heading_degrees = excluded.default_heading_degrees,
  is_primary = excluded.is_primary;

with cem as (
  select id from cemeteries where slug = 'sligo-town-cemetery'
)
insert into cemetery_blocks (
  cemetery_id,
  code,
  name,
  block_template,
  physical_strips,
  default_rows_per_strip,
  logical_rows,
  anchor_x_percent,
  anchor_y_percent,
  width_px,
  height_px,
  rotation_degrees,
  cutout_x_percent,
  cutout_y_percent,
  cutout_width_percent,
  cutout_height_percent,
  display_order
)
select id, 'A', 'Block A', 'standard-2', 9, 2, 18, 75.8, 22.2, 97, 121, 39, -2, -1, 10, 15, 1 from cem
union all
select id, 'B', 'Block B', 'standard-2', 10, 2, 20, 91.1, 31.7, 109, 60, 39, 0, 0, 0, 0, 2 from cem
union all
select id, 'C', 'Block C', 'standard-2', 1, 2, 2, 100.3, 26.4, 111, 63, 39, 0, 0, 0, 0, 3 from cem
on conflict (cemetery_id, code) do update set
  name = excluded.name,
  physical_strips = excluded.physical_strips,
  default_rows_per_strip = excluded.default_rows_per_strip,
  logical_rows = excluded.logical_rows,
  anchor_x_percent = excluded.anchor_x_percent,
  anchor_y_percent = excluded.anchor_y_percent,
  width_px = excluded.width_px,
  height_px = excluded.height_px,
  rotation_degrees = excluded.rotation_degrees,
  cutout_x_percent = excluded.cutout_x_percent,
  cutout_y_percent = excluded.cutout_y_percent,
  cutout_width_percent = excluded.cutout_width_percent,
  cutout_height_percent = excluded.cutout_height_percent;

insert into block_strips (block_id, strip_number, row_count)
select b.id, strip_number, row_count
from cemetery_blocks b
join lateral (
  select generate_series(1, b.physical_strips) as strip_number, b.default_rows_per_strip as row_count
) strips on true
where b.cemetery_id = (select id from cemeteries where slug = 'sligo-town-cemetery')
on conflict (block_id, strip_number) do update set row_count = excluded.row_count;

insert into block_rows (block_id, strip_id, row_number, row_number_in_strip, expected_plot_count)
select
  b.id,
  s.id,
  row_number,
  case when b.default_rows_per_strip = 1 then 1 else ((row_number - 1) % b.default_rows_per_strip) + 1 end,
  case
    when b.code = 'A' and row_number in (1, 2) then 26
    when b.code = 'B' then 18
    else 32
  end
from cemetery_blocks b
join lateral generate_series(1, b.logical_rows) as rows(row_number) on true
left join block_strips s
  on s.block_id = b.id
  and s.strip_number = ceiling(rows.row_number::numeric / b.default_rows_per_strip)::integer
where b.cemetery_id = (select id from cemeteries where slug = 'sligo-town-cemetery')
on conflict (block_id, row_number) do update set
  strip_id = excluded.strip_id,
  row_number_in_strip = excluded.row_number_in_strip,
  expected_plot_count = excluded.expected_plot_count;

with cem as (
  select id from cemeteries where slug = 'sligo-town-cemetery'
),
plot_values(block_code, row_number, plot_number, calibrated_x, calibrated_y, plot_type) as (
  values
    ('A', 1, 1, 4.4, 21.8, 'single'),
    ('A', 1, 2, null, null, 'single'),
    ('A', 1, 3, null, null, 'single'),
    ('A', 2, 1, 4.4, 21.8, 'single'),
    ('A', 2, 2, null, null, 'single'),
    ('A', 3, 4, null, null, 'single'),
    ('A', 4, 6, null, null, 'single'),
    ('A', 5, 10, null, null, 'single'),
    ('A', 7, 3, null, null, 'single'),
    ('A', 9, 14, null, null, 'single'),
    ('A', 10, 9, 48.7, 28.9, 'single'),
    ('A', 4, 21, 17.3, 71.9, 'single'),
    ('A', 8, 6, 37.8, 12.9, 'single'),
    ('A', 12, 28, 61.1, 87.3, 'single'),
    ('A', 15, 13, null, null, 'single'),
    ('A', 17, 30, null, null, 'single'),
    ('A', 9, 1, null, null, 'single'),
    ('A', 5, 32, null, null, 'single'),
    ('B', 1, 1, null, null, 'single'),
    ('B', 8, 12, null, null, 'single'),
    ('B', 14, 24, null, null, 'single'),
    ('B', 20, 32, null, null, 'single')
)
insert into plots (
  cemetery_id,
  block_id,
  row_id,
  public_plot_ref,
  row_number,
  plot_number,
  plot_type,
  calibrated_x_percent,
  calibrated_y_percent
)
select
  cem.id,
  b.id,
  r.id,
  b.code || '-' || lpad(v.row_number::text, 2, '0') || '-' || lpad(v.plot_number::text, 3, '0'),
  v.row_number,
  v.plot_number,
  v.plot_type,
  v.calibrated_x,
  v.calibrated_y
from plot_values v
join cemetery_blocks b on b.code = v.block_code and b.cemetery_id = (select id from cem)
join block_rows r on r.block_id = b.id and r.row_number = v.row_number
cross join cem
on conflict (block_id, row_number, plot_number) do update set
  calibrated_x_percent = excluded.calibrated_x_percent,
  calibrated_y_percent = excluded.calibrated_y_percent;

with burial_values(first_name, last_name, dob, dod, public_plot_ref) as (
  values
    ('Andrew', 'Hosie', date '1848-03-12', date '1917-09-04', 'A-01-001'),
    ('Margaret', 'Keane', date '1861-11-02', date '1934-01-18', 'A-01-002'),
    ('Patrick', 'Walsh', date '1874-06-21', date '1942-10-29', 'A-01-003'),
    ('Mary Jane', 'Robertson', date '1880-02-14', date '1956-05-03', 'A-02-001'),
    ('Thomas', 'Gallagher', date '1893-08-09', date '1967-12-11', 'A-02-002'),
    ('Ellen', 'Poe', date '1901-04-27', date '1979-07-15', 'A-03-004'),
    ('Bridget', 'McLoughlin', date '1912-01-05', date '1988-03-22', 'A-04-006'),
    ('John', 'Brennan', date '1920-09-18', date '1994-06-02', 'A-05-010'),
    ('Kathleen', 'O''Connor', date '1931-12-03', date '2008-11-17', 'A-07-003'),
    ('Michael', 'Scanlon', date '1944-05-30', date '2019-02-09', 'A-09-014'),
    ('Nora', 'Connolly', date '1938-10-12', date '2022-04-21', 'A-10-009'),
    ('Seamus', 'Doyle', date '1941-07-08', date '2011-09-13', 'A-04-021'),
    ('Anne', 'Morrison', date '1952-03-26', date '2020-08-30', 'A-08-006'),
    ('Liam', 'Kelly', date '1936-01-17', date '2005-05-12', 'A-12-028'),
    ('Rose', 'Flanagan', date '1928-11-19', date '1999-12-01', 'A-15-013'),
    ('Teresa', 'Henry', date '1949-06-04', date '2017-10-25', 'A-17-030'),
    ('Noel', 'Brennan', date '1947-02-18', date '2016-11-07', 'A-09-001'),
    ('Aaron', 'Moran', date '1955-09-03', date '2021-04-14', 'A-05-032'),
    ('Eileen', 'Ward', date '1939-05-14', date '2012-02-10', 'B-01-001'),
    ('Martin', 'Sweeney', date '1946-09-22', date '2018-12-04', 'B-08-012'),
    ('Grace', 'Nolan', date '1951-04-03', date '2020-06-19', 'B-14-024'),
    ('Peter', 'Burns', date '1934-01-28', date '2007-08-15', 'B-20-032')
)
insert into burials (cemetery_id, plot_id, first_name, last_name, display_name, date_of_birth, date_of_death)
select p.cemetery_id, p.id, v.first_name, v.last_name, trim(v.first_name || ' ' || v.last_name), v.dob, v.dod
from burial_values v
join plots p on p.public_plot_ref = v.public_plot_ref
where p.cemetery_id = (select id from cemeteries where slug = 'sligo-town-cemetery')
and not exists (
  select 1
  from burials existing
  where existing.plot_id = p.id
    and existing.first_name = v.first_name
    and existing.last_name = v.last_name
    and existing.date_of_birth is not distinct from v.dob
    and existing.date_of_death is not distinct from v.dod
);

with block_anchor_values(block_code, role, row_number, plot_number, x_percent, y_percent) as (
  values
    ('C', 'top-left', 1, 1, 8, 8),
    ('C', 'top-right', 1, 32, 8, 92),
    ('C', 'bottom-left', 2, 1, 92, 8),
    ('C', 'inner-a', 1, 12, 29, 37.4),
    ('C', 'centre', 2, 16, 50, 50),
    ('C', 'inner-b', 2, 21, 71, 62.6),
    ('C', 'inner-c', 2, 9, 79.4, 29)
)
insert into plot_calibration_anchors (
  block_id,
  row_number,
  plot_number,
  suggested_x_percent,
  suggested_y_percent,
  anchor_role
)
select b.id, v.row_number, v.plot_number, v.x_percent, v.y_percent, v.role
from block_anchor_values v
join cemetery_blocks b on b.code = v.block_code
where b.cemetery_id = (select id from cemeteries where slug = 'sligo-town-cemetery')
on conflict (block_id, anchor_role) do update set
  row_number = excluded.row_number,
  plot_number = excluded.plot_number,
  suggested_x_percent = excluded.suggested_x_percent,
  suggested_y_percent = excluded.suggested_y_percent;
