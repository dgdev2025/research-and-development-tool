import type { SupabaseClient } from "@supabase/supabase-js";

const hiddenKey = (feedId: string, userId: string) =>
  `rd-feed-hidden:${feedId}:${userId}`;

const collapsedKey = (feedId: string, userId: string) =>
  `rd-feed-collapsed:${feedId}:${userId}`;

function readLocalJsonArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearLocalKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export async function getHiddenCardIds(
  supabase: SupabaseClient,
  feedId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_hidden_cards")
    .select("card_id")
    .eq("feed_id", feedId)
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.card_id);
}

export async function setCardHidden(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  cardId: string,
  hidden: boolean
): Promise<void> {
  if (hidden) {
    const { error } = await supabase.from("user_hidden_cards").upsert(
      {
        user_id: userId,
        feed_id: feedId,
        card_id: cardId,
      },
      { onConflict: "user_id,feed_id,card_id" }
    );
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("user_hidden_cards")
    .delete()
    .eq("user_id", userId)
    .eq("feed_id", feedId)
    .eq("card_id", cardId);

  if (error) throw error;
}

export async function getCollapsedCategories(
  supabase: SupabaseClient,
  feedId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_collapsed_categories")
    .select("category_title")
    .eq("feed_id", feedId)
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.category_title);
}

export async function setCategoryCollapsed(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  categoryTitle: string,
  collapsed: boolean
): Promise<void> {
  if (collapsed) {
    const { error } = await supabase.from("user_collapsed_categories").upsert(
      {
        user_id: userId,
        feed_id: feedId,
        category_title: categoryTitle,
      },
      { onConflict: "user_id,feed_id,category_title" }
    );
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("user_collapsed_categories")
    .delete()
    .eq("user_id", userId)
    .eq("feed_id", feedId)
    .eq("category_title", categoryTitle);

  if (error) throw error;
}

export async function migrateLocalPreferencesIfNeeded(
  supabase: SupabaseClient,
  feedId: string,
  userId: string,
  hiddenCardIds: string[],
  collapsedCategories: string[]
): Promise<{ hiddenCardIds: string[]; collapsedCategories: string[] }> {
  const localHidden = readLocalJsonArray(hiddenKey(feedId, userId));
  const localCollapsed = readLocalJsonArray(collapsedKey(feedId, userId));

  let nextHidden = hiddenCardIds;
  let nextCollapsed = collapsedCategories;

  if (hiddenCardIds.length === 0 && localHidden.length > 0) {
    const { error } = await supabase.from("user_hidden_cards").upsert(
      localHidden.map((cardId) => ({
        user_id: userId,
        feed_id: feedId,
        card_id: cardId,
      })),
      { onConflict: "user_id,feed_id,card_id" }
    );
    if (!error) {
      nextHidden = localHidden;
      clearLocalKey(hiddenKey(feedId, userId));
    }
  }

  if (collapsedCategories.length === 0 && localCollapsed.length > 0) {
    const { error } = await supabase.from("user_collapsed_categories").upsert(
      localCollapsed.map((categoryTitle) => ({
        user_id: userId,
        feed_id: feedId,
        category_title: categoryTitle,
      })),
      { onConflict: "user_id,feed_id,category_title" }
    );
    if (!error) {
      nextCollapsed = localCollapsed;
      clearLocalKey(collapsedKey(feedId, userId));
    }
  }

  return {
    hiddenCardIds: nextHidden,
    collapsedCategories: nextCollapsed,
  };
}

export function getCategoryCardIds(category: {
  items: { id: string }[];
  subsections: { items: { id: string }[] }[];
}): string[] {
  return [
    ...category.items.map((item) => item.id),
    ...category.subsections.flatMap((sub) => sub.items.map((item) => item.id)),
  ];
}
