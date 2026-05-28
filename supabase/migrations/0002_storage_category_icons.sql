-- Storage bucket สำหรับ category icons (public read)
insert into storage.buckets (id, name, public)
values ('category-icons', 'category-icons', true)
on conflict (id) do nothing;

-- Policies: ใครก็อ่านได้ (public bucket), authenticated upload/delete ได้
drop policy if exists "category-icons read" on storage.objects;
create policy "category-icons read"
  on storage.objects for select
  using (bucket_id = 'category-icons');

drop policy if exists "category-icons insert" on storage.objects;
create policy "category-icons insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-icons');

drop policy if exists "category-icons update" on storage.objects;
create policy "category-icons update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'category-icons')
  with check (bucket_id = 'category-icons');

drop policy if exists "category-icons delete" on storage.objects;
create policy "category-icons delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-icons');
