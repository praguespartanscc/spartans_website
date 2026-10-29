-- News posts and achievements (honours), written by admins and committee members.
-- Everyone reads what is published. Only admins delete. Needs is_committee() from 13.
-- Re-runnable.

begin;

create table if not exists public.news_posts (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(title) between 3 and 140),
  title_cs text check (title_cs is null or length(title_cs) <= 140),
  body text not null default '',
  body_cs text,
  category text not null default 'club' check (category in ('club', 'match_report')),
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_posts_published on public.news_posts (status, published_at desc);

create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  season integer not null check (season between 2000 and 2100),
  title text not null check (length(title) between 3 and 160),
  title_cs text check (title_cs is null or length(title_cs) <= 160),
  team text, -- a squad name, or empty for the whole club
  result text not null default 'winners' check (result in ('winners', 'runners_up', 'semi_finals', 'award', 'other')),
  photo_url text,
  note text,
  note_cs text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists achievements_season on public.achievements (season desc, sort_order);

alter table public.news_posts enable row level security;
alter table public.achievements enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- A post gets its publish date the first time it is published.
create or replace function public.news_publish_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists news_posts_dates on public.news_posts;
create trigger news_posts_dates before insert or update on public.news_posts
  for each row execute function public.news_publish_date();
drop trigger if exists achievements_touch on public.achievements;
create trigger achievements_touch before update on public.achievements
  for each row execute function public.touch_updated_at();

drop policy if exists "Anyone reads published news" on public.news_posts;
drop policy if exists "Club writers add news" on public.news_posts;
drop policy if exists "Club writers edit news" on public.news_posts;
drop policy if exists "Admins delete news" on public.news_posts;
create policy "Anyone reads published news" on public.news_posts
  for select to anon, authenticated
  using (status = 'published' or public.is_admin() or public.is_committee());
create policy "Club writers add news" on public.news_posts
  for insert to authenticated with check (public.is_admin() or public.is_committee());
create policy "Club writers edit news" on public.news_posts
  for update to authenticated
  using (public.is_admin() or public.is_committee())
  with check (public.is_admin() or public.is_committee());
create policy "Admins delete news" on public.news_posts
  for delete to authenticated using (public.is_admin());

drop policy if exists "Anyone reads achievements" on public.achievements;
drop policy if exists "Club writers add achievements" on public.achievements;
drop policy if exists "Club writers edit achievements" on public.achievements;
drop policy if exists "Admins delete achievements" on public.achievements;
create policy "Anyone reads achievements" on public.achievements
  for select to anon, authenticated using (true);
create policy "Club writers add achievements" on public.achievements
  for insert to authenticated with check (public.is_admin() or public.is_committee());
create policy "Club writers edit achievements" on public.achievements
  for update to authenticated
  using (public.is_admin() or public.is_committee())
  with check (public.is_admin() or public.is_committee());
create policy "Admins delete achievements" on public.achievements
  for delete to authenticated using (public.is_admin());

-- Committee members upload cover and trophy photos (admins already manage all club photos).
drop policy if exists "Committee uploads news and achievement photos" on storage.objects;
create policy "Committee uploads news and achievement photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'club-photos' and split_part(name, '/', 1) in ('news', 'achievements') and public.is_committee())
  with check (bucket_id = 'club-photos' and split_part(name, '/', 1) in ('news', 'achievements') and public.is_committee());

-- The honours the website listed so far, so the Achievements page starts full.
insert into public.achievements (season, title, title_cs, team, result, sort_order)
select * from (values
  (2026, 'ECS Czechia Challenger Division winners', 'Vítězové ECS Czechia Challenger Division', null, 'winners', 10),
  (2026, 'ČMKS T10 League winners (final on 3 October 2026)', 'Vítězové ČMKS T10 League (finále 3. října 2026)', 'Vanguards', 'winners', 20),
  (2026, 'Division 2 winners', 'Vítězové 2. divize', 'Mobilizers', 'winners', 30),
  (2026, 'Division 1: 2nd after the league stage and semi-finalists', '1. divize: 2. místo po základní části a postup do semifinále', 'Vanguards', 'semi_finals', 40)
) as v(season, title, title_cs, team, result, sort_order)
where not exists (select 1 from public.achievements);

commit;
