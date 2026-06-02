-- โปรโมชั่น + รายการ SKU ที่แสดงบนหน้าบ้าน (เลือกทีละ product_id)

create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  slug         text        not null unique,
  description  text,
  headline     text,
  image_url    text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  status       text        not null default 'draft'
    check (status in ('draft', 'published')),
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists promotions_slug_idx on public.promotions (slug);
create index if not exists promotions_status_idx on public.promotions (status, is_active);
create index if not exists promotions_sort_order_idx on public.promotions (sort_order);

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  sort_order   integer not null default 0,
  primary key (promotion_id, product_id)
);

create index if not exists promotion_products_product_id_idx
  on public.promotion_products (product_id);

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

drop policy if exists "promotions_select_published" on public.promotions;
create policy "promotions_select_published"
  on public.promotions for select
  using (status = 'published' and is_active = true);

drop policy if exists "promotions_all_authenticated" on public.promotions;
create policy "promotions_all_authenticated"
  on public.promotions for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "promotion_products_select_published" on public.promotion_products;
create policy "promotion_products_select_published"
  on public.promotion_products for select
  using (
    exists (
      select 1 from public.promotions p
      where p.id = promotion_id
        and p.status = 'published'
        and p.is_active = true
    )
  );

drop policy if exists "promotion_products_all_authenticated" on public.promotion_products;
create policy "promotion_products_all_authenticated"
  on public.promotion_products for all
  to authenticated
  using (true)
  with check (true);
