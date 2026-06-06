-- ระดับเสียงเริ่มต้นเมื่อ autoplay (0–100, แนะนำ 30–50)

alter table public.home_youtube
  add column if not exists default_volume smallint not null default 40
  check (default_volume >= 0 and default_volume <= 100);
