-- =============================================================================
-- LG Subscribe — รวม migrations ทั้งโปรเจกต์ (รันบน Supabase ว่าง)
-- =============================================================================
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- หรือ: psql "$DATABASE_URL" -f supabase/ALL_MIGRATIONS.sql
--
-- คำเตือน:
--   • ใช้กับโปรเจกต์ Supabase ใหม่ / ยังไม่มี schema นี้
--   • ถ้ามีตารางเดิมแล้ว บางคำสั่งอาจ error (duplicate) — อย่ารันซ้ำทั้งไฟล์
--   • ลำดับตามไฟล์ 0001 → 0035 (35 ไฟล์)
--   • Regenerate: node scripts/build-all-migrations.mjs
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0001_categories.sql
-- -----------------------------------------------------------------------------

-- Categories table
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  icon         text,
  description  text,
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists categories_sort_order_idx on public.categories (sort_order);
create index if not exists categories_is_active_idx  on public.categories (is_active);

-- Auto update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.categories enable row level security;

-- ทุกคนอ่าน categories ที่ active ได้ (ใช้กับ frontend website)
drop policy if exists "categories_select_active" on public.categories;
create policy "categories_select_active"
  on public.categories for select
  using (is_active = true);

-- Authenticated users (admin) จัดการ categories ได้ทั้งหมด
-- หมายเหตุ: ถ้าต้องการแยก role admin/employee ค่อยเพิ่ม role check ภายหลัง
drop policy if exists "categories_all_authenticated" on public.categories;
create policy "categories_all_authenticated"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);


-- -----------------------------------------------------------------------------
-- 0002_storage_category_icons.sql
-- -----------------------------------------------------------------------------

-- Storage bucket สำหรับ category icons (public read)
insert into storage.buckets (id, name, public)
values ('category-icons', 'category-icons', true)
on conflict (id) do nothing;

-- Policies: ใครก็อ่านได้ (public bucket), authenticated upload/delete ได้
drop policy if exists "category-icons read" on storage.objects;
create policy "category-icons read"
  on storage.objects for select
  using (bucket_id = 'category-icons');

drop policy if exists "category-icons insert" on storage.objects;
create policy "category-icons insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-icons');

drop policy if exists "category-icons update" on storage.objects;
create policy "category-icons update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'category-icons')
  with check (bucket_id = 'category-icons');

drop policy if exists "category-icons delete" on storage.objects;
create policy "category-icons delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-icons');


-- -----------------------------------------------------------------------------
-- 0003_seed_categories.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 0004_main_categories.sql
-- -----------------------------------------------------------------------------

-- Main categories (กลุ่มเมนูระดับบน ตาม lg.com)
create table if not exists public.main_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists main_categories_sort_order_idx on public.main_categories (sort_order);

drop trigger if exists main_categories_set_updated_at on public.main_categories;
create trigger main_categories_set_updated_at
  before update on public.main_categories
  for each row execute function public.set_updated_at();

alter table public.main_categories enable row level security;

drop policy if exists "main_categories_select_active" on public.main_categories;
create policy "main_categories_select_active"
  on public.main_categories for select
  using (is_active = true);

drop policy if exists "main_categories_all_authenticated" on public.main_categories;
create policy "main_categories_all_authenticated"
  on public.main_categories for all
  to authenticated
  using (true)
  with check (true);

-- ผูก sub-category กับ main category
alter table public.categories
  add column if not exists main_category_id uuid references public.main_categories (id) on delete restrict;

create index if not exists categories_main_category_id_idx on public.categories (main_category_id);


-- -----------------------------------------------------------------------------
-- 0005_seed_lg_menu.sql
-- -----------------------------------------------------------------------------

-- Seed เมนูสินค้าตาม lg.com (ไม่รวม "มาใหม่! น่าสนใจ" และ "ติดต่อฝ่ายบริการ")

