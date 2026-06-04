-- บทความ CMS (หน้าร้าน + แสดงบนหน้าแรก)

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        not null unique,
  category        text        not null default 'knowledge'
    check (category in ('why-subscribe', 'how-to-order', 'knowledge')),
  excerpt         text,
  body_html       text,
  cover_image_url text,
  status          text        not null default 'draft'
    check (status in ('draft', 'published')),
  is_active       boolean     not null default true,
  is_featured     boolean     not null default false,
  sort_order      integer     not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists articles_status_idx on public.articles (status, is_active);
create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_featured_idx on public.articles (is_featured, sort_order);

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published"
  on public.articles for select
  using (status = 'published' and is_active = true);

drop policy if exists "articles_all_authenticated" on public.articles;
create policy "articles_all_authenticated"
  on public.articles for all
  to authenticated
  using (true)
  with check (true);
