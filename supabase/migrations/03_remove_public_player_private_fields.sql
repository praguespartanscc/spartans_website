-- Prague Spartans: remove email and age from the public players table.
-- (No-op on a new database, where players never had these columns.)

begin;

-- Re-copy first, in case admins edited players after 001 ran.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'players' and column_name = 'email'
  ) then
    execute $copy$
      insert into public.player_private (player_id, email, age)
      select id, email, age from public.players
      where email is not null or age is not null
      on conflict (player_id) do update
        set email = coalesce(excluded.email, public.player_private.email),
            age = coalesce(excluded.age, public.player_private.age),
            updated_at = now()
    $copy$;
  end if;
end $$;

alter table public.players
  drop column if exists email,
  drop column if exists age;

commit;
