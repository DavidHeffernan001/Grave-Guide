insert into public.people (
  given_names,
  family_name,
  date_of_birth,
  date_of_death,
  age_text,
  biography,
  status
) select
  'Mary',
  'O''Donnell',
  '1912-04-18',
  '1988-09-02',
  '76',
  'Sample published record for testing GraveGuide search before importing verified cemetery data.',
  'published'
where not exists (
  select 1
  from public.people
  where given_names = 'Mary'
  and family_name = 'O''Donnell'
  and date_of_death = '1988-09-02'
);

insert into public.burials (
  person_id,
  plot_id,
  burial_date,
  inscription,
  source_notes,
  status
)
select p.id, gp.id, '1988-09-05', 'In loving memory', 'Sample seed record for deployment testing.', 'published'
from public.people p
cross join public.grave_plots gp
join public.cemeteries c on c.id = gp.cemetery_id
where p.given_names = 'Mary'
and p.family_name = 'O''Donnell'
and c.slug = 'sligo-town-cemetery'
and gp.plot_reference = 'A-001'
limit 1
on conflict (person_id, plot_id) do update set
  burial_date = excluded.burial_date,
  inscription = excluded.inscription,
  source_notes = excluded.source_notes,
  status = excluded.status;
