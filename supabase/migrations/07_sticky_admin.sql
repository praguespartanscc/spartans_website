-- Prague Spartans: keep the admin flag on invited accounts.
-- Supabase Auth rewrites app metadata from its own copy when someone signs in, which
-- dropped the flag added at email confirmation. Re-apply it on every change instead,
-- so private.admin_invites is the single list of admins (remove an email there to
-- take admin rights away).

begin;

create or replace function private.grant_invited_admin()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from private.admin_invites i where lower(i.email) = lower(new.email)) then
    if coalesce(new.raw_app_meta_data ->> 'isAdmin', 'false') <> 'true' then
      new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"isAdmin": true}'::jsonb;
    end if;
  elsif new.raw_app_meta_data ? 'isAdmin' then
    -- Not on the list (or not confirmed): no admin rights.
    new.raw_app_meta_data := new.raw_app_meta_data - 'isAdmin';
  end if;
  return new;
end $$;

drop trigger if exists grant_invited_admin on auth.users;
create trigger grant_invited_admin
  before insert or update on auth.users
  for each row execute function private.grant_invited_admin();

-- Bring existing accounts in line with the list.
update auth.users set raw_app_meta_data = raw_app_meta_data
where email_confirmed_at is not null
  and exists (select 1 from private.admin_invites i where lower(i.email) = lower(auth.users.email));

commit;
