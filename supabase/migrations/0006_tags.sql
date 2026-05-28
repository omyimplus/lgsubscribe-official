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
