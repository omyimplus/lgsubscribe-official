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
