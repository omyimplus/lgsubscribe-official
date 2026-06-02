-- กลุ่มสินค้า (การ์ด PLP 1 ใบ = หลาย SKU/ขนาด)
create table if not exists public.product_groups (
  id           uuid primary key default gen_random_uuid(),
  group_key    text not null unique,
  display_name text not null,
  category_id  uuid not null references public.categories (id) on delete restrict,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists product_groups_category_id_idx on public.product_groups (category_id);
create index if not exists product_groups_group_key_idx on public.product_groups (group_key);

drop trigger if exists product_groups_set_updated_at on public.product_groups;
create trigger product_groups_set_updated_at
  before update on public.product_groups
  for each row execute function public.set_updated_at();

alter table public.products
  add column if not exists group_id uuid references public.product_groups (id) on delete set null,
  add column if not exists variant_label text,
  add column if not exists variant_sort integer;

create index if not exists products_group_id_idx on public.products (group_id);

alter table public.import_products
  add column if not exists variant_group_key text,
  add column if not exists variant_label text,
  add column if not exists variant_sort integer;

alter table public.product_groups enable row level security;

drop policy if exists "product_groups_all_authenticated" on public.product_groups;
create policy "product_groups_all_authenticated"
  on public.product_groups for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "product_groups_select_active" on public.product_groups;
create policy "product_groups_select_active"
  on public.product_groups for select
  using (is_active = true);

-- นำขึ้น Products + ผูก product_groups (เรียก ensureProductGroupsFromImportBatch ก่อน RPC นี้)
create or replace function public.promote_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
as $$
declare
  inserted_count integer := 0;
  updated_count integer := 0;
begin
  if not exists (
    select 1
    from public.import_batches
    where id = p_batch_id and status = 'draft'
  ) then
    raise exception 'batch not found or not draft';
  end if;

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
    is_active,
    group_id,
    variant_label,
    variant_sort
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
    ip.is_active,
    pg.id,
    ip.variant_label,
    ip.variant_sort
  from public.import_products ip
  left join public.product_groups pg on pg.group_key = ip.variant_group_key
  where ip.batch_id = p_batch_id
    and not exists (
      select 1 from public.products p where p.sku = ip.sku
    );

  get diagnostics inserted_count = row_count;

  update public.products p
  set
    category_id = ip.category_id,
    name = ip.name,
    headline = ip.headline,
    image_url = ip.image_url,
    image_urls = ip.image_urls,
    base_price = ip.base_price,
    full_price = ip.full_price,
    price_range = ip.price_range,
    subscription_note = ip.subscription_note,
    purchase_only_label = ip.purchase_only_label,
    purchase_only_url = ip.purchase_only_url,
    discount_type = ip.discount_type,
    discount_value = ip.discount_value,
    service_self_clean = ip.service_self_clean,
    service_technician = ip.service_technician,
    service_months = ip.service_months,
    installment_months = ip.installment_months,
    warranty_years = ip.warranty_years,
    sort_order = ip.sort_order,
    is_active = ip.is_active,
    group_id = pg.id,
    variant_label = ip.variant_label,
    variant_sort = ip.variant_sort,
    updated_at = now()
  from public.import_products ip
  left join public.product_groups pg on pg.group_key = ip.variant_group_key
  where ip.batch_id = p_batch_id
    and p.sku = ip.sku;

  get diagnostics updated_count = row_count;

  update public.import_batches
  set status = 'promoted', promoted_at = now()
  where id = p_batch_id;

  delete from public.import_products where batch_id = p_batch_id;

  return jsonb_build_object(
    'inserted', inserted_count,
    'updated', updated_count,
    'promoted_batch_id', p_batch_id
  );
end;
$$;
