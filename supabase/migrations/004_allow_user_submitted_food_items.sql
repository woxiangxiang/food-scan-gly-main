drop policy if exists "Authenticated users can add food items" on public.food_items;
create policy "Authenticated users can add food items"
on public.food_items
for insert
to authenticated
with check (id like 'user-%');

drop policy if exists "Authenticated users can upload submitted food images" on storage.objects;
create policy "Authenticated users can upload submitted food images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'food-images'
  and (storage.foldername(name))[1] = 'user-submitted'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
