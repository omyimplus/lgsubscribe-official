-- Deposit note for storefront/admin display

alter table public.product_plans
  add column if not exists advance_note text;
