"use client";

import type { FeedCategory, FeedItem } from "@/lib/parseFeed";
import { SortableCardList } from "./SortableCardList";

interface CategorySectionProps {
  category: FeedCategory;
  feedId: string;
  userId: string;
  canReorder: boolean;
  commentCounts: Record<string, number>;
  hiddenCardIds: Set<string>;
  showHidden: boolean;
  onToggleShowHidden: () => void;
  onToggleHideCard: (cardId: string) => void;
  onReorderItems: (items: FeedItem[]) => void;
  onReorderSubsectionItems: (subsectionTitle: string, items: FeedItem[]) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function filterItems(
  items: FeedItem[],
  hiddenCardIds: Set<string>,
  showHidden: boolean
) {
  return items.filter((item) => {
    const isHidden = hiddenCardIds.has(item.id);
    if (isHidden) return showHidden;
    return true;
  });
}

export function CategorySection({
  category,
  feedId,
  userId,
  canReorder,
  commentCounts,
  hiddenCardIds,
  showHidden,
  onToggleShowHidden,
  onToggleHideCard,
  onReorderItems,
  onReorderSubsectionItems,
  onCommentCountChange,
}: CategorySectionProps) {
  const categoryCardIds = [
    ...category.items.map((item) => item.id),
    ...category.subsections.flatMap((sub) => sub.items.map((item) => item.id)),
  ];
  const hiddenInCategory = categoryCardIds.filter((id) => hiddenCardIds.has(id)).length;

  const visibleItems = filterItems(category.items, hiddenCardIds, showHidden);
  const subsections = category.subsections.map((sub) => ({
    ...sub,
    items: filterItems(sub.items, hiddenCardIds, showHidden),
  }));

  const totalVisible =
    visibleItems.length +
    subsections.reduce((sum, sub) => sum + sub.items.length, 0);

  if (totalVisible === 0 && !category.note && hiddenInCategory === 0) return null;

  return (
    <section className="category-section">
      <div className="category-header-main">
        <h3 className="category-title">{category.title}</h3>
        {hiddenInCategory > 0 && (
          <button type="button" className="show-hidden-btn" onClick={onToggleShowHidden}>
            {showHidden ? "Hide hidden cards" : `Show hidden cards (${hiddenInCategory})`}
          </button>
        )}
      </div>

      {category.note && <p className="category-note">{category.note}</p>}

      {visibleItems.length > 0 && (
        <SortableCardList
          items={visibleItems}
          feedId={feedId}
          userId={userId}
          canReorder={canReorder}
          commentCounts={commentCounts}
          hiddenCardIds={hiddenCardIds}
          onToggleHideCard={onToggleHideCard}
          onReorder={onReorderItems}
          onCommentCountChange={onCommentCountChange}
        />
      )}

      {subsections.map((sub) =>
        sub.items.length > 0 ? (
          <div key={sub.title} className="subsection">
            <h4 className="subsection-title">{sub.title}</h4>
            <SortableCardList
              items={sub.items}
              feedId={feedId}
              userId={userId}
              canReorder={canReorder}
              commentCounts={commentCounts}
              hiddenCardIds={hiddenCardIds}
              onToggleHideCard={onToggleHideCard}
              onReorder={(items) => onReorderSubsectionItems(sub.title, items)}
              onCommentCountChange={onCommentCountChange}
            />
          </div>
        ) : null
      )}
    </section>
  );
}
