insert into public.cemeteries (
  slug,
  name,
  town,
  county,
  country,
  description,
  latitude,
  longitude,
  status
) values (
  'sligo-town-cemetery',
  'Sligo Town Cemetery',
  'Sligo',
  'Sligo',
  'Ireland',
  'Initial cemetery record for GraveGuide setup and map calibration.',
  54.2766,
  -8.4761,
  'published'
) on conflict (slug) do update set
  name = excluded.name,
  town = excluded.town,
  county = excluded.county,
  country = excluded.country,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  status = excluded.status;

insert into public.cemetery_blocks (cemetery_id, code, name, sort_order)
select id, 'A', 'Block A', 1
from public.cemeteries
where slug = 'sligo-town-cemetery'
on conflict (cemetery_id, code) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.grave_plots (
  cemetery_id,
  block_id,
  plot_reference,
  row_label,
  plot_number,
  status
)
select c.id, b.id, 'A-001', 'A', '001', 'published'
from public.cemeteries c
join public.cemetery_blocks b on b.cemetery_id = c.id and b.code = 'A'
where c.slug = 'sligo-town-cemetery'
on conflict (cemetery_id, plot_reference) do update set
  block_id = excluded.block_id,
  row_label = excluded.row_label,
  plot_number = excluded.plot_number,
  status = excluded.status;
