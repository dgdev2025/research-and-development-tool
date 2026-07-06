import type { SupabaseClient } from "@supabase/supabase-js";

const cardOpenKeyPrefix = (feedId: string) => `card-open-${feedId}-`;

export interface FeedPanelViewState {
  checkbackStripOpen: boolean | null;
  expandedCheckBackCardIds: string[];
}

interface FeedViewStateRow {
  checkback_strip_open?: boolean | null;
  expanded_checkback_card_ids?: string[];
}

function readLocalCardOpenStates(feedId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};

  const prefix = cardOpenKeyPrefix(feedId);
  const states: Record<string, boolean> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const cardId = key.slice(prefix.length);
    states[cardId] = localStorage.getItem(key) === "true";
  }

  return states;
}

function clearLocalCardOpenStates(feedId: string) {
  if (typeof window === "undefined") return;

  const prefix = cardOpenKeyPrefix(feedId);
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export async function getCardOpenStates(
  supabase: SupabaseClient,
  feedId: string,
  userId: string
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from("user_card_open_state")
    .select("card_id, is_open")
    .eq("feed_id", feedId)
    .eq("user_id", userId);

  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row) => [row.card_id, row.is_open])
  );
}

export async function setCardOpenState(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  cardId: string,
  isOpen: boolean,
  defaultOpen = true
): Promise<void> {
  if (isOpen === defaultOpen) {
    const { error } = await supabase
      .from("user_card_open_state")
      .delete()
      .eq("feed_id", feedId)
      .eq("user_id", userId)
      .eq("card_id", cardId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("user_card_open_state").upsert(
    {
      user_id: userId,
      feed_id: feedId,
      card_id: cardId,
      is_open: isOpen,
    },
    { onConflict: "user_id,feed_id,card_id" }
  );

  if (error) throw error;
}

export async function getFeedPanelViewState(
  supabase: SupabaseClient,
  feedId: string,
  userId: string
): Promise<FeedPanelViewState> {
  const { data, error } = await supabase
    .from("user_feed_view_state")
    .select("state")
    .eq("feed_id", feedId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const state = (data?.state ?? {}) as FeedViewStateRow;

  return {
    checkbackStripOpen:
      typeof state.checkback_strip_open === "boolean"
        ? state.checkback_strip_open
        : null,
    expandedCheckBackCardIds: Array.isArray(state.expanded_checkback_card_ids)
      ? state.expanded_checkback_card_ids.filter(
          (value): value is string => typeof value === "string"
        )
      : [],
  };
}

export async function setFeedPanelViewState(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  patch: Partial<FeedPanelViewState>
): Promise<void> {
  const current = await getFeedPanelViewState(supabase, feedId, userId);

  const nextState: FeedViewStateRow = {
    checkback_strip_open:
      patch.checkbackStripOpen !== undefined
        ? patch.checkbackStripOpen
        : current.checkbackStripOpen,
    expanded_checkback_card_ids:
      patch.expandedCheckBackCardIds !== undefined
        ? patch.expandedCheckBackCardIds
        : current.expandedCheckBackCardIds,
  };

  const { error } = await supabase.from("user_feed_view_state").upsert(
    {
      user_id: userId,
      feed_id: feedId,
      state: nextState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,feed_id" }
  );

  if (error) throw error;
}

export async function migrateLocalCardOpenStatesIfNeeded(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  cardOpenStates: Record<string, boolean>
): Promise<Record<string, boolean>> {
  const localStates = readLocalCardOpenStates(feedId);
  const localEntries = Object.entries(localStates);
  if (localEntries.length === 0) return cardOpenStates;

  const nextStates = { ...cardOpenStates };
  const toUpsert: Array<{
    user_id: string;
    feed_id: string;
    card_id: string;
    is_open: boolean;
  }> = [];

  for (const [cardId, isOpen] of localEntries) {
    if (cardOpenStates[cardId] !== undefined) continue;
    nextStates[cardId] = isOpen;
    if (isOpen !== true) {
      toUpsert.push({
        user_id: userId,
        feed_id: feedId,
        card_id: cardId,
        is_open: isOpen,
      });
    }
  }

  if (toUpsert.length === 0) {
    clearLocalCardOpenStates(feedId);
    return nextStates;
  }

  const { error } = await supabase
    .from("user_card_open_state")
    .upsert(toUpsert, { onConflict: "user_id,feed_id,card_id" });

  if (!error) {
    clearLocalCardOpenStates(feedId);
  }

  return nextStates;
}

export function resolveCardOpen(
  cardOpenStates: Record<string, boolean>,
  cardId: string,
  defaultOpen = true
): boolean {
  if (cardId in cardOpenStates) {
    return cardOpenStates[cardId];
  }
  return defaultOpen;
}
