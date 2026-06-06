-- วิดีโอ YouTube บนหน้าแรก (ตั้งค่าได้ 1 รายการ)

create table if not exists public.home_youtube (
  id           smallint primary key default 1 check (id = 1),
  youtube_url  text,
  video_id     text,
  title        text        not null default 'วิดีโอจาก LG Subscribe',
  is_active    boolean     not null default false,
  autoplay       boolean     not null default false,
  default_volume smallint    not null default 40 check (default_volume >= 0 and default_volume <= 100),
  updated_at     timestamptz not null default now()
);

insert into public.home_youtube (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists home_youtube_set_updated_at on public.home_youtube;
create trigger home_youtube_set_updated_at
  before update on public.home_youtube
  for each row execute function public.set_updated_at();

alter table public.home_youtube enable row level security;

drop policy if exists "home_youtube_select_active" on public.home_youtube;
create policy "home_youtube_select_active"
  on public.home_youtube for select
  using (is_active = true and video_id is not null and video_id <> '');

drop policy if exists "home_youtube_all_authenticated" on public.home_youtube;
create policy "home_youtube_all_authenticated"
  on public.home_youtube for all
  to authenticated
  using (true)
  with check (true);
