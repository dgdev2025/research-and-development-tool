-- Make hidden cards shared per feed (same for all users).
-- Run in Supabase SQL Editor.

-- Keep one hide row per feed+card (earliest hide wins).
delete from public.user_hidden_cards a
using public.user_hidden_cards b
where a.feed_id = b.feed_id
  and a.card_id = b.card_id
  and a.id <> b.id
  and (
    a.created_at > b.created_at
    or (a.created_at = b.created_at and a.id::text > b.id::text)
  );

alter table public.user_hidden_cards
  drop constraint if exists user_hidden_cards_user_id_feed_id_card_id_key;

alter table public.user_hidden_cards
  drop constraint if exists user_hidden_cards_feed_id_card_id_key;

alter table public.user_hidden_cards
  add constraint user_hidden_cards_feed_id_card_id_key unique (feed_id, card_id);

drop policy if exists "Users can view own hidden cards" on public.user_hidden_cards;
drop policy if exists "Users can hide cards" on public.user_hidden_cards;
drop policy if exists "Users can unhide cards" on public.user_hidden_cards;
drop policy if exists "Authenticated users can view hidden cards" on public.user_hidden_cards;
drop policy if exists "Authenticated users can hide cards" on public.user_hidden_cards;
drop policy if exists "Authenticated users can update hidden cards" on public.user_hidden_cards;
drop policy if exists "Authenticated users can unhide cards" on public.user_hidden_cards;

create policy "Authenticated users can view hidden cards"
  on public.user_hidden_cards for select
  to authenticated
  using (true);

create policy "Authenticated users can hide cards"
  on public.user_hidden_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update hidden cards"
  on public.user_hidden_cards for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can unhide cards"
  on public.user_hidden_cards for delete
  to authenticated
  using (true);
