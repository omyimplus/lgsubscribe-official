-- Supabase บังคับ DELETE ต้องมี WHERE — แก้ promote_import_batch ให้ลบ products แบบ replace ได้

create or replace function public.promote_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
as $$
declare
  inserted_count integer := 0;
begin
  if not exists (
    select 1
    from public.import_batches
    where id = p_batch_id and status = 'draft'
  ) then
    raise exception 'batch not found or not draft';
  end if;

  delete from public.product_tags
  where product_id in (select id from public.products);

  delete from public.products
  where id is not null;

  insert into public.products (
    category_id,
    name,
    sku,
    headline,
    description,
    faq_html,
    image_url,
    image_urls,
    key_features,
    features,
    specifications,
    base_price,
    full_price,
    price_range,
    subscription_note,
    purchase_only_label,
    purchase_only_url,
    discount_type,
    discount_value,
    discounted_price,
    discount_percent,
    service_self_clean,
    service_technician,
    service_months,
    installment_months,
    warranty_years,
    status,
    sort_order,
    is_active
  )
  select
    ip.category_id,
    ip.name,
    ip.sku,
    ip.headline,
    ip.description,
    ip.faq_html,
    ip.image_url,
    ip.image_urls,
    ip.key_features,
    ip.features,
    ip.specifications,
    ip.base_price,
    ip.full_price,
    ip.price_range,
    ip.subscription_note,
    ip.purchase_only_label,
    ip.purchase_only_url,
    ip.discount_type,
    ip.discount_value,
    null,
    null,
    ip.service_self_clean,
    ip.service_technician,
    ip.service_months,
    ip.installment_months,
    ip.warranty_years,
    'draft',
    ip.sort_order,
    ip.is_active
  from public.import_products ip
  where ip.batch_id = p_batch_id;

  get diagnostics inserted_count = row_count;

  update public.import_batches
  set status = 'promoted', promoted_at = now()
  where id = p_batch_id;

  delete from public.import_products where batch_id = p_batch_id;
  delete from public.import_batches where status = 'draft' and id <> p_batch_id;

  return jsonb_build_object('inserted', inserted_count, 'promoted_batch_id', p_batch_id);
end;
$$;
