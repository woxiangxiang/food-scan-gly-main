create table if not exists public.glucose_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value numeric(4, 1) not null check (value >= 2 and value <= 30),
  measured_at timestamptz not null default now(),
  measurement_type text not null default 'unspecified'
    check (measurement_type in ('fasting', 'before_meal', 'after_meal', 'bedtime', 'unspecified')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.glucose_entries is 'User blood glucose records for the food scan glycemic assistant.';
comment on column public.glucose_entries.value is 'Blood glucose value in mmol/L.';
comment on column public.glucose_entries.measured_at is 'When the user measured the glucose value.';
comment on column public.glucose_entries.measurement_type is 'Measurement context, such as fasting or after meal.';

create index if not exists glucose_entries_user_measured_at_idx
  on public.glucose_entries (user_id, measured_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists glucose_entries_set_updated_at on public.glucose_entries;

create trigger glucose_entries_set_updated_at
before update on public.glucose_entries
for each row
execute function public.set_updated_at();

alter table public.glucose_entries enable row level security;

drop policy if exists "Users can view own glucose entries" on public.glucose_entries;
create policy "Users can view own glucose entries"
on public.glucose_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own glucose entries" on public.glucose_entries;
create policy "Users can insert own glucose entries"
on public.glucose_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own glucose entries" on public.glucose_entries;
create policy "Users can update own glucose entries"
on public.glucose_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own glucose entries" on public.glucose_entries;
create policy "Users can delete own glucose entries"
on public.glucose_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
