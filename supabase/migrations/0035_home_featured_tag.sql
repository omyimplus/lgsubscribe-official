-- Tag สินค้าแนะนำ (ชื่อใน admin) สำหรับ slider หน้าแรก
insert into public.tags (name, slug, color, sort_order, is_active)
values
  ('สินค้าแนะนำ', 'home-featured', '#ea1917', 5, true)
on conflict (slug) do update set
  name       = excluded.name,
  color      = excluded.color,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();
