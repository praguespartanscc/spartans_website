-- Prague Spartans: member accounts, availability, practice RSVPs and notices.
-- Run in Supabase > SQL Editor after security.sql and 001.
--
-- Anyone can register; they start "pending" and only see the member dashboard
-- once an admin approves them (and links them to their player profile).

begin;

-- Profiles: one per sign-up -------------------------------------------------------
do $$
declare
  player_id_type text;
begin
  select format_type(atttypid, atttypmod) into player_id_type
  from pg_attribute where attrelid = 'public.players'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.profiles (
       id uuid primary key references auth.users(id) on delete cascade,
       full_name text,
       email text,
       status text not null default ''pending'' check (status in (''pending'', ''approved'', ''rejected'')),
       player_id %s unique references public.players(id) on delete set null,
       created_at timestamptz not null default now()
     )', player_id_type);
end $$;

alter table public.profiles enable row level security;

-- New sign-ups get a pending profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts: admins start approved, everyone else pending.
insert into public.profiles (id, email, full_name, status)
select id, email, nullif(raw_user_meta_data ->> 'full_name', ''),
       case when raw_app_meta_data ->> 'isAdmin' = 'true' then 'approved' else 'pending' end
from auth.users
on conflict (id) do nothing;

-- True for admins and approved members. Security definer so it can read
-- profiles regardless of the caller's row access.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
$$;

drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins manage profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Names of approved members, for availability and RSVP lists (no emails).
create or replace function public.member_directory()
returns table (id uuid, full_name text, player_id text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(pl.name, p.full_name, 'Member'), p.player_id::text
  from public.profiles p
  left join public.players pl on pl.id = p.player_id
  where p.status = 'approved' and public.is_member()
$$;

alter table public.players add column if not exists updated_at timestamptz;

-- Members edit only the safe fields of the player profile linked to them.
create or replace function public.update_my_player_profile(
  p_photo_url text,
  p_bio text,
  p_batting_style text,
  p_bowling_style text,
  p_jersey_number integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target text;
begin
  select player_id::text into target
  from public.profiles
  where id = auth.uid() and status = 'approved';

  if target is null then
    raise exception 'Your account is not linked to a player profile yet';
  end if;

  update public.players
  set photo_url = p_photo_url,
      bio = nullif(trim(p_bio), ''),
      batting_style = nullif(trim(p_batting_style), ''),
      bowling_style = nullif(trim(p_bowling_style), ''),
      jersey_number = p_jersey_number,
      updated_at = now()
  where id::text = target;
end $$;

revoke all on function public.update_my_player_profile(text, text, text, text, integer) from public, anon;
grant execute on function public.update_my_player_profile(text, text, text, text, integer) to authenticated;
revoke all on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated;

-- Match availability and practice RSVPs ---------------------------------------------
do $$
declare
  match_id_type text;
  practice_id_type text;
begin
  select format_type(atttypid, atttypmod) into match_id_type
  from pg_attribute where attrelid = 'public.matches'::regclass and attname = 'id';
  select format_type(atttypid, atttypmod) into practice_id_type
  from pg_attribute where attrelid = 'public.practices'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.match_availability (
       id bigint generated always as identity primary key,
       match_id %s not null references public.matches(id) on delete cascade,
       user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
       status text not null check (status in (''yes'', ''no'', ''maybe'')),
       note text,
       updated_at timestamptz not null default now(),
       unique (match_id, user_id)
     )', match_id_type);

  execute format(
    'create table if not exists public.practice_rsvps (
       id bigint generated always as identity primary key,
       practice_id %s not null references public.practices(id) on delete cascade,
       user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
       status text not null check (status in (''yes'', ''no'')),
       updated_at timestamptz not null default now(),
       unique (practice_id, user_id)
     )', practice_id_type);
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['match_availability', 'practice_rsvps']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Members read" on public.%I', t);
    execute format('drop policy if exists "Members manage their own" on public.%I', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format('create policy "Members read" on public.%I for select to authenticated using (public.is_member())', t);
    execute format(
      'create policy "Members manage their own" on public.%I for all to authenticated
         using (user_id = auth.uid() and public.is_member())
         with check (user_id = auth.uid() and public.is_member())', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Club notices (members only) -------------------------------------------------------
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;
drop policy if exists "Members read notices" on public.notices;
drop policy if exists "Admins manage notices" on public.notices;
create policy "Members read notices" on public.notices
  for select to authenticated using (public.is_member());
create policy "Admins manage notices" on public.notices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Members upload their own photo to club-photos/members/<their user id>/ -------------
drop policy if exists "Members upload own photo" on storage.objects;
create policy "Members upload own photo" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'club-photos'
    and split_part(name, '/', 1) = 'members'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.is_member()
  )
  with check (
    bucket_id = 'club-photos'
    and split_part(name, '/', 1) = 'members'
    and split_part(name, '/', 2) = auth.uid()::text
    and public.is_member()
  );

commit;
