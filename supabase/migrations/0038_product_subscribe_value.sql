-- รูป + แท็บเปรียบเทียบมูลค่า Subscribe บนหน้ารายละเอียดสินค้า

alter table public.products
  add column if not exists subscribe_benefits_image_url text,
  add column if not exists subscribe_value_tabs jsonb not null default '[]'::jsonb;

comment on column public.products.subscribe_benefits_image_url is
  'รูป section «Subscribe ได้อะไรมากกว่าที่คุณคิด»';
comment on column public.products.subscribe_value_tabs is
  'แท็บมูลค่า Subscribe [{ text, price }] — 1 แท็บต่อ 1 รายการ';
