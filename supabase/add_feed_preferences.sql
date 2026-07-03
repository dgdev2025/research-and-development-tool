-- Run in Supabase SQL Editor if your project already exists

create table if not exists public.user_hidden_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create table if not exists public.user_collapsed_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  category_title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, category_title)
);

create index if not exists user_hidden_cards_feed_user_idx
  on public.user_hidden_cards (feed_id, user_id);

create index if not exists user_collapsed_categories_feed_user_idx
  on public.user_collapsed_categories (feed_id, user_id);

alter table public.user_hidden_cards enable row level security;
alter table public.user_collapsed_categories enable row level security;

create policy "Users can view own hidden cards"
  on public.user_hidden_cards for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can hide cards"
  on public.user_hidden_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unhide cards"
  on public.user_hidden_cards for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own collapsed categories"
  on public.user_collapsed_categories for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can collapse categories"
  on public.user_collapsed_categories for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can expand categories"
  on public.user_collapsed_categories for delete
  to authenticated
  using (auth.uid() = user_id);