-- Main categories
insert into public.main_categories (name, slug, sort_order, is_active)
values
  ('ทีวี & Soundbars',           'tv-soundbars',      1, true),
  ('เครื่องใช้ไฟฟ้าภายในบ้าน',  'home-appliances',   2, true),
  ('ระบบปรับอากาศ',             'air-conditioning',  3, true),
  ('จอมอนิเตอร์',                'monitors',          4, true)
on conflict (slug) do update set
  name       = excluded.name,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();

-- ล้าง sub-categories เดิม (โครงสร้างเก่าไม่ตรง lg.com)
delete from public.categories;

-- Sub-categories
insert into public.categories (name, slug, main_category_id, sort_order, is_active)
select v.name, v.slug, mc.id, v.sort_order, true
from (values
  -- ทีวี & Soundbars
  ('โทรทัศน์',           'television',       'tv-soundbars',     1),
  ('ลำโพง Soundbars',    'soundbar',         'tv-soundbars',     2),
  -- เครื่องใช้ไฟฟ้าภายในบ้าน
  ('เครื่องซักผ้า',       'washing-machine',  'home-appliances',  1),
  ('เครื่องอบผ้า',         'dryer',            'home-appliances',  2),
  ('ตู้ถนอมผ้า',           'styler',           'home-appliances',  3),
  ('ตู้เย็น',              'refrigerator',     'home-appliances',  4),
  ('เครื่องดูดฝุ่น',       'vacuum-cleaner',   'home-appliances',  5),
  ('เตาอบไมโครเวฟ',       'microwave-oven',   'home-appliances',  6),
  ('เครื่องล้างจาน',       'dishwasher',       'home-appliances',  7),
  ('เครื่องกรองน้ำ',       'water-purifier',   'home-appliances',  8),
  -- ระบบปรับอากาศ
  ('เครื่องปรับอากาศ',     'air-conditioner',  'air-conditioning', 1),
  ('เครื่องฟอกอากาศ',      'air-purifier',     'air-conditioning', 2),
  ('เครื่องลดความชื้น',    'dehumidifier',     'air-conditioning', 3),
  -- จอมอนิเตอร์
  ('จอมอนิเตอร์',          'monitor',          'monitors',         1)
) as v(name, slug, main_slug, sort_order)
join public.main_categories mc on mc.slug = v.main_slug
on conflict (slug) do update set
  name              = excluded.name,
  main_category_id  = excluded.main_category_id,
  sort_order        = excluded.sort_order,
  is_active         = true,
  updated_at        = now();


-- -----------------------------------------------------------------------------
-- 0006_tags.sql
-- -----------------------------------------------------------------------------

