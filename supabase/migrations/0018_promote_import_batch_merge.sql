-- Promote แบบผสานตาม SKU: ไม่ลบ products ทั้งหมด
-- สินค้าใหม่ → insert ครบทุก field รวม HTML
-- สินค้าเดิม → อัปเดตเฉพาะ sync field (ราคา/รูป/หัวข้อ) ไม่ทับ content ที่ human เช็คแล้ว

create or replace function public.promote_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
as $$
declare
  inserted_count integer := 0;
  updated_count integer := 0;
begin
  if not exists (
    select 1
    from public.import_batches
    where id = p_batch_id and status = 'draft'
  ) then
    raise exception 'batch not found or not draft';
  end if;

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
  where ip.batch_id = p_batch_id
    and not exists (
      select 1 from public.products p where p.sku = ip.sku
    );

  get diagnostics inserted_count = row_count;

  update public.products p
  set
    category_id = ip.category_id,
    name = ip.name,
    headline = ip.headline,
    image_url = ip.image_url,
    image_urls = ip.image_urls,
    base_price = ip.base_price,
    full_price = ip.full_price,
    price_range = ip.price_range,
    subscription_note = ip.subscription_note,
    purchase_only_label = ip.purchase_only_label,
    purchase_only_url = ip.purchase_only_url,
    discount_type = ip.discount_type,
    discount_value = ip.discount_value,
    service_self_clean = ip.service_self_clean,
    service_technician = ip.service_technician,
    service_months = ip.service_months,
    installment_months = ip.installment_months,
    warranty_years = ip.warranty_years,
    sort_order = ip.sort_order,
    is_active = ip.is_active,
    updated_at = now()
  from public.import_products ip
  where ip.batch_id = p_batch_id
    and p.sku = ip.sku;

  get diagnostics updated_count = row_count;

  update public.import_batches
  set status = 'promoted', promoted_at = now()
  where id = p_batch_id;

  delete from public.import_products where batch_id = p_batch_id;

  return jsonb_build_object(
    'inserted', inserted_count,
    'updated', updated_count,
    'promoted_batch_id', p_batch_id
  );
end;
$$;
