create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'lg.com',
  status text not null default 'draft' check (status in ('draft', 'promoted', 'failed')),
  note text,
  created_at timestamptz not null default now(),
  promoted_at timestamptz
);

create table if not exists public.import_products (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_url text,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  sku text not null,
  headline text,
  description text,
  faq_html text,
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  key_features text,
  features text,
  specifications text,
  base_price numeric(12, 2) not null default 0,
  full_price numeric(12, 2),
  price_range text,
  subscription_note text,
  purchase_only_label text,
  purchase_only_url text,
  discount_type text check (discount_type in ('amount', 'percent')),
  discount_value numeric(12, 2),
  service_self_clean boolean not null default false,
  service_technician boolean not null default false,
  service_months integer,
  installment_months integer,
  warranty_years integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(batch_id, sku)
);

create index if not exists import_products_batch_id_idx on public.import_products(batch_id);
create index if not exists import_products_sku_idx on public.import_products(sku);

drop trigger if exists import_products_set_updated_at on public.import_products;
create trigger import_products_set_updated_at
  before update on public.import_products
  for each row execute function public.set_updated_at();

alter table public.import_batches enable row level security;
alter table public.import_products enable row level security;

drop policy if exists "import_batches_all_authenticated" on public.import_batches;
create policy "import_batches_all_authenticated"
  on public.import_batches for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "import_products_all_authenticated" on public.import_products;
create policy "import_products_all_authenticated"
  on public.import_products for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.promote_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
as $$
declare
  inserted_count integer := 0;
begin
  if not exists (
    select 1
    from public.import_batches
    where id = p_batch_id and status = 'draft'
  ) then
    raise exception 'batch not found or not draft';
  end if;

  delete from public.product_tags;
  delete from public.products;

  insert into public.products (
    category_id,
    name,
    sku,
    headline,
    description,
    faq_html,
    image_url,
    image_urls,
    key_features,
    features,
    specifications,
    base_price,
    full_price,
    price_range,
    subscription_note,
    purchase_only_label,
    purchase_only_url,
    discount_type,
    discount_value,
    discounted_price,
    discount_percent,
    service_self_clean,
    service_technician,
    service_months,
    installment_months,
    warranty_years,
    status,
    sort_order,
    is_active
  )
  select
    ip.category_id,
    ip.name,
    ip.sku,
    ip.headline,
    ip.description,
    ip.faq_html,
    ip.image_url,
    ip.image_urls,
    ip.key_features,
    ip.features,
    ip.specifications,
    ip.base_price,
    ip.full_price,
    ip.price_range,
    ip.subscription_note,
    ip.purchase_only_label,
    ip.purchase_only_url,
    ip.discount_type,
    ip.discount_value,
    null,
    null,
    ip.service_self_clean,
    ip.service_technician,
    ip.service_months,
    ip.installment_months,
    ip.warranty_years,
    'draft',
    ip.sort_order,
    ip.is_active
  from public.import_products ip
  where ip.batch_id = p_batch_id;

  get diagnostics inserted_count = row_count;

  update public.import_batches
  set status = 'promoted', promoted_at = now()
  where id = p_batch_id;

  -- remove moved drafts and any stale drafts
  delete from public.import_products where batch_id = p_batch_id;
  delete from public.import_batches where status = 'draft' and id <> p_batch_id;

  return jsonb_build_object('inserted', inserted_count, 'promoted_batch_id', p_batch_id);
end;
$$;
