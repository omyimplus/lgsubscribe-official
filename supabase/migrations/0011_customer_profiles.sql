-- Customer profiles for frontend website registration/contact.
create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text default '',
  phone text default '',
  line_id text default '',
  contact_note text default '',
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_customer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_customer_profiles_updated_at();

alter table public.customer_profiles enable row level security;

drop policy if exists "Customer select own profile" on public.customer_profiles;
create policy "Customer select own profile"
on public.customer_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Customer insert own profile" on public.customer_profiles;
create policy "Customer insert own profile"
on public.customer_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Customer update own profile" on public.customer_profiles;
create policy "Customer update own profile"
on public.customer_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
