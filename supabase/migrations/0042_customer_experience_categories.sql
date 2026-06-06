-- ผูก Customer Experience กับหมวดสินค้า (แสดงบนหน้า PDP ตาม category)

create table if not exists public.customer_experience_categories (
  experience_id uuid not null references public.customer_experiences (id) on delete cascade,
  category_id   uuid not null references public.categories (id) on delete cascade,
  primary key (experience_id, category_id)
);

create index if not exists customer_experience_categories_category_idx
  on public.customer_experience_categories (category_id);

alter table public.customer_experience_categories enable row level security;

drop policy if exists "customer_experience_categories_select" on public.customer_experience_categories;
create policy "customer_experience_categories_select"
  on public.customer_experience_categories for select
  using (true);

drop policy if exists "customer_experience_categories_all_authenticated" on public.customer_experience_categories;
create policy "customer_experience_categories_all_authenticated"
  on public.customer_experience_categories for all
  to authenticated
  using (true)
  with check (true);
