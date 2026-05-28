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
