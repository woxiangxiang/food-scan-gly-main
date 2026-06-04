create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-food-images',
  'user-food-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.food_recognitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  gi integer check (gi is null or (gi >= 0 and gi <= 120)),
  diabetes_friendly boolean,
  advice text not null default '',
  portion text not null default '',
  nutrition jsonb not null default '{}'::jsonb,
  is_known_food boolean not null default false,
  matched_food_id text references public.food_items(id) on delete set null,
  image_bucket text,
  image_path text,
  image_mime_type text,
  created_at timestamptz not null default now()
);

alter table public.food_recognitions
  add column if not exists image_bucket text,
  add column if not exists image_path text,
  add column if not exists image_mime_type text;

comment on table public.food_recognitions is 'Per-user AI food recognition history.';
comment on column public.food_recognitions.nutrition is 'Estimated nutrition JSON returned by the vision model.';
comment on column public.food_recognitions.is_known_food is 'Whether the recognized food matched a public food_items row.';
comment on column public.food_recognitions.image_path is 'Private Storage object path for the uploaded recognition image.';

create index if not exists food_recognitions_user_created_at_idx
  on public.food_recognitions (user_id, created_at desc);

alter table public.food_recognitions enable row level security;

drop policy if exists "Users can view own recognition history" on public.food_recognitions;
create policy "Users can view own recognition history"
on public.food_recognitions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own recognition history" on public.food_recognitions;
create policy "Users can insert own recognition history"
on public.food_recognitions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own recognition history" on public.food_recognitions;
create policy "Users can delete own recognition history"
on public.food_recognitions
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can upload own recognition images" on storage.objects;
create policy "Users can upload own recognition images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-food-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can view own recognition images" on storage.objects;
create policy "Users can view own recognition images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-food-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own recognition images" on storage.objects;
create policy "Users can delete own recognition images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-food-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table if not exists public.food_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  gi integer check (gi is null or (gi >= 0 and gi <= 120)),
  gi_type text check (gi_type is null or gi_type in ('low', 'medium', 'high')),
  advice text not null default '',
  portion text not null default '',
  nutrition jsonb not null default '{}'::jsonb,
  source_image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.food_item_suggestions is 'User-submitted candidate foods for review before entering food_items.';
comment on column public.food_item_suggestions.status is 'Moderation state: pending, approved, or rejected.';

create index if not exists food_item_suggestions_status_created_at_idx
  on public.food_item_suggestions (status, created_at desc);

create index if not exists food_item_suggestions_user_created_at_idx
  on public.food_item_suggestions (user_id, created_at desc);

drop trigger if exists food_item_suggestions_set_updated_at on public.food_item_suggestions;

create trigger food_item_suggestions_set_updated_at
before update on public.food_item_suggestions
for each row
execute function public.set_updated_at();

alter table public.food_item_suggestions enable row level security;

drop policy if exists "Users can view own food suggestions" on public.food_item_suggestions;
create policy "Users can view own food suggestions"
on public.food_item_suggestions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own food suggestions" on public.food_item_suggestions;
create policy "Users can insert own food suggestions"
on public.food_item_suggestions
for insert
to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');
