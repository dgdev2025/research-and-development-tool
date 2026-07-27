import {
  createFeedItem,
  type FeedItem,
  type ParsedFeed,
} from "@/lib/parseFeed";

/** Reserved category at the top of a feed for manually added cards. */
export const TEAM_ADDITIONS_CATEGORY = "Team additions";

export function prependTeamAddition(
  feed: ParsedFeed,
  input: { title: string; body?: string }
): { feed: ParsedFeed; item: FeedItem } {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const item = createFeedItem({
    title,
    body: (input.body ?? "").trim(),
    links: [],
  });

  const categories = [...feed.categories];
  const existingIndex = categories.findIndex(
    (category) => category.title === TEAM_ADDITIONS_CATEGORY
  );

  if (existingIndex === -1) {
    categories.unshift({
      title: TEAM_ADDITIONS_CATEGORY,
      items: [item],
      subsections: [],
    });
  } else {
    const existing = categories[existingIndex];
    const updated = {
      ...existing,
      items: [item, ...existing.items],
    };
    categories.splice(existingIndex, 1);
    categories.unshift(updated);
  }

  return {
    feed: { ...feed, categories },
    item,
  };
}
