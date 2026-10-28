-- Prague Spartans: manage admins from the admin dashboard.
-- private.admin_invites is the list of admins (see 07). These functions let admins
-- add and remove emails on it, with two guards: you can't remove yourself, and
-- there is always at least one admin left.

begin;

-- Check admin rights against the account itself rather than the sign-in token,
-- so removing an admin takes effect straight away (tokens last up to an hour).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (u.raw_app_meta_data ->> 'isAdmin')::boolean from auth.users u where u.id = auth.uid()),
    false
  )
$$;

-- Everyone on the admin list, and whether they have signed up yet.
create or replace function public.admin_list()
returns table (email text, user_id uuid, full_name text, signed_up boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see the admin list' using errcode = '42501';
  end if;
  return query
    select i.email, u.id, coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name'), u.email_confirmed_at is not null
    from private.admin_invites i
    left join auth.users u on lower(u.email) = lower(i.email)
    left join public.profiles p on p.id = u.id
    order by lower(i.email);
end $$;

-- Give or take away admin rights by email. Someone who hasn't signed up yet becomes
-- an admin when they sign up and confirm their email.
create or replace function public.set_admin(target_email text, make_admin boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  target text := lower(trim(target_email));
  me text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change admin rights' using errcode = '42501';
  end if;
  if target is null or target !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;

  if make_admin then
    insert into private.admin_invites (email) values (target) on conflict (email) do nothing;
  else
    select lower(u.email) into me from auth.users u where u.id = auth.uid();
    if target = me then
      raise exception 'You can''t remove your own admin rights. Ask another admin to do it.' using errcode = '42501';
    end if;
    delete from private.admin_invites i where lower(i.email) = target;
    if not exists (select 1 from private.admin_invites) then
      raise exception 'The club needs at least one admin' using errcode = '42501';
    end if;
  end if;

  -- Re-run the account trigger (07) so the change applies now.
  update auth.users u set raw_app_meta_data = u.raw_app_meta_data where lower(u.email) = target;
end $$;

revoke all on function public.admin_list() from public, anon;
revoke all on function public.set_admin(text, boolean) from public, anon;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.set_admin(text, boolean) to authenticated;

commit;
