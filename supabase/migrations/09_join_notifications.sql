-- Prague Spartans: email admins about new member registrations and join requests.
-- The database tells the website which row is new (table + id, nothing else). The
-- website reads that row with its server key, emails the admins once, and stamps
-- notified_at, so a forged call can't send made-up details or repeat an email.

begin;

create extension if not exists pg_net with schema extensions;

alter table public.profiles add column if not exists notified_at timestamptz;
alter table public.team_applications add column if not exists notified_at timestamptz;

-- Who gets the emails: everyone on the admin list. Only the website's server key can call this.
create or replace function public.admin_notify_emails()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select i.email from private.admin_invites i order by i.email
$$;
revoke all on function public.admin_notify_emails() from public, anon, authenticated;
grant execute on function public.admin_notify_emails() to service_role;

create or replace function private.notify_join(tbl text, row_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://praguespartanscc.com/api/hooks/join',
    body := jsonb_build_object('table', tbl, 'id', row_id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  -- Never block a sign-up or application because the notification failed.
  raise warning 'join notification failed: %', sqlerrm;
end $$;

-- New member: once they confirm their email (so fake sign-ups don't email anyone).
create or replace function private.notify_member_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null)
     and coalesce(new.raw_app_meta_data ->> 'isAdmin', 'false') <> 'true' then
    perform private.notify_join('profiles', new.id::text);
  end if;
  return new;
end $$;

drop trigger if exists notify_member_confirmed on auth.users;
create trigger notify_member_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.notify_member_confirmed();

-- New join request from the public form.
create or replace function private.notify_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_join('team_applications', new.id::text);
  return new;
end $$;

drop trigger if exists notify_application on public.team_applications;
create trigger notify_application
  after insert on public.team_applications
  for each row execute function private.notify_application();

commit;
