-- Prague Spartans: lock down admin access.
--
-- The website writes to the database straight from the browser, so these
-- database rules are what actually stop non-admins from changing data.
-- Admin rights live in app_metadata (only the server can set it), never in
-- user_metadata (which any signed-in user can edit for themselves).
-- Admins are granted by 06_admin_bootstrap.sql.

begin;

-- Remove the old, self-editable flag from everyone.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'isAdmin'
where raw_user_meta_data ? 'isAdmin';

-- True when the signed-in user's token carries the server-set admin flag.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'isAdmin')::boolean, false)
$$;

-- Replace whatever policies exist on the club tables. Policies are OR'ed
-- together, so an old permissive one would keep the hole open.
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('players', 'matches', 'practices', 'sponsors', 'committee', 'team_applications')
  loop
    execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- Public club content: anyone can read, only admins can change.
do $$
declare
  t text;
begin
  foreach t in array array['players', 'matches', 'practices', 'sponsors', 'committee']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Anyone can read" on public.%I for select using (true)', t);
    execute format(
      'create policy "Admins can change" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- Applications: anyone can submit one (as pending); only admins can read or manage them.
alter table public.team_applications enable row level security;

create policy "Anyone can apply" on public.team_applications
  for insert to anon, authenticated
  with check (status is null or status = 'pending');

create policy "Admins can manage applications" on public.team_applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sponsor logo uploads: the bucket stays public to read, only admins can write.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') like '%sponsor-logos%' or coalesce(with_check, '') like '%sponsor-logos%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "Admins manage sponsor logos" on storage.objects
  for all to authenticated
  using (bucket_id = 'sponsor-logos' and public.is_admin())
  with check (bucket_id = 'sponsor-logos' and public.is_admin());

commit;
