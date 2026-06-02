-- ฟอร์มติดต่อแบบบุคคลธรรมดา / นิติบุคคล

alter table public.subscription_inquiries
  add column if not exists applicant_type text not null default 'individual'
    check (applicant_type in ('individual', 'corporate'));

alter table public.subscription_inquiries
  add column if not exists contact_profile jsonb not null default '{}'::jsonb;

create index if not exists subscription_inquiries_applicant_type_idx
  on public.subscription_inquiries (applicant_type, created_at desc);
