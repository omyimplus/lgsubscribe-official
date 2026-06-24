-- เนื้อหาหน้าสมัคร LP: สไลด์รูป (สูงสุด 3) + YouTube

create table if not exists public.lp_careers_page (
  id               smallint primary key default 1 check (id = 1),
  slide_image_urls text[] not null default '{}',
  youtube_url      text,
  video_id         text,
  video_title      text not null default 'วิดีโอ Lifestyle Planner',
  updated_at       timestamptz not null default now()
);

insert into public.lp_careers_page (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists lp_careers_page_set_updated_at on public.lp_careers_page;
create trigger lp_careers_page_set_updated_at
  before update on public.lp_careers_page
  for each row execute function public.set_updated_at();

alter table public.lp_careers_page enable row level security;

drop policy if exists "lp_careers_page_select_all" on public.lp_careers_page;
create policy "lp_careers_page_select_all"
  on public.lp_careers_page for select
  using (true);

drop policy if exists "lp_careers_page_all_authenticated" on public.lp_careers_page;
create policy "lp_careers_page_all_authenticated"
  on public.lp_careers_page for all
  to authenticated
  using (true)
  with check (true);
