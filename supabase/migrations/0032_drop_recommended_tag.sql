-- ลบแท็ก slug recommended ที่เคย seed ผิด (ใช้ home-featured / product_tags อย่างเดียว)
do $$
declare
  old_id uuid;
  new_id uuid;
begin
  select id into new_id from public.tags where slug = 'home-featured' limit 1;
  select id into old_id from public.tags where slug = 'recommended' and id is distinct from new_id limit 1;

  if old_id is null then
    return;
  end if;

  if new_id is not null then
    insert into public.product_tags (product_id, tag_id)
    select pt.product_id, new_id
    from public.product_tags pt
    where pt.tag_id = old_id
    on conflict do nothing;

    delete from public.product_tags where tag_id = old_id;
  end if;

  delete from public.tags where id = old_id;
end $$;
