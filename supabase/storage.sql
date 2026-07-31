-- Storage bucket and policies for homework attachments.
-- Run this after supabase/schema.sql, or whenever storage needs to be created.

insert into storage.buckets (id, name, public)
values ('homework-files', 'homework-files', false)
on conflict (id) do nothing;

drop policy if exists "Users can read their homework files" on storage.objects;
drop policy if exists "Users can upload their homework files" on storage.objects;
drop policy if exists "Users can update their homework files" on storage.objects;
drop policy if exists "Users can delete their homework files" on storage.objects;

create policy "Users can read their homework files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their homework files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their homework files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their homework files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
