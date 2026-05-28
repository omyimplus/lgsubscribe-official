alter table public.products
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists features text,
  add column if not exists specifications text;

update public.products
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and image_url <> ''
  and (
    image_urls is null
    or image_urls = '[]'::jsonb
  );
