-- Run this in the Supabase SQL Editor

create type public.user_role as enum ('admin', 'contributor');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'contributor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feeds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  image_url text,
  parent_comment_id uuid references public.comments (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  image_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.comment_mentions (
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

create index feeds_uploaded_by_idx on public.feeds (uploaded_by);
create index feeds_updated_at_idx on public.feeds (updated_at desc);
create index comments_feed_card_idx on public.comments (feed_id, card_id, created_at);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);
create index comment_images_comment_id_idx on public.comment_images (comment_id);
create index comment_mentions_user_read_idx
  on public.comment_mentions (mentioned_user_id, read_at, created_at desc);
create index comment_mentions_comment_idx on public.comment_mentions (comment_id);

create table public.user_hidden_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create table public.user_collapsed_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  category_title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, category_title)
);

create table public.user_checkback_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  check_back_until date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create table public.user_card_open_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  card_id text not null,
  is_open boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, feed_id, card_id)
);

create table public.user_feed_view_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_id uuid not null references public.feeds (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, feed_id)
);

create index user_hidden_cards_feed_user_idx
  on public.user_hidden_cards (feed_id, user_id);

create index user_collapsed_categories_feed_user_idx
  on public.user_collapsed_categories (feed_id, user_id);

create index user_checkback_cards_feed_user_idx
  on public.user_checkback_cards (feed_id, user_id, check_back_until);

create index user_card_open_state_feed_user_idx
  on public.user_card_open_state (feed_id, user_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger feeds_updated_at
  before update on public.feeds
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
      case
        when (select count(*) from public.profiles) = 0 then 'admin'::public.user_role
        else 'contributor'::public.user_role
      end
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.feeds enable row level security;
alter table public.comments enable row level security;
alter table public.user_hidden_cards enable row level security;
alter table public.user_collapsed_categories enable row level security;
alter table public.user_checkback_cards enable row level security;
alter table public.user_card_open_state enable row level security;
alter table public.user_feed_view_state enable row level security;
alter table public.comment_mentions enable row level security;
alter table public.comment_images enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Feeds are viewable by authenticated users"
  on public.feeds for select
  to authenticated
  using (true);

create policy "Admins can insert feeds"
  on public.feeds for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update feeds"
  on public.feeds for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete feeds"
  on public.feeds for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Comments are viewable by authenticated users"
  on public.comments for select
  to authenticated
  using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can delete any comment"
  on public.comments for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update any comment"
  on public.comments for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Comment images are viewable by authenticated users"
  on public.comment_images for select
  to authenticated
  using (true);

create policy "Authenticated users can insert images for own comments"
  on public.comment_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.comments
      where id = comment_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own comment images"
  on public.comment_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.comments
      where id = comment_id and user_id = auth.uid()
    )
  );

create policy "Admins can delete any comment image"
  on public.comment_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

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

insert into storage.buckets (id, name, public)
values ('comment-images', 'comment-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload comment images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'comment-images');

create policy "Comment images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'comment-images');

create policy "Users can delete own comment images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'comment-images' and auth.uid()::text = (storage.foldername(name))[1]);

alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.comment_images;
alter publication supabase_realtime add table public.comment_mentions;
