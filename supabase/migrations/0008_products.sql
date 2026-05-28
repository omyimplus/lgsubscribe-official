-- Products
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid not null references public.categories (id) on delete restrict,
  name                 text not null,
  sku                  text not null unique,
  headline             text,
  description          text,
  image_url            text,
  base_price           numeric(12, 2) not null default 0,
  full_price           numeric(12, 2),
  price_range          text,
  discount_type        text check (discount_type in ('amount', 'percent')),
  discount_value       numeric(12, 2),
  discounted_price     numeric(12, 2),
  discount_percent     numeric(5, 2),
  service_self_clean   boolean not null default false,
  service_technician   boolean not null default false,
  service_months       integer,
  installment_months   integer,
  warranty_years       integer,
  status               text not null default 'draft'
    check (status in ('draft', 'published', 'pending')),
  sort_order           integer not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_sku_idx on public.products (sku);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Product ↔ Tags (many-to-many)
create table if not exists public.product_tags (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create index if not exists product_tags_tag_id_idx on public.product_tags (tag_id);

alter table public.products enable row level security;
alter table public.product_tags enable row level security;

drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (status = 'published' and is_active = true);

drop policy if exists "products_all_authenticated" on public.products;
create policy "products_all_authenticated"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "product_tags_select" on public.product_tags;
create policy "product_tags_select"
  on public.product_tags for select
  using (true);

drop policy if exists "product_tags_all_authenticated" on public.product_tags;
create policy "product_tags_all_authenticated"
  on public.product_tags for all
  to authenticated
  using (true)
  with check (true);
