-- รายการสินค้าในหน้าโปรโมชั่น: ราคาโชว์ + ของแถม (admin กำหนดเอง ไม่ผูก product_plans)

alter table public.promotion_products
  add column if not exists title_override text,
  add column if not exists description text,
  add column if not exists has_gift boolean not null default false,
  add column if not exists gift_product_id uuid references public.products (id) on delete set null,
  add column if not exists gift_label text,
  add column if not exists gift_description text,
  add column if not exists price_with_gift_monthly numeric(12, 2)
    check (price_with_gift_monthly is null or price_with_gift_monthly >= 0),
  add column if not exists price_with_gift_total numeric(12, 2)
    check (price_with_gift_total is null or price_with_gift_total >= 0),
  add column if not exists price_with_gift_note text,
  add column if not exists price_without_gift_monthly numeric(12, 2)
    check (price_without_gift_monthly is null or price_without_gift_monthly >= 0),
  add column if not exists price_without_gift_total numeric(12, 2)
    check (price_without_gift_total is null or price_without_gift_total >= 0),
  add column if not exists price_without_gift_note text;

create index if not exists promotion_products_gift_product_id_idx
  on public.promotion_products (gift_product_id)
  where gift_product_id is not null;
