-- โหมดชั้นส่วนลด combo: min_floor = ขั้นต่ำไม่จำกัดบน · stepped = หลายขั้นตามจำนวนชิ้น

alter table public.combo_programs
  add column if not exists tier_mode text not null default 'stepped'
  check (tier_mode in ('min_floor', 'stepped'));
