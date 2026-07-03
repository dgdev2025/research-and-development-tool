-- Run in Supabase SQL Editor if comments already exist without reply/edit support

alter table public.comments
  add column if not exists parent_comment_id uuid
  references public.comments (id) on delete set null;

create index if not exists comments_parent_comment_id_idx
  on public.comments (parent_comment_id);

create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can update any comment"
  on public.comments for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
