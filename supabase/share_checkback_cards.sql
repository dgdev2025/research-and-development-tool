-- Make check backs team-visible: one per card, readable/editable by all authenticated users.
-- Run in Supabase SQL Editor.

-- Keep a single row per feed+card (soonest due date wins).
delete from public.user_checkback_cards a
using public.user_checkback_cards b
where a.feed_id = b.feed_id
  and a.card_id = b.card_id
  and a.id <> b.id
  and (
    a.check_back_until > b.check_back_until
    or (
      a.check_back_until = b.check_back_until
      and a.created_at > b.created_at
    )
    or (
      a.check_back_until = b.check_back_until
      and a.created_at = b.created_at
      and a.id::text > b.id::text
    )
  );

alter table public.user_checkback_cards
  drop constraint if exists user_checkback_cards_user_id_feed_id_card_id_key;

alter table public.user_checkback_cards
  drop constraint if exists user_checkback_cards_feed_id_card_id_key;

alter table public.user_checkback_cards
  add constraint user_checkback_cards_feed_id_card_id_key unique (feed_id, card_id);

drop policy if exists "Users can view own checkback cards" on public.user_checkback_cards;
drop policy if exists "Users can set own checkback cards" on public.user_checkback_cards;
drop policy if exists "Users can update own checkback cards" on public.user_checkback_cards;
drop policy if exists "Users can clear own checkback cards" on public.user_checkback_cards;
drop policy if exists "Authenticated users can view checkback cards" on public.user_checkback_cards;
drop policy if exists "Authenticated users can set checkback cards" on public.user_checkback_cards;
drop policy if exists "Authenticated users can update checkback cards" on public.user_checkback_cards;
drop policy if exists "Authenticated users can clear checkback cards" on public.user_checkback_cards;

create policy "Authenticated users can view checkback cards"
  on public.user_checkback_cards for select
  to authenticated
  using (true);

create policy "Authenticated users can set checkback cards"
  on public.user_checkback_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update checkback cards"
  on public.user_checkback_cards for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can clear checkback cards"
  on public.user_checkback_cards for delete
  to authenticated
  using (true);
