-- กิจกรรม / ประสบการณ์ลูกค้า (แสดงบนหน้าแรก)

create table if not exists public.customer_experiences (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  image_url   text,
  event_date  date,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists customer_experiences_sort_idx
  on public.customer_experiences (sort_order);

create index if not exists customer_experiences_active_idx
  on public.customer_experiences (is_active, sort_order);

drop trigger if exists customer_experiences_set_updated_at on public.customer_experiences;
create trigger customer_experiences_set_updated_at
  before update on public.customer_experiences
  for each row execute function public.set_updated_at();

alter table public.customer_experiences enable row level security;

drop policy if exists "customer_experiences_select_active" on public.customer_experiences;
create policy "customer_experiences_select_active"
  on public.customer_experiences for select
  using (is_active = true);

drop policy if exists "customer_experiences_all_authenticated" on public.customer_experiences;
create policy "customer_experiences_all_authenticated"
  on public.customer_experiences for all
  to authenticated
  using (true)
  with check (true);
