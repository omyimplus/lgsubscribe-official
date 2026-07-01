-- ของแถมในแผนสัญญา (หลายชิ้นได้ ต่อแผน)

alter table public.product_plans
  add column if not exists has_gift boolean not null default false;

create table if not exists public.plan_gifts (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.product_plans (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  label        text,
  sort_order   integer not null default 0
);

create index if not exists plan_gifts_plan_id_idx
  on public.plan_gifts (plan_id);

alter table public.plan_gifts enable row level security;

drop policy if exists "plan_gifts_select_public" on public.plan_gifts;
create policy "plan_gifts_select_public"
  on public.plan_gifts for select
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

drop policy if exists "plan_gifts_all_authenticated" on public.plan_gifts;
create policy "plan_gifts_all_authenticated"
  on public.plan_gifts for all
  to authenticated
  using (true)
  with check (true);
