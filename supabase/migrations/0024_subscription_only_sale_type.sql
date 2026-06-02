-- Remove outright/combo support from plans: keep subscription only

update public.product_plans
set sale_type = 'subscription'
where sale_type <> 'subscription';

alter table public.product_plans
  drop constraint if exists product_plans_sale_type_check;

alter table public.product_plans
  add constraint product_plans_sale_type_check
  check (sale_type = 'subscription');
