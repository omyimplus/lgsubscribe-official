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
