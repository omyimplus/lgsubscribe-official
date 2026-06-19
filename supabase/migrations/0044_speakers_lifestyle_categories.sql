-- หมวดใหม่สำหรับ import จาก URL LG (speakers, lifestyle-screens)

insert into public.categories (name, slug, main_category_id, sort_order, is_active)
select v.name, v.slug, mc.id, v.sort_order, true
from (values
  ('ลำโพง',           'speakers',           'tv-soundbars', 3),
  ('จอ Lifestyle',    'lifestyle-screens',  'tv-soundbars', 4)
) as v(name, slug, main_slug, sort_order)
join public.main_categories mc on mc.slug = v.main_slug
on conflict (slug) do update set
  name              = excluded.name,
  main_category_id  = excluded.main_category_id,
  sort_order        = excluded.sort_order,
  is_active         = true,
  updated_at        = now();
