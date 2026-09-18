-- A card with a check back is normally hidden from the feed body and only shown
-- in the Check backs strip. Cards moved under a headline should show in both.
-- Run in Supabase SQL Editor.

alter table public.user_checkback_cards
  add column if not exists show_in_feed boolean not null default false;
