-- Seed หมวดหมู่สินค้าตาม PROJECT_SPEC (Frontend → สินค้าทั้งหมด)
-- ยกเว้น "มาใหม่! น่าสนใจ" (เป็น tag/curated section ไม่ใช่ category)

insert into public.categories (name, slug, sort_order, is_active)
values
  ('เครื่องซักผ้า',       'washing-machine',   1,  true),
  ('เครื่องอบผ้า',         'dryer',             2,  true),
  ('เครื่องกรองน้ำ',       'water-purifier',    3,  true),
  ('ตู้เย็น',              'refrigerator',      4,  true),
  ('ตู้แช่แข็ง',           'freezer',           5,  true),
  ('ทีวี',                 'tv',                6,  true),
  ('มอนิเตอร์',            'monitor',           7,  true),
  ('ตู้ถนอมผ้า',           'styler',            8,  true),
  ('เครื่องฟอกอากาศ',      'air-purifier',      9,  true),
  ('เครื่องล้างจาน',       'dishwasher',        10, true),
  ('เครื่องปรับอากาศ',     'air-conditioner',   11, true),
  ('เครื่องดูดฝุ่น',       'vacuum-cleaner',    12, true),
  ('เครื่องลดความชื้น',    'dehumidifier',      13, true),
  ('ลำโพงพกพา',            'portable-speaker',  14, true),
  ('ซาวด์บาร์',            'soundbar',          15, true),
  ('ไมโครเวฟ',             'microwave',         16, true)
on conflict (slug) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();
