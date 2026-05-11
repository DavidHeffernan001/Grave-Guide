do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
    and table_name = 'grave_plot_assignments'
  )
  and not exists (
    select 1 from pg_constraint
    where conname = 'grave_plot_assignments_burial_id_unique'
  ) then
    alter table public.grave_plot_assignments
    add constraint grave_plot_assignments_burial_id_unique unique (burial_id);
  end if;
end $$;
