-- Allow all signed-in users to update feed content (needed for Team additions cards).
-- Run in Supabase SQL Editor.

drop policy if exists "Admins can update feeds" on public.feeds;
drop policy if exists "Authenticated users can update feeds" on public.feeds;

create policy "Authenticated users can update feeds"
  on public.feeds for update
  to authenticated
  using (true)
  with check (true);
