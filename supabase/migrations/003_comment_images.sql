-- Run this if you already applied the original schema and need multi-image comment support

create table public.comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  image_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index comment_images_comment_id_idx on public.comment_images (comment_id);

insert into public.comment_images (comment_id, image_url, position)
select id, image_url, 0 from public.comments where image_url is not null;

alter table public.comments drop constraint if exists comments_body_or_image;

alter table public.comment_images enable row level security;

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
