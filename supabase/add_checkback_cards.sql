-- Run in Supabase SQL Editor for check-back card scheduling

create table if not exists public.user_checkback_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  check_back_until date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create index if not exists user_checkback_cards_feed_user_idx
  on public.user_checkback_cards (feed_id, user_id, check_back_until);

alter table public.user_checkback_cards enable row level security;

create policy "Users can view own checkback cards"
  on public.user_checkback_cards for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can set own checkback cards"
  on public.user_checkback_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own checkback cards"
  on public.user_checkback_cards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can clear own checkback cards"
  on public.user_checkback_cards for delete
  to authenticated
  using (auth.uid() = user_id);
