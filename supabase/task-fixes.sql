-- LOVE6 compatibility fixes for the current add/edit/watch-video code.
-- Review this script before running it in Supabase SQL Editor.
-- It is additive/safe for existing rows; it does not delete application data.

-- The current admin form stores durations such as 16:18 and keeps the
-- selected category label as text. Preserve any existing values while aligning types.
alter table public.videos
  add column if not exists category text;

alter table public.videos
  alter column duration type text using duration::text;

-- Video URLs are stored per server in video_servers, not directly on videos.
alter table public.videos
  alter column video_url drop not null;

create table if not exists public.video_servers (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  server_name text not null,
  server_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_servers_video_sort_idx
  on public.video_servers(video_id, sort_order);

alter table public.video_servers enable row level security;

drop policy if exists "public read active video servers" on public.video_servers;
create policy "public read active video servers"
  on public.video_servers for select
  using (
    is_active = true
    or exists (
      select 1 from public.admin_users a
      where a.id = auth.uid() and a.is_active = true
    )
  );

drop policy if exists "admins manage video servers" on public.video_servers;
create policy "admins manage video servers"
  on public.video_servers for all
  using (exists (
    select 1 from public.admin_users a
    where a.id = auth.uid() and a.is_active = true
  ))
  with check (exists (
    select 1 from public.admin_users a
    where a.id = auth.uid() and a.is_active = true
  ));

-- The watch page expects the updated view count as the RPC result.
create or replace function public.increment_video_views(p_video_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_views bigint;
begin
  update public.videos
  set views = views + 1,
      updated_at = now()
  where id = p_video_id
  returning views into updated_views;

  return updated_views;
end;
$$;

grant execute on function public.increment_video_views(uuid) to anon, authenticated;
