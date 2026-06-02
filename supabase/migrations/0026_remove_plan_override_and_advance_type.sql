-- Remove unused override/type fields.
-- Totals are always computed from billing tiers.
-- Deposit is numeric only via advance_amount.

alter table public.product_plans
  drop column if exists promo_lump_sum_override,
  drop column if exists advance_payment_type;
