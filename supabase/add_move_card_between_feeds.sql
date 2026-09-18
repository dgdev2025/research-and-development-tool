-- Moving a card into another feed has to carry its comments and card state with it.
-- Those rows belong to other users, so RLS blocks a plain update: do it in one
-- security definer function instead.
-- Run in Supabase SQL Editor.

create or replace function public.move_card_to_feed(
  p_card_id text,
  p_from_feed_id uuid,
  p_to_feed_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_from_feed_id = p_to_feed_id then
    return;
  end if;

  update public.comments
    set feed_id = p_to_feed_id
    where card_id = p_card_id and feed_id = p_from_feed_id;

  update public.comment_mentions
    set feed_id = p_to_feed_id
    where card_id = p_card_id and feed_id = p_from_feed_id;

  update public.user_checkback_cards
    set feed_id = p_to_feed_id
    where card_id = p_card_id and feed_id = p_from_feed_id;

  -- Clear any target-feed rows first so the feed+card unique keys stay valid.
  delete from public.user_hidden_cards
    where card_id = p_card_id and feed_id = p_to_feed_id;

  update public.user_hidden_cards
    set feed_id = p_to_feed_id
    where card_id = p_card_id and feed_id = p_from_feed_id;

  delete from public.user_card_open_state
    where card_id = p_card_id and feed_id = p_to_feed_id;

  update public.user_card_open_state
    set feed_id = p_to_feed_id
    where card_id = p_card_id and feed_id = p_from_feed_id;
end;
$$;

grant execute on function public.move_card_to_feed(text, uuid, uuid) to authenticated;
