-- เนื้อหาหน้าความน่าเชื่อถือ: HTML editor + สไลด์รูป (สูงสุด 3) + YouTube

create table if not exists public.trust_page (
  id               smallint primary key default 1 check (id = 1),
  body_html        text not null default '',
  slide_image_urls text[] not null default '{}',
  youtube_url      text,
  video_id         text,
  video_title      text not null default 'วิดีโอความน่าเชื่อถือ',
  updated_at       timestamptz not null default now()
);

insert into public.trust_page (id, body_html)
values (
  1,
  '<ul><li>รับประกันสินค้าตามเงื่อนไข LG ตลอดระยะสัญญา Subscribe</li><li>บริการซ่อมบำรุงและดูแลโดยทีมช่างมืออาชีพ</li><li>แบรนด์ LG — นวัตกรรมและคุณภาพที่ไว้ใจได้ในทุกบ้าน</li></ul>'
)
on conflict (id) do nothing;

drop trigger if exists trust_page_set_updated_at on public.trust_page;
create trigger trust_page_set_updated_at
  before update on public.trust_page
  for each row execute function public.set_updated_at();

alter table public.trust_page enable row level security;

drop policy if exists "trust_page_select_all" on public.trust_page;
create policy "trust_page_select_all"
  on public.trust_page for select
  using (true);

drop policy if exists "trust_page_all_authenticated" on public.trust_page;
create policy "trust_page_all_authenticated"
  on public.trust_page for all
  to authenticated
  using (true)
  with check (true);
