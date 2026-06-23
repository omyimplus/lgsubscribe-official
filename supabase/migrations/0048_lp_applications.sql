-- ใบสมัคร Lifestyle Planner (LP) — ตัวแทน LG Subscribe

create table if not exists public.lp_applications (
  id                      uuid primary key default gen_random_uuid(),
  first_name              text not null,
  last_name               text not null,
  contact_phone           text not null,
  email                   text not null,
  line_id                 text not null default '',
  province                text not null,
  preferred_contact_time  text not null,
  questionnaire           jsonb not null default '{}'::jsonb,
  status                  text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists lp_applications_status_idx
  on public.lp_applications (status, created_at desc);

create index if not exists lp_applications_created_at_idx
  on public.lp_applications (created_at desc);

drop trigger if exists lp_applications_set_updated_at on public.lp_applications;
create trigger lp_applications_set_updated_at
  before update on public.lp_applications
  for each row execute function public.set_updated_at();

alter table public.lp_applications enable row level security;
