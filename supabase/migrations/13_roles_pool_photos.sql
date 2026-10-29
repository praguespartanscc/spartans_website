-- Committee roles given from the members list, member photos, and squads set by admins only.
--
--   committee.profile_id   links a committee role to a member account (extras without an
--                          account keep their typed name and photo)
--   is_committee()         true for approved members who hold a committee role
--   committee_public()     the committee for the public pages, with each linked member's
--                          current name and photo
--   profiles.photo_url     a member's own photo, set through update_my_photo()
--   players.team           only admins may change it (new members wait in the player pool)
--
-- Re-runnable.

begin;

alter table public.profiles add column if not exists photo_url text;

alter table public.committee add column if not exists profile_id uuid references public.profiles(id) on delete set null;
create unique index if not exists committee_profile_id_key on public.committee (profile_id) where profile_id is not null;

create or replace function public.is_committee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.committee c
    join public.profiles p on p.id = c.profile_id
    where c.profile_id = auth.uid() and p.status = 'approved'
  )
$$;

revoke all on function public.is_committee() from public;
grant execute on function public.is_committee() to anon, authenticated;

-- Public committee list. A linked member shows their player name (or account name) and
-- their own photo. If they stop being a member, the copy saved with the role is shown.
create or replace function public.committee_public()
returns table (
  id bigint,
  name text,
  "position" text,
  photo_url text,
  bio text,
  contact_email text,
  sort_order integer,
  linked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    coalesce(pl.name, pr.full_name, c.name),
    c.position,
    coalesce(pr.photo_url, pl.photo_url, c.photo_url),
    c.bio,
    c.contact_email,
    c.sort_order,
    c.profile_id is not null
  from public.committee c
  left join public.profiles pr on pr.id = c.profile_id and pr.status = 'approved'
  left join public.players pl on pl.id = pr.player_id
$$;

revoke all on function public.committee_public() from public;
grant execute on function public.committee_public() to anon, authenticated;

-- A member sets or removes their own photo. It must be a file they uploaded to their own
-- folder. If they are linked to a player, the player photo follows.
create or replace function public.update_my_photo(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid() and status = 'approved';
  if me.id is null then
    raise exception 'Your membership has not been approved yet';
  end if;
  if p_url is not null and position(('/club-photos/members/' || auth.uid()::text || '/') in p_url) = 0 then
    raise exception 'Upload the photo from your dashboard';
  end if;
  update public.profiles set photo_url = p_url where id = auth.uid();
  if me.player_id is not null then
    update public.players set photo_url = p_url where id = me.player_id;
  end if;
end $$;

revoke all on function public.update_my_photo(text) from public, anon;
grant execute on function public.update_my_photo(text) to authenticated;

-- Squads are picked by admins. Nobody else can move a player between squads, whatever the
-- route (table policies already block it, this also covers security definer functions).
create or replace function public.guard_player_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.team is distinct from old.team and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change a player''s squad';
  end if;
  return new;
end $$;

drop trigger if exists players_guard_team on public.players;
create trigger players_guard_team
  before update on public.players
  for each row execute function public.guard_player_team();

commit;
