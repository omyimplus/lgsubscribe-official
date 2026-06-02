-- ถ้ารัน 0029 แบบเก่า (มี effective_from_bill, discount_mode, combo_program_products) ให้ย่อ schema

drop table if exists public.combo_program_products;

alter table public.combo_programs
  drop column if exists effective_from_bill;

alter table public.combo_programs
  drop column if exists discount_mode;
