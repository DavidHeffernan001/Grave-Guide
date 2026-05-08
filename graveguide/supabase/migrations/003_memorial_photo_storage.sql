insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorial-photos',
  'memorial-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Published memorial photos are readable"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'memorial-photos'
  and exists (
    select 1
    from public.memorial_photos
    where memorial_photos.storage_path = storage.objects.name
    and (memorial_photos.status = 'published' or public.is_staff())
  )
);

create policy "Signed-in users can upload memorial photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memorial-photos'
  and owner = auth.uid()
);

create policy "Users can update their own uploaded objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'memorial-photos'
  and owner = auth.uid()
)
with check (
  bucket_id = 'memorial-photos'
  and owner = auth.uid()
);

create policy "Staff can manage memorial photo objects"
on storage.objects for all
to authenticated
using (
  bucket_id = 'memorial-photos'
  and public.is_staff()
)
with check (
  bucket_id = 'memorial-photos'
  and public.is_staff()
);
