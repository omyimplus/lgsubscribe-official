-- Policy code is optional and promo_price is no longer manually entered.

alter table public.product_plans
  alter column policy_code drop not null;

drop index if exists product_plans_policy_code_per_product_idx;

update public.product_plans
set promo_price = null
where promo_price is not null;
