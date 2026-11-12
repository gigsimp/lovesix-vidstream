create extension if not exists pgcrypto;

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check(role in('user','admin')),
  created_at timestamptz default now()
);

create table if not exists public.admin_users(
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  role text not null default 'admin' check(role in('admin','super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories(
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  cover_url text,
  created_at timestamptz default now()
);

create table if not exists public.videos(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  duration integer not null default 0,
  views bigint not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.video_views(
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists videos_created_idx on public.videos(created_at desc);
create index if not exists videos_category_idx on public.videos(category_id);
create index if not exists video_views_video_idx on public.video_views(video_id);
create index if not exists admin_users_email_idx on public.admin_users(email);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.videos enable row level security;
alter table public.video_views enable row level security;

drop policy if exists "public profiles read" on public.profiles;
create policy "public profiles read" on public.profiles for select using(true);
drop policy if exists "own admin profile read" on public.admin_users;
create policy "own admin profile read" on public.admin_users for select to authenticated using(id = auth.uid());
drop policy if exists "public categories read" on public.categories;
create policy "public categories read" on public.categories for select using(true);
drop policy if exists "published videos read" on public.videos;
create policy "published videos read" on public.videos for select using(is_published=true or auth.uid()=creator_id or exists(select 1 from public.admin_users a where a.id=auth.uid() and a.is_active=true));
drop policy if exists "users insert own view" on public.video_views;
create policy "users insert own view" on public.video_views for insert with check(auth.uid()=user_id or user_id is null);
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all using(exists(select 1 from public.admin_users a where a.id=auth.uid() and a.is_active=true)) with check(exists(select 1 from public.admin_users a where a.id=auth.uid() and a.is_active=true));
drop policy if exists "admins manage videos" on public.videos;
create policy "admins manage videos" on public.videos for all using(exists(select 1 from public.admin_users a where a.id=auth.uid() and a.is_active=true)) with check(exists(select 1 from public.admin_users a where a.id=auth.uid() and a.is_active=true));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, avatar_url, role)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), case when exists(select 1 from public.admin_users a where a.id=new.id and a.is_active=true) then 'admin' else 'user' end)
  on conflict (id) do update set display_name=coalesce(excluded.display_name, public.profiles.display_name), avatar_url=coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.profiles(id, display_name, avatar_url, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'), case when exists(select 1 from public.admin_users a where a.id=u.id and a.is_active=true) then 'admin' else 'user' end
from auth.users u
on conflict (id) do nothing;

update public.profiles p set role='admin' where exists(select 1 from public.admin_users a where a.id=p.id and a.is_active=true);
update public.admin_users a set email=u.email from auth.users u where a.id=u.id and u.email is not null;

insert into public.categories(name,slug) values
('Music','music'),('Lifestyle','lifestyle'),('Travel','travel'),('Food','food'),('Fitness','fitness'),('Pets','pets'),('Anime','anime'),('Tech','tech')
on conflict do nothing;

insert into public.videos(title,slug,description,video_url,thumbnail_url,duration,views,category_id,is_published,tags)
select 'LOVE6 Demo Video','love6-demo-video','Demo video for checking the LOVE6 card, watch page, search and trending UI.','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','/placeholder.svg',6,128,null,true,array['demo','love6','sample']
where not exists(select 1 from public.videos where slug='love6-demo-video');

create or replace function public.increment_views(p_video_id uuid) returns void language sql security definer as $$
  update public.videos set views=views+1 where id=p_video_id;
$$;
