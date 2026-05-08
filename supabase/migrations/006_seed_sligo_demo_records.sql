insert into public.cemetery_blocks (cemetery_id, code, name, sort_order)
select c.id, block_code, 'Block ' || block_code, sort_order
from public.cemeteries c
cross join (
  values
    ('A', 1),
    ('B', 2),
    ('C', 3)
) as block_seed(block_code, sort_order)
where c.slug = 'sligo-town-cemetery'
on conflict (cemetery_id, code) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

with plot_seed(plot_reference) as (
  values
    ('A-01-001'),
    ('A-01-002'),
    ('A-01-003'),
    ('A-02-001'),
    ('A-02-002'),
    ('A-03-004'),
    ('A-04-006'),
    ('A-05-010'),
    ('A-07-003'),
    ('A-09-014'),
    ('A-10-009'),
    ('A-04-021'),
    ('A-08-006'),
    ('A-12-028'),
    ('A-15-013'),
    ('A-17-030'),
    ('A-09-001'),
    ('A-05-032'),
    ('B-01-001'),
    ('B-08-012'),
    ('B-14-024'),
    ('B-20-032')
)
insert into public.grave_plots (
  cemetery_id,
  block_id,
  plot_reference,
  row_label,
  plot_number,
  status
)
select
  c.id,
  b.id,
  p.plot_reference,
  split_part(p.plot_reference, '-', 2),
  split_part(p.plot_reference, '-', 3),
  'published'
from plot_seed p
join public.cemeteries c on c.slug = 'sligo-town-cemetery'
join public.cemetery_blocks b on b.cemetery_id = c.id and b.code = split_part(p.plot_reference, '-', 1)
on conflict (cemetery_id, plot_reference) do update set
  block_id = excluded.block_id,
  row_label = excluded.row_label,
  plot_number = excluded.plot_number,
  status = excluded.status;

with record_seed(given_names, family_name, date_of_birth, date_of_death, plot_reference) as (
  values
    ('Andrew', 'Hosie', '1848-03-12'::date, '1917-09-04'::date, 'A-01-001'),
    ('Margaret', 'Keane', '1861-11-02'::date, '1934-01-18'::date, 'A-01-002'),
    ('Patrick', 'Walsh', '1874-06-21'::date, '1942-10-29'::date, 'A-01-003'),
    ('Mary Jane', 'Robertson', '1880-02-14'::date, '1956-05-03'::date, 'A-02-001'),
    ('Thomas', 'Gallagher', '1893-08-09'::date, '1967-12-11'::date, 'A-02-002'),
    ('Ellen', 'Poe', '1901-04-27'::date, '1979-07-15'::date, 'A-03-004'),
    ('Bridget', 'McLoughlin', '1912-01-05'::date, '1988-03-22'::date, 'A-04-006'),
    ('John', 'Brennan', '1920-09-18'::date, '1994-06-02'::date, 'A-05-010'),
    ('Kathleen', 'O''Connor', '1931-12-03'::date, '2008-11-17'::date, 'A-07-003'),
    ('Michael', 'Scanlon', '1944-05-30'::date, '2019-02-09'::date, 'A-09-014'),
    ('Nora', 'Connolly', '1938-10-12'::date, '2022-04-21'::date, 'A-10-009'),
    ('Seamus', 'Doyle', '1941-07-08'::date, '2011-09-13'::date, 'A-04-021'),
    ('Anne', 'Morrison', '1952-03-26'::date, '2020-08-30'::date, 'A-08-006'),
    ('Liam', 'Kelly', '1936-01-17'::date, '2005-05-12'::date, 'A-12-028'),
    ('Rose', 'Flanagan', '1928-11-19'::date, '1999-12-01'::date, 'A-15-013'),
    ('Teresa', 'Henry', '1949-06-04'::date, '2017-10-25'::date, 'A-17-030'),
    ('Noel', 'Brennan', '1947-02-18'::date, '2016-11-07'::date, 'A-09-001'),
    ('Aaron', 'Moran', '1955-09-03'::date, '2021-04-14'::date, 'A-05-032'),
    ('Eileen', 'Ward', '1939-05-14'::date, '2012-02-10'::date, 'B-01-001'),
    ('Martin', 'Sweeney', '1946-09-22'::date, '2018-12-04'::date, 'B-08-012'),
    ('Grace', 'Nolan', '1951-04-03'::date, '2020-06-19'::date, 'B-14-024'),
    ('Peter', 'Burns', '1934-01-28'::date, '2007-08-15'::date, 'B-20-032')
),
inserted_people as (
  insert into public.people (
    given_names,
    family_name,
    date_of_birth,
    date_of_death,
    biography,
    status
  )
  select
    r.given_names,
    r.family_name,
    r.date_of_birth,
    r.date_of_death,
    'Imported demo record from the original GraveGuide Sligo prototype.',
    'published'
  from record_seed r
  where not exists (
    select 1
    from public.people p
    where p.given_names = r.given_names
    and p.family_name = r.family_name
    and p.date_of_death = r.date_of_death
  )
  returning id, given_names, family_name, date_of_death
)
insert into public.burials (
  person_id,
  plot_id,
  burial_date,
  source_notes,
  status
)
select
  p.id,
  gp.id,
  r.date_of_death,
  'Imported demo burial from the original GraveGuide Sligo prototype.',
  'published'
from record_seed r
join public.people p
  on p.given_names = r.given_names
  and p.family_name = r.family_name
  and p.date_of_death = r.date_of_death
join public.cemeteries c on c.slug = 'sligo-town-cemetery'
join public.grave_plots gp on gp.cemetery_id = c.id and gp.plot_reference = r.plot_reference
on conflict (person_id, plot_id) do update set
  burial_date = excluded.burial_date,
  source_notes = excluded.source_notes,
  status = excluded.status;
