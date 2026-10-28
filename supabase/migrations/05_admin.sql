-- Prague Spartans: team selection and editable site settings.

begin;

-- Team selection ---------------------------------------------------------------------
alter table public.matches add column if not exists selection_published_at timestamptz;

do $$
declare
  match_id_type text;
  player_id_type text;
begin
  select format_type(atttypid, atttypmod) into match_id_type
  from pg_attribute where attrelid = 'public.matches'::regclass and attname = 'id';
  select format_type(atttypid, atttypmod) into player_id_type
  from pg_attribute where attrelid = 'public.players'::regclass and attname = 'id';

  execute format(
    'create table if not exists public.match_selection (
       id bigint generated always as identity primary key,
       match_id %s not null references public.matches(id) on delete cascade,
       player_id %s not null references public.players(id) on delete cascade,
       slot text not null default ''xi'' check (slot in (''xi'', ''twelfth'')),
       is_captain boolean not null default false,
       is_keeper boolean not null default false,
       sort_order integer not null default 0,
       unique (match_id, player_id)
     )', match_id_type, player_id_type);
end $$;

alter table public.match_selection enable row level security;
drop policy if exists "Read published or as member" on public.match_selection;
drop policy if exists "Admins manage selection" on public.match_selection;

-- Members always see the selection; everyone else only once it is published.
create policy "Read published or as member" on public.match_selection
  for select
  using (
    public.is_member()
    or exists (
      select 1 from public.matches m
      where m.id = match_selection.match_id and m.selection_published_at is not null
    )
  );
create policy "Admins manage selection" on public.match_selection
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Site settings admins can change without code -----------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
drop policy if exists "Anyone can read settings" on public.site_settings;
drop policy if exists "Admins change settings" on public.site_settings;
create policy "Anyone can read settings" on public.site_settings for select using (true);
create policy "Admins change settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('cricheroes_vanguards', 'https://cricheroes.com/team-profile/4182668/spartans-cc-vanguards/matches'),
  ('cricheroes_mobilizers', 'https://cricheroes.com/team-profile/1230716/prague-spartans-cc-mobilizers/matches'),
  ('cricheroes_strikers', null),
  ('youtube_channel', null),
  ('club_email', 'praguespartanscc@gmail.com'),
  ('instagram_url', 'https://www.instagram.com/praguespartanscc_/'),
  ('facebook_url', 'https://www.facebook.com/praguespartans')
on conflict (key) do nothing;

commit;
