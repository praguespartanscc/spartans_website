-- Prague Spartans: automatic admin rights for listed email addresses.
-- When someone signs up with an email on this list and confirms it, their account
-- becomes an admin (and an approved member). Add more admins by adding rows here
-- or with: insert into private.admin_invites (email) values ('someone@example.com');

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_invites (
  email text primary key
);

insert into private.admin_invites (email) values ('praguespartanscc@gmail.com')
on conflict (email) do nothing;

-- Runs inside sign-up / email confirmation, before the account row is saved.
create or replace function private.grant_invited_admin()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.email_confirmed_at is not null
     and coalesce(new.raw_app_meta_data ->> 'isAdmin', 'false') <> 'true'
     and exists (select 1 from private.admin_invites i where lower(i.email) = lower(new.email)) then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || '{"isAdmin": true}'::jsonb;
  end if;
  return new;
end $$;

drop trigger if exists grant_invited_admin on auth.users;
create trigger grant_invited_admin
  before insert or update of email_confirmed_at on auth.users
  for each row execute function private.grant_invited_admin();

-- Admins' member profiles are approved straight away.
create or replace function private.approve_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.raw_app_meta_data ->> 'isAdmin' = 'true' then
    update public.profiles set status = 'approved' where id = new.id and status <> 'approved';
  end if;
  return new;
end $$;

drop trigger if exists approve_admin_profile on auth.users;
create trigger approve_admin_profile
  after insert or update of raw_app_meta_data, email_confirmed_at on auth.users
  for each row execute function private.approve_admin_profile();

-- Accounts that already exist and are confirmed.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || '{"isAdmin": true}'::jsonb
where u.email_confirmed_at is not null
  and exists (select 1 from private.admin_invites i where lower(i.email) = lower(u.email));

commit;
