-- LOVE6 Magazine feature
-- Run this once in Supabase SQL Editor after reviewing it.

create table if not exists public.magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  cover_url text not null,
  url text not null check (url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists magazines_created_at_idx
  on public.magazines (created_at desc);

alter table public.magazines enable row level security;

drop policy if exists "Public can read magazines" on public.magazines;
create policy "Public can read magazines"
  on public.magazines for select
  to anon, authenticated
  using (true);

drop policy if exists "Active admins manage magazines" on public.magazines;
create policy "Active admins manage magazines"
  on public.magazines for all
  to authenticated
  using (exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid()) and a.is_active = true
  ))
  with check (exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid()) and a.is_active = true
  ));

-- Covers reuse the existing public `thumbnails` bucket and are stored under magazine/.
-- Keep the same 500 KB client-side limit as video thumbnails.
-- These policies permit active admins to manage only objects in the magazine/ folder.
drop policy if exists "Active admins upload magazine covers" on storage.objects;
create policy "Active admins upload magazine covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = 'magazine'
    and exists (
      select 1 from public.admin_users a
      where a.id = (select auth.uid()) and a.is_active = true
    )
  );

drop policy if exists "Active admins update magazine covers" on storage.objects;
create policy "Active admins update magazine covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = 'magazine'
    and exists (
      select 1 from public.admin_users a
      where a.id = (select auth.uid()) and a.is_active = true
    )
  )
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = 'magazine'
    and exists (
      select 1 from public.admin_users a
      where a.id = (select auth.uid()) and a.is_active = true
    )
  );

drop policy if exists "Active admins delete magazine covers" on storage.objects;
create policy "Active admins delete magazine covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = 'magazine'
    and exists (
      select 1 from public.admin_users a
      where a.id = (select auth.uid()) and a.is_active = true
    )
  );
