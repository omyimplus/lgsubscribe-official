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
