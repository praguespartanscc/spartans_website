-- A member who had started or scored an indoor match could not be deleted. Deleting the
-- account empties created_by and scorer_id on their matches, the guard below saw created_by
-- change with no admin signed in, and refused.
--
-- The two "who may change this" checks now only apply when somebody is signed in. With nobody
-- signed in (the dashboard, the server key, an account being deleted) the change goes through.
-- Signed in members are held to the same rules as before, and the share link still cannot
-- change for anyone. Same pattern as guard_player_team and guard_indoor_tournament_update.
--
-- Re-runnable.

begin;

create or replace function public.guard_indoor_match_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is distinct from old.created_by and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change who started a match';
  end if;
  if new.share_slug is distinct from old.share_slug then
    raise exception 'The share link of a match cannot change';
  end if;
  if new.scorer_id is distinct from old.scorer_id
     and auth.uid() is not null
     and not (public.is_admin() or old.created_by = auth.uid() or old.scorer_id = auth.uid()) then
    raise exception 'Only the scorer, the starter or an admin can hand the match over';
  end if;
  new.updated_at := now();
  return new;
end $$;

commit;
