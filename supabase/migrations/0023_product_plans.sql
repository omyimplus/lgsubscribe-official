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
