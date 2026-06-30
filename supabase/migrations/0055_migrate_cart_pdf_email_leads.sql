-- สร้างตารางใหม่ก่อน (กรณี 0054 เคย apply ด้วย schema เก่า หรือรันแค่ไฟล์นี้)
create table if not exists public.cart_pdf_email_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_requested_at timestamptz not null default now(),
  last_requested_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count >= 1),
  last_email_sent_at timestamptz,
  constraint cart_pdf_email_leads_email_unique unique (email)
);

create index if not exists cart_pdf_email_leads_last_requested_at_idx
  on public.cart_pdf_email_leads (last_requested_at desc);

comment on table public.cart_pdf_email_leads is
  'อีเมลลูกค้าที่ขอรับ PDF ตารางผ่อน — หนึ่งแถวต่ออีเมล สำหรับการตลาด';

alter table public.cart_pdf_email_leads enable row level security;

-- ย้ายจากตารางเก่า (เก็บ items/json) มาเป็นอีเมลอย่างเดียว ถ้ามีข้อมูลแล้ว
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'cart_installment_schedule_pdf_requests'
  ) then
    insert into public.cart_pdf_email_leads (
      email,
      first_requested_at,
      last_requested_at,
      request_count,
      last_email_sent_at
    )
    select
      lower(trim(email)) as email,
      min(created_at) as first_requested_at,
      max(created_at) as last_requested_at,
      count(*)::integer as request_count,
      max(email_sent_at) as last_email_sent_at
    from public.cart_installment_schedule_pdf_requests
    where email is not null and trim(email) <> ''
    group by lower(trim(email))
    on conflict (email) do update set
      first_requested_at = least(
        cart_pdf_email_leads.first_requested_at,
        excluded.first_requested_at
      ),
      last_requested_at = greatest(
        cart_pdf_email_leads.last_requested_at,
        excluded.last_requested_at
      ),
      request_count = cart_pdf_email_leads.request_count + excluded.request_count,
      last_email_sent_at = coalesce(
        greatest(cart_pdf_email_leads.last_email_sent_at, excluded.last_email_sent_at),
        cart_pdf_email_leads.last_email_sent_at,
        excluded.last_email_sent_at
      );

    drop table public.cart_installment_schedule_pdf_requests;
  end if;
end $$;
