-- ข้อความใต้ราคาบนการ์ดสินค้า (structured — ไม่ใช้ HTML editor)
alter table public.products
  add column if not exists subscription_note text,
  add column if not exists purchase_only_label text,
  add column if not exists purchase_only_url text;

comment on column public.products.subscription_note is 'บรรทัดใต้ราคา เช่น ส่วนลด 6 เดือนเท่านั้น';
comment on column public.products.purchase_only_label is 'ลิงก์ซื้อเฉพาะสินค้า เช่น หรือซื้อเฉพาะสินค้าเท่านั้น';
comment on column public.products.purchase_only_url is 'URL สำหรับ purchase_only_label';
