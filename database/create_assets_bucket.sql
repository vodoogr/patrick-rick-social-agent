-- Create the 'assets' storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist (to avoid conflicts when running multiple times)
drop policy if exists "Public Access assets" on storage.objects;
drop policy if exists "Auth Insert assets" on storage.objects;
drop policy if exists "Auth Update assets" on storage.objects;
drop policy if exists "Auth Delete assets" on storage.objects;

-- Create storage policies for the 'assets' bucket
create policy "Public Access assets"
on storage.objects for select
using ( bucket_id = 'assets' );

create policy "Auth Insert assets"
on storage.objects for insert
with check ( bucket_id = 'assets' and auth.role() = 'authenticated' );

create policy "Auth Update assets"
on storage.objects for update
using ( bucket_id = 'assets' and auth.role() = 'authenticated' );

create policy "Auth Delete assets"
on storage.objects for delete
using ( bucket_id = 'assets' and auth.role() = 'authenticated' );
