-- แหล่งคำขอ: จากตะกร้าสินค้า หรือฟอร์มลูกค้าองค์กร (ไม่มีรายการสินค้า)

alter table public.subscription_inquiries
  add column if not exists inquiry_source text not null default 'product_cart'
    check (inquiry_source in ('product_cart', 'corporate'));

create index if not exists subscription_inquiries_source_idx
  on public.subscription_inquiries (inquiry_source, created_at desc);
