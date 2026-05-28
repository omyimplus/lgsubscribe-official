-- Seed tags ตาม PROJECT_SPEC
insert into public.tags (name, slug, color, sort_order, is_active)
values
  ('ลดราคา',              'sale',          '#dc2626', 1, true),
  ('มาแรง',               'hot',           '#ea580c', 2, true),
  ('น่าสนใจ',             'featured',      '#2563eb', 3, true),
  ('มาใหม่! น่าสนใจ',     'new-featured',  '#7c3aed', 4, true)
on conflict (slug) do update set
  name       = excluded.name,
  color      = excluded.color,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();
