-- รูปกิจกรรมหลายรูปต่อรายการ

alter table public.customer_experiences
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.customer_experiences
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (
    image_urls is null
    or image_urls = '[]'::jsonb
  );