-- Tags สำหรับป้ายสินค้า (ลดราคา, มาแรง, น่าสนใจ, มาใหม่! น่าสนใจ)
create table if not exists public.tags (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  color        text        not null default '#dc2626',
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists tags_sort_order_idx on public.tags (sort_order);
create index if not exists tags_is_active_idx  on public.tags (is_active);

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

alter table public.tags enable row level security;

drop policy if exists "tags_select_active" on public.tags;
create policy "tags_select_active"
  on public.tags for select
  using (is_active = true);

drop policy if exists "tags_all_authenticated" on public.tags;
create policy "tags_all_authenticated"
  on public.tags for all
  to authenticated
  using (true)
  with check (true);


-- -----------------------------------------------------------------------------
-- 0007_seed_tags.sql
-- -----------------------------------------------------------------------------

-- Seed tags ตาม PROJECT_SPEC
insert into public.tags (name, slug, color, sort_order, is_active)
values
  ('ลดราคา',              'sale',          '#dc2626', 1, true),
  ('มาแรง',               'hot',           '#ea580c', 2, true),
  ('น่าสนใจ',             'featured',      '#2563eb', 3, true),
  ('มาใหม่! น่าสนใจ',     'new-featured',  '#7c3aed', 4, true)
on conflict (slug) do update set
  name       = excluded.name,
  color      = excluded.color,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();


-- -----------------------------------------------------------------------------
-- 0008_products.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 0009_storage_product_images.sql
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images read" on storage.objects;
create policy "product-images read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images insert" on storage.objects;
create policy "product-images insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "product-images update" on storage.objects;
create policy "product-images update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "product-images delete" on storage.objects;
create policy "product-images delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');


-- -----------------------------------------------------------------------------
-- 0010_product_card_notes.sql
-- -----------------------------------------------------------------------------

-- ข้อความใต้ราคาบนการ์ดสินค้า (structured — ไม่ใช้ HTML editor)
alter table public.products
  add column if not exists subscription_note text,
  add column if not exists purchase_only_label text,
  add column if not exists purchase_only_url text;

comment on column public.products.subscription_note is 'บรรทัดใต้ราคา เช่น ส่วนลด 6 เดือนเท่านั้น';
comment on column public.products.purchase_only_label is 'ลิงก์ซื้อเฉพาะสินค้า เช่น หรือซื้อเฉพาะสินค้าเท่านั้น';
comment on column public.products.purchase_only_url is 'URL สำหรับ purchase_only_label';


-- -----------------------------------------------------------------------------
-- 0011_customer_profiles.sql
-- -----------------------------------------------------------------------------

-- Customer profiles for frontend website registration/contact.
create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text default '',
  phone text default '',
  line_id text default '',
  contact_note text default '',
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_customer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_customer_profiles_updated_at();

alter table public.customer_profiles enable row level security;

drop policy if exists "Customer select own profile" on public.customer_profiles;
create policy "Customer select own profile"
on public.customer_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Customer insert own profile" on public.customer_profiles;
create policy "Customer insert own profile"
on public.customer_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Customer update own profile" on public.customer_profiles;
create policy "Customer update own profile"
on public.customer_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 0012_product_detail_fields.sql
-- -----------------------------------------------------------------------------

alter table public.products
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists features text,
  add column if not exists specifications text;

update public.products
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (
    image_urls is null
    or image_urls = '[]'::jsonb
  );


-- -----------------------------------------------------------------------------
-- 0013_product_key_features.sql
-- -----------------------------------------------------------------------------

alter table public.products
  add column if not exists key_features text;


-- -----------------------------------------------------------------------------
-- 0014_product_faqs.sql
-- -----------------------------------------------------------------------------

alter table public.products
  add column if not exists faq_html text;

create table if not exists public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_faqs_product_id_idx on public.product_faqs(product_id);
create index if not exists product_faqs_sort_order_idx on public.product_faqs(sort_order);

drop trigger if exists product_faqs_set_updated_at on public.product_faqs;
create trigger product_faqs_set_updated_at
  before update on public.product_faqs
  for each row execute function public.set_updated_at();

alter table public.product_faqs enable row level security;

drop policy if exists "product_faqs_select" on public.product_faqs;
create policy "product_faqs_select"
  on public.product_faqs for select
  using (true);

drop policy if exists "product_faqs_all_authenticated" on public.product_faqs;
create policy "product_faqs_all_authenticated"
  on public.product_faqs for all
  to authenticated
  using (true)
  with check (true);


-- -----------------------------------------------------------------------------
-- 0015_drop_product_faqs.sql
-- -----------------------------------------------------------------------------

drop table if exists public.product_faqs cascade;


-- -----------------------------------------------------------------------------
-- 0016_import_batches.sql
-- -----------------------------------------------------------------------------

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

  delete from public.product_tags
  where product_id in (select id from public.products);

  delete from public.products
  where id is not null;

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


-- -----------------------------------------------------------------------------
-- 0017_promote_import_batch_safe_delete.sql
-- -----------------------------------------------------------------------------

-- Supabase บังคับ DELETE ต้องมี WHERE — แก้ promote_import_batch ให้ลบ products แบบ replace ได้

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

  delete from public.product_tags
  where product_id in (select id from public.products);

  delete from public.products
  where id is not null;

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

  delete from public.import_products where batch_id = p_batch_id;
  delete from public.import_batches where status = 'draft' and id <> p_batch_id;

  return jsonb_build_object('inserted', inserted_count, 'promoted_batch_id', p_batch_id);
end;
$$;


-- -----------------------------------------------------------------------------
-- 0018_promote_import_batch_merge.sql
-- -----------------------------------------------------------------------------

-- Promote แบบผสานตาม SKU: ไม่ลบ products ทั้งหมด
-- สินค้าใหม่ → insert ครบทุก field รวม HTML
-- สินค้าเดิม → อัปเดตเฉพาะ sync field (ราคา/รูป/หัวข้อ) ไม่ทับ content ที่ human เช็คแล้ว

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
    updated_at = now()
  from public.import_products ip
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


-- -----------------------------------------------------------------------------
-- 0019_product_groups.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 0020_product_group_admin.sql
-- -----------------------------------------------------------------------------

-- Admin-managed product groups: lock manual assignments from import promote

alter table public.products
  add column if not exists group_id_locked boolean not null default false;

comment on column public.products.group_id_locked is
  'When true, promote_import_batch will not overwrite group_id, variant_label, or variant_sort on existing SKUs.';

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
    group_id = case when p.group_id_locked then p.group_id else pg.id end,
    variant_label = case when p.group_id_locked then p.variant_label else ip.variant_label end,
    variant_sort = case when p.group_id_locked then p.variant_sort else ip.variant_sort end,
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


-- -----------------------------------------------------------------------------
-- 0021_promotions.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 0022_subscription_inquiries.sql
-- -----------------------------------------------------------------------------

-- คำขอสนใจผ่อน / Subscribe (ลูกค้า login หรือ guest กรอกติดต่อเอง)

create table if not exists public.subscription_inquiries (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customer_profiles (id) on delete set null,
  contact_name    text not null,
  contact_phone   text not null,
  contact_line_id text default '',
  contact_note    text default '',
  items           jsonb not null default '[]'::jsonb,
  status          text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists subscription_inquiries_status_idx
  on public.subscription_inquiries (status, created_at desc);

create index if not exists subscription_inquiries_customer_id_idx
  on public.subscription_inquiries (customer_id);

drop trigger if exists subscription_inquiries_set_updated_at on public.subscription_inquiries;
create trigger subscription_inquiries_set_updated_at
  before update on public.subscription_inquiries
  for each row execute function public.set_updated_at();

alter table public.subscription_inquiries enable row level security;

-- อ่าน/เขียนผ่าน service role API เท่านั้น (ไม่ expose ตรงจาก client)


-- -----------------------------------------------------------------------------
-- 0023_product_plans.sql
-- -----------------------------------------------------------------------------

-- แผนสัญญา (Plan) ต่อ SKU + ช่วงบิลรายเดือน — source of truth หน้าร้าน (Phase 1)

create table if not exists public.product_plans (
  id                       uuid primary key default gen_random_uuid(),
  product_id               uuid not null references public.products (id) on delete cascade,
  policy_code              text not null,
  contract_label           text not null,
  contract_years           integer not null check (contract_years > 0),
  contract_months          integer not null check (contract_months > 0),
  service_mode             text not null check (service_mode in ('visit', 'self', 'none')),
  service_interval_months  integer check (service_interval_months is null or service_interval_months > 0),
  sale_type                text not null default 'subscription'
    check (sale_type in ('subscription', 'outright', 'combo')),
  list_price               numeric(12, 2),
  promo_price              numeric(12, 2),
  promo_lump_sum_override  numeric(12, 2),
  advance_payment_type     text,
  advance_amount           numeric(12, 2),
  promo_period_start       date,
  promo_period_end         date,
  is_default               boolean not null default false,
  is_active                boolean not null default true,
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists product_plans_product_id_idx on public.product_plans (product_id);
create index if not exists product_plans_sort_order_idx on public.product_plans (product_id, sort_order);
create index if not exists product_plans_active_idx on public.product_plans (product_id, is_active);

create unique index if not exists product_plans_policy_code_per_product_idx
  on public.product_plans (product_id, policy_code);

create unique index if not exists product_plans_contract_service_per_product_idx
  on public.product_plans (product_id, contract_label, service_mode);

create unique index if not exists product_plans_one_default_per_product_idx
  on public.product_plans (product_id)
  where is_default = true;

drop trigger if exists product_plans_set_updated_at on public.product_plans;
create trigger product_plans_set_updated_at
  before update on public.product_plans
  for each row execute function public.set_updated_at();

create table if not exists public.plan_billing_tiers (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.product_plans (id) on delete cascade,
  bill_from      integer not null check (bill_from >= 1),
  bill_to        integer not null check (bill_to >= bill_from),
  monthly_price  numeric(12, 2) not null check (monthly_price >= 0),
  note           text,
  sort_order     integer not null default 0
);

create index if not exists plan_billing_tiers_plan_id_idx on public.plan_billing_tiers (plan_id);
create index if not exists plan_billing_tiers_sort_order_idx on public.plan_billing_tiers (plan_id, sort_order);

alter table public.products
  add column if not exists default_plan_id uuid,
  add column if not exists plans_locked boolean not null default false;

alter table public.products
  drop constraint if exists products_default_plan_id_fkey;

alter table public.products
  add constraint products_default_plan_id_fkey
  foreign key (default_plan_id) references public.product_plans (id) on delete set null;

create index if not exists products_default_plan_id_idx on public.products (default_plan_id);

alter table public.product_plans enable row level security;
alter table public.plan_billing_tiers enable row level security;

drop policy if exists "product_plans_select_public" on public.product_plans;
create policy "product_plans_select_public"
  on public.product_plans for select
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_id
        and p.status = 'published'
        and p.is_active = true
    )
  );

drop policy if exists "product_plans_all_authenticated" on public.product_plans;
create policy "product_plans_all_authenticated"
  on public.product_plans for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "plan_billing_tiers_select_public" on public.plan_billing_tiers;
create policy "plan_billing_tiers_select_public"
  on public.plan_billing_tiers for select
  using (
    exists (
      select 1
      from public.product_plans pl
      join public.products p on p.id = pl.product_id
      where pl.id = plan_id
        and pl.is_active = true
        and p.status = 'published'
        and p.is_active = true
    )
  );

drop policy if exists "plan_billing_tiers_all_authenticated" on public.plan_billing_tiers;
create policy "plan_billing_tiers_all_authenticated"
  on public.plan_billing_tiers for all
  to authenticated
  using (true)
  with check (true);


-- -----------------------------------------------------------------------------
-- 0024_subscription_only_sale_type.sql
-- -----------------------------------------------------------------------------

-- Remove outright/combo support from plans: keep subscription only

update public.product_plans
set sale_type = 'subscription'
where sale_type <> 'subscription';

alter table public.product_plans
  drop constraint if exists product_plans_sale_type_check;

alter table public.product_plans
  add constraint product_plans_sale_type_check
  check (sale_type = 'subscription');


-- -----------------------------------------------------------------------------
-- 0025_optional_policy_drop_promo_price_input.sql
-- -----------------------------------------------------------------------------

-- Policy code is optional and promo_price is no longer manually entered.

alter table public.product_plans
  alter column policy_code drop not null;

drop index if exists product_plans_policy_code_per_product_idx;

update public.product_plans
set promo_price = null
where promo_price is not null;


-- -----------------------------------------------------------------------------
-- 0026_remove_plan_override_and_advance_type.sql
-- -----------------------------------------------------------------------------

-- Remove unused override/type fields.
-- Totals are always computed from billing tiers.
-- Deposit is numeric only via advance_amount.

alter table public.product_plans
  drop column if exists promo_lump_sum_override,
  drop column if exists advance_payment_type;


-- -----------------------------------------------------------------------------
-- 0027_add_advance_note_to_product_plans.sql
-- -----------------------------------------------------------------------------

-- Deposit note for storefront/admin display

alter table public.product_plans
  add column if not exists advance_note text;


-- -----------------------------------------------------------------------------
-- 0028_subscription_inquiry_contact_profile.sql
-- -----------------------------------------------------------------------------

-- ฟอร์มติดต่อแบบบุคคลธรรมดา / นิติบุคคล

alter table public.subscription_inquiries
  add column if not exists applicant_type text not null default 'individual'
    check (applicant_type in ('individual', 'corporate'));

alter table public.subscription_inquiries
  add column if not exists contact_profile jsonb not null default '{}'::jsonb;

create index if not exists subscription_inquiries_applicant_type_idx
  on public.subscription_inquiries (applicant_type, created_at desc);


-- -----------------------------------------------------------------------------
-- 0029_combo_programs.sql
-- -----------------------------------------------------------------------------

-- Combo discount programs (order-level multi-item discount)
-- กฎคงที่ฝั่งแอป: บิล combo มีผลตั้งแต่บิล 2 · defer_rate · ทุกสินค้า publish

create table if not exists public.combo_programs (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  status            text not null default 'draft'
    check (status in ('draft', 'published')),
  customer_segment  text not null default 'new'
    check (customer_segment in ('new', 'existing')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists combo_programs_status_idx
  on public.combo_programs (status, is_active, customer_segment);

create index if not exists combo_programs_dates_idx
  on public.combo_programs (starts_at, ends_at);

drop trigger if exists combo_programs_set_updated_at on public.combo_programs;
create trigger combo_programs_set_updated_at
  before update on public.combo_programs
  for each row execute function public.set_updated_at();

create table if not exists public.combo_program_tiers (
  id                       uuid primary key default gen_random_uuid(),
  program_id               uuid not null references public.combo_programs (id) on delete cascade,
  min_items                integer not null check (min_items >= 1),
  max_items                integer check (max_items is null or max_items >= min_items),
  extra_discount_percent   numeric(6, 2) not null
    check (extra_discount_percent >= 0 and extra_discount_percent <= 100),
  sort_order               integer not null default 0,
  created_at               timestamptz not null default now(),
  unique (program_id, min_items)
);

create index if not exists combo_program_tiers_program_id_idx
  on public.combo_program_tiers (program_id, sort_order, min_items);

alter table public.combo_programs enable row level security;
alter table public.combo_program_tiers enable row level security;

-- อ่าน/เขียนผ่าน service role API เท่านั้น


-- -----------------------------------------------------------------------------
-- 0030_combo_programs_slim.sql
-- -----------------------------------------------------------------------------

-- ถ้ารัน 0029 แบบเก่า (มี effective_from_bill, discount_mode, combo_program_products) ให้ย่อ schema

drop table if exists public.combo_program_products;

alter table public.combo_programs
  drop column if exists effective_from_bill;

alter table public.combo_programs
  drop column if exists discount_mode;


-- -----------------------------------------------------------------------------
-- 0031_inquiry_combo_snapshot.sql
-- -----------------------------------------------------------------------------

-- เก็บ segment + ผลคำนวณ combo ตอนส่งคำขอ (คำนวณฝั่ง server)

alter table public.subscription_inquiries
  add column if not exists combo_customer_segment text
    check (combo_customer_segment is null or combo_customer_segment in ('new', 'existing'));

alter table public.subscription_inquiries
  add column if not exists combo_snapshot jsonb;


-- -----------------------------------------------------------------------------
-- 0032_drop_recommended_tag.sql
-- -----------------------------------------------------------------------------

-- ลบแท็ก slug recommended ที่เคย seed ผิด (ใช้ home-featured / product_tags อย่างเดียว)
do $$
declare
  old_id uuid;
  new_id uuid;
begin
  select id into new_id from public.tags where slug = 'home-featured' limit 1;
  select id into old_id from public.tags where slug = 'recommended' and id is distinct from new_id limit 1;

  if old_id is null then
    return;
  end if;

  if new_id is not null then
    insert into public.product_tags (product_id, tag_id)
    select pt.product_id, new_id
    from public.product_tags pt
    where pt.tag_id = old_id
    on conflict do nothing;

    delete from public.product_tags where tag_id = old_id;
  end if;

  delete from public.tags where id = old_id;
end $$;


-- -----------------------------------------------------------------------------
-- 0033_articles.sql
-- -----------------------------------------------------------------------------

-- บทความ CMS (หน้าร้าน + แสดงบนหน้าแรก)

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        not null unique,
  category        text        not null default 'knowledge'
    check (category in ('why-subscribe', 'how-to-order', 'knowledge')),
  excerpt         text,
  body_html       text,
  cover_image_url text,
  status          text        not null default 'draft'
    check (status in ('draft', 'published')),
  is_active       boolean     not null default true,
  is_featured     boolean     not null default false,
  sort_order      integer     not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists articles_status_idx on public.articles (status, is_active);
create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_featured_idx on public.articles (is_featured, sort_order);

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published"
  on public.articles for select
  using (status = 'published' and is_active = true);

drop policy if exists "articles_all_authenticated" on public.articles;
create policy "articles_all_authenticated"
  on public.articles for all
  to authenticated
  using (true)
  with check (true);


-- -----------------------------------------------------------------------------
-- 0034_faq_items.sql
-- -----------------------------------------------------------------------------

-- FAQ แยกจากบทความ — แต่ละแถว = 1 แท็บ (เปิด/ปิดได้)

create table if not exists public.faq_items (
  id          uuid primary key default gen_random_uuid(),
  tab_title   text        not null,
  body_html   text,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists faq_items_sort_order_idx on public.faq_items (sort_order);
create index if not exists faq_items_active_idx on public.faq_items (is_active);

drop trigger if exists faq_items_set_updated_at on public.faq_items;
create trigger faq_items_set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();

alter table public.faq_items enable row level security;

drop policy if exists "faq_items_select_active" on public.faq_items;
create policy "faq_items_select_active"
  on public.faq_items for select
  using (is_active = true);

drop policy if exists "faq_items_all_authenticated" on public.faq_items;
create policy "faq_items_all_authenticated"
  on public.faq_items for all
  to authenticated
  using (true)
  with check (true);

-- ย้ายบทความหมวด faq (ถ้ามี) มาเป็นแท็บ แล้วลบออกจาก articles
do $$
declare
  r record;
begin
  for r in
    select title, body_html, sort_order, status, is_active
    from public.articles
    where category = 'faq'
  loop
    insert into public.faq_items (tab_title, body_html, sort_order, is_active)
    values (
      r.title,
      r.body_html,
      r.sort_order,
      r.status = 'published' and r.is_active
    );
  end loop;

  delete from public.articles where category = 'faq';
end $$;

alter table public.articles drop constraint if exists articles_category_check;

alter table public.articles add constraint articles_category_check
  check (category in ('why-subscribe', 'how-to-order', 'knowledge'));


-- -----------------------------------------------------------------------------
-- 0035_home_featured_tag.sql
-- -----------------------------------------------------------------------------

-- Tag สินค้าแนะนำ (ชื่อใน admin) สำหรับ slider หน้าแรก
insert into public.tags (name, slug, color, sort_order, is_active)
values
  ('สินค้าแนะนำ', 'home-featured', '#ea1917', 5, true)
on conflict (slug) do update set
  name       = excluded.name,
  color      = excluded.color,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active,
  updated_at = now();


-- -----------------------------------------------------------------------------
-- 0043_drop_product_plans_contract_service_unique.sql
-- -----------------------------------------------------------------------------

drop index if exists public.product_plans_contract_service_per_product_idx;

