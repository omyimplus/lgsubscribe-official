-- อีเมลลูกค้าที่ขอรับ PDF ตารางผ่อนตะกร้า (เก็บเฉพาะอีเมล ไม่ซ้ำ — ใช้การตลาด)
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
