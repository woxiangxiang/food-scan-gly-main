insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-images',
  'food-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.food_items (
  id text primary key,
  name text not null unique,
  gi integer not null check (gi >= 0 and gi <= 120),
  gi_type text not null check (gi_type in ('low', 'medium', 'high')),
  description text not null,
  storage_bucket text not null default 'food-images',
  storage_object_path text not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.food_items is 'Common food GI data and Supabase Storage image metadata.';
comment on column public.food_items.gi is 'Glycemic index value.';
comment on column public.food_items.gi_type is 'GI category: low, medium, or high.';
comment on column public.food_items.storage_object_path is 'Object path inside the food-images storage bucket.';
comment on column public.food_items.image_url is 'Public URL for the food image in Supabase Storage.';

create index if not exists food_items_gi_type_idx
  on public.food_items (gi_type);

create index if not exists food_items_gi_idx
  on public.food_items (gi);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists food_items_set_updated_at on public.food_items;

create trigger food_items_set_updated_at
before update on public.food_items
for each row
execute function public.set_updated_at();

alter table public.food_items enable row level security;

drop policy if exists "Anyone can view food items" on public.food_items;
create policy "Anyone can view food items"
on public.food_items
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can view public food images" on storage.objects;
create policy "Anyone can view public food images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'food-images');
