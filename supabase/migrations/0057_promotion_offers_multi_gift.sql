-- โปรโมชั่น v2: แถวละชิ้น (สินค้าซ้ำได้) + ของแถมหลายชิ้น + ราคาชุดเดียว

alter table public.promotion_products
  add column if not exists id uuid default gen_random_uuid();

update public.promotion_products
set id = gen_random_uuid()
where id is null;

alter table public.promotion_products
  alter column id set not null;

alter table public.promotion_products
  add column if not exists installment_monthly numeric(12, 2)
    check (installment_monthly is null or installment_monthly >= 0),
  add column if not exists installment_total numeric(12, 2)
    check (installment_total is null or installment_total >= 0);

-- ย้ายราคาเดิม (ถ้ามีคอลัมน์จาก 0056)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promotion_products'
      and column_name = 'price_without_gift_monthly'
  ) then
    update public.promotion_products
    set
      installment_monthly = coalesce(installment_monthly, price_without_gift_monthly, price_with_gift_monthly),
      installment_total = coalesce(installment_total, price_without_gift_total, price_with_gift_total)
    where installment_monthly is null
       or installment_total is null;
  end if;
end $$;

create table if not exists public.promotion_offer_gifts (
  id           uuid primary key default gen_random_uuid(),
  offer_id     uuid not null,
  product_id   uuid not null references public.products (id) on delete cascade,
  label        text,
  sort_order   integer not null default 0
);

-- ย้ายของแถมเดิม (ชิ้นเดียว) ถ้ามี
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'promotion_products'
      and column_name = 'gift_product_id'
  ) then
    insert into public.promotion_offer_gifts (offer_id, product_id, label, sort_order)
    select pp.id, pp.gift_product_id, pp.gift_label, 0
    from public.promotion_products pp
    where pp.gift_product_id is not null
      and not exists (
        select 1 from public.promotion_offer_gifts g where g.offer_id = pp.id
      );
  end if;
end $$;

alter table public.promotion_products
  drop constraint if exists promotion_products_pkey;

alter table public.promotion_products
  add primary key (id);

create index if not exists promotion_products_promotion_id_idx
  on public.promotion_products (promotion_id);

alter table public.promotion_offer_gifts
  drop constraint if exists promotion_offer_gifts_offer_id_fkey;

alter table public.promotion_offer_gifts
  add constraint promotion_offer_gifts_offer_id_fkey
  foreign key (offer_id) references public.promotion_products (id) on delete cascade;

create index if not exists promotion_offer_gifts_offer_id_idx
  on public.promotion_offer_gifts (offer_id);

alter table public.promotion_products
  drop column if exists gift_product_id,
  drop column if exists gift_label,
  drop column if exists gift_description,
  drop column if exists price_with_gift_monthly,
  drop column if exists price_with_gift_total,
  drop column if exists price_with_gift_note,
  drop column if exists price_without_gift_monthly,
  drop column if exists price_without_gift_total,
  drop column if exists price_without_gift_note;

drop index if exists public.promotion_products_gift_product_id_idx;

alter table public.promotion_offer_gifts enable row level security;

drop policy if exists "promotion_offer_gifts_select_published" on public.promotion_offer_gifts;
create policy "promotion_offer_gifts_select_published"
  on public.promotion_offer_gifts for select
  using (
    exists (
      select 1
      from public.promotion_products pp
      join public.promotions p on p.id = pp.promotion_id
      where pp.id = offer_id
        and p.status = 'published'
        and p.is_active = true
    )
  );

drop policy if exists "promotion_offer_gifts_all_authenticated" on public.promotion_offer_gifts;
create policy "promotion_offer_gifts_all_authenticated"
  on public.promotion_offer_gifts for all
  to authenticated
  using (true)
  with check (true);
