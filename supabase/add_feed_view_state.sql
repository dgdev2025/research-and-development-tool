-- Run in Supabase SQL Editor if your project already exists

create table if not exists public.user_card_open_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  is_open boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create table if not exists public.user_feed_view_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, feed_id)
);

create index if not exists user_card_open_state_feed_user_idx
  on public.user_card_open_state (feed_id, user_id);

alter table public.user_card_open_state enable row level security;
alter table public.user_feed_view_state enable row level security;

create policy "Users can view own card open state"
  on public.user_card_open_state for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can set card open state"
  on public.user_card_open_state for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own card open state"
  on public.user_card_open_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can clear card open state"
  on public.user_card_open_state for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own feed view state"
  on public.user_feed_view_state for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can set feed view state"
  on public.user_feed_view_state for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own feed view state"
  on public.user_feed_view_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
