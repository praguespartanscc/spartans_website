-- Indoor scorer: only admins can delete a match (the owner's choice). Its events go with it
-- (on delete cascade). Phones that still hold a copy drop it instead of uploading it again.

begin;

drop policy if exists "Starter or admin deletes indoor matches" on public.indoor_matches;
drop policy if exists "Admins delete indoor matches" on public.indoor_matches;

create policy "Admins delete indoor matches" on public.indoor_matches
  for delete to authenticated using (public.is_admin());

commit;
