-- autoplay วิดีโอ YouTube บนหน้าแรก (เปิด autoplay จะ mute อัตโนมัติ — ตาม policy เบราว์เซอร์)

alter table public.home_youtube
  add column if not exists autoplay boolean not null default false;
