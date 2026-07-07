-- Run in Supabase SQL Editor if your project already exists

create table if not exists public.comment_mentions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  mentioned_user_id uuid not null references public.profiles (id) on delete cascade,
  triggered_by_user_id uuid not null references public.profiles (id) on delete cascade,
  mention_token text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comment_id, mentioned_user_id)
);

create index if not exists comment_mentions_user_read_idx
  on public.comment_mentions (mentioned_user_id, read_at, created_at desc);

create index if not exists comment_mentions_comment_idx
  on public.comment_mentions (comment_id);

alter table public.comment_mentions enable row level security;

create policy "Users can view mentions involving them"
  on public.comment_mentions for select
  to authenticated
  using (auth.uid() = mentioned_user_id or auth.uid() = triggered_by_user_id);

create policy "Users can insert mentions they trigger"
  on public.comment_mentions for insert
  to authenticated
  with check (auth.uid() = triggered_by_user_id);

create policy "Users can update mentions they receive"
  on public.comment_mentions for update
  to authenticated
  using (auth.uid() = mentioned_user_id)
  with check (auth.uid() = mentioned_user_id);

create policy "Users can delete mentions they trigger"
  on public.comment_mentions for delete
  to authenticated
  using (auth.uid() = triggered_by_user_id);

alter publication supabase_realtime add table public.comment_mentions;
