-- Feed-level check backs (not tied to a card), plus live sync for hidden cards.
-- Run in Supabase SQL Editor.

create table if not exists public.feed_checkbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  note text,
  check_back_until date not null,
  created_at timestamptz not null default now()
);

create index if not exists feed_checkbacks_feed_until_idx
  on public.feed_checkbacks (feed_id, check_back_until);

alter table public.feed_checkbacks enable row level security;

drop policy if exists "Authenticated users can view feed check backs" on public.feed_checkbacks;
drop policy if exists "Authenticated users can add feed check backs" on public.feed_checkbacks;
drop policy if exists "Authenticated users can update feed check backs" on public.feed_checkbacks;
drop policy if exists "Authenticated users can clear feed check backs" on public.feed_checkbacks;

create policy "Authenticated users can view feed check backs"
  on public.feed_checkbacks for select
  to authenticated
  using (true);

create policy "Authenticated users can add feed check backs"
  on public.feed_checkbacks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update feed check backs"
  on public.feed_checkbacks for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can clear feed check backs"
  on public.feed_checkbacks for delete
  to authenticated
  using (true);

-- Push hide/unhide changes to everyone who has the feed open.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_hidden_cards'
  ) then
    alter publication supabase_realtime add table public.user_hidden_cards;
  end if;
end $$;
