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
