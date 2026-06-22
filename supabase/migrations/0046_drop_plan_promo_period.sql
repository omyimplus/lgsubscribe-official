-- ยกเลิกช่วงโปรเริ่ม/โปรสิ้นสุดของแผนสัญญา

alter table public.product_plans
  drop column if exists promo_period_start,
  drop column if exists promo_period_end;
