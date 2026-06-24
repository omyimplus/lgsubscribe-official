-- Seed เมนูสินค้าตาม lg.com (ไม่รวม "มาใหม่! น่าสนใจ" และ "ติดต่อฝ่ายบริการ")

-- Main categories
insert into public.main_categories (name, slug, sort_order, is_active)
values
  ('ทีวี & Soundbars',           'tv-soundbars',      1, true),
  ('เครื่องใช้ไฟฟ้าภายในบ้าน',  'home-appliances',   2, true),
  ('ระบบปรับอากาศ',             'air-conditioning',  3, true),
  ('จอมอนิเตอร์',                'monitors',          4, true)
on conflict (slug) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();

-- ล้าง sub-categories เดิม (โครงสร้างเก่าไม่ตรง lg.com)
delete from public.categories;

-- Sub-categories
insert into public.categories (name, slug, main_category_id, sort_order, is_active)
select v.name, v.slug, mc.id, v.sort_order, true
from (values
  -- ทีวี & Soundbars
  ('ทีวี',           'television',       'tv-soundbars',     1),
  ('ลำโพง Soundbars',    'soundbar',         'tv-soundbars',     2),
  -- เครื่องใช้ไฟฟ้าภายในบ้าน
  ('เครื่องซักผ้า',       'washing-machine',  'home-appliances',  1),
  ('เครื่องอบผ้า',         'dryer',            'home-appliances',  2),
  ('ตู้ถนอมผ้า',           'styler',           'home-appliances',  3),
  ('ตู้เย็น',              'refrigerator',     'home-appliances',  4),
  ('เครื่องดูดฝุ่น',       'vacuum-cleaner',   'home-appliances',  5),
  ('เตาอบไมโครเวฟ',       'microwave-oven',   'home-appliances',  6),
  ('เครื่องล้างจาน',       'dishwasher',       'home-appliances',  7),
  ('เครื่องกรองน้ำ',       'water-purifier',   'home-appliances',  8),
  -- ระบบปรับอากาศ
  ('เครื่องปรับอากาศ',     'air-conditioner',  'air-conditioning', 1),
  ('เครื่องฟอกอากาศ',      'air-purifier',     'air-conditioning', 2),
  ('เครื่องลดความชื้น',    'dehumidifier',     'air-conditioning', 3),
  -- จอมอนิเตอร์
  ('จอมอนิเตอร์',          'monitor',          'monitors',         1)
) as v(name, slug, main_slug, sort_order)
join public.main_categories mc on mc.slug = v.main_slug
on conflict (slug) do update set
  name              = excluded.name,
  main_category_id  = excluded.main_category_id,
  sort_order        = excluded.sort_order,
  is_active         = true,
  updated_at        = now();
