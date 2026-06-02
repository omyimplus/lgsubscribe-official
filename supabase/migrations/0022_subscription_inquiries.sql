-- คำขอสนใจผ่อน / Subscribe (ลูกค้า login หรือ guest กรอกติดต่อเอง)

create table if not exists public.subscription_inquiries (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.customer_profiles (id) on delete set null,
  contact_name    text not null,
  contact_phone   text not null,
  contact_line_id text default '',
  contact_note    text default '',
  items           jsonb not null default '[]'::jsonb,
  status          text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists subscription_inquiries_status_idx
  on public.subscription_inquiries (status, created_at desc);

create index if not exists subscription_inquiries_customer_id_idx
  on public.subscription_inquiries (customer_id);

drop trigger if exists subscription_inquiries_set_updated_at on public.subscription_inquiries;
create trigger subscription_inquiries_set_updated_at
  before update on public.subscription_inquiries
  for each row execute function public.set_updated_at();

alter table public.subscription_inquiries enable row level security;

-- อ่าน/เขียนผ่าน service role API เท่านั้น (ไม่ expose ตรงจาก client)
