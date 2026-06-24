-- วิดีโอ LG Service Care ต่อหมวดสินค้า (หน้า /installment)

create table if not exists public.service_care_videos (
  slug         text primary key,
  sort_order   smallint not null,
  label_th     text not null,
  youtube_url  text,
  video_id     text,
  updated_at   timestamptz not null default now()
);

insert into public.service_care_videos (slug, sort_order, label_th) values
  ('washing-machine', 1, 'เครื่องซักผ้า'),
  ('refrigerator', 2, 'ตู้เย็น'),
  ('air-purifier', 3, 'เครื่องฟอกอากาศ'),
  ('water-purifier', 4, 'เครื่องกรองน้ำ'),
  ('vacuum-cleaner', 5, 'เครื่องดูดฝุ่น'),
  ('air-conditioner', 6, 'เครื่องปรับอากาศ'),
  ('styler', 7, 'ตู้ถนอมผ้า')
on conflict (slug) do nothing;

drop trigger if exists service_care_videos_set_updated_at on public.service_care_videos;
create trigger service_care_videos_set_updated_at
  before update on public.service_care_videos
  for each row execute function public.set_updated_at();

alter table public.service_care_videos enable row level security;

drop policy if exists "service_care_videos_select_all" on public.service_care_videos;
create policy "service_care_videos_select_all"
  on public.service_care_videos for select
  using (true);

drop policy if exists "service_care_videos_all_authenticated" on public.service_care_videos;
create policy "service_care_videos_all_authenticated"
  on public.service_care_videos for all
  to authenticated
  using (true)
  with check (true);
