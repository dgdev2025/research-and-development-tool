"use client";

import type { FeedCategory, FeedItem } from "@/lib/parseFeed";
import { makeContainerId } from "@/lib/feedDragDrop";
import { EmptyDroppableCardList, SortableCardList } from "./SortableCardList";

interface CategorySectionProps {
  category: FeedCategory;
  feedId: string;
  userId: string;
  canReorder: boolean;
  dragEnabled: boolean;
  commentCounts: Record<string, number>;
  hiddenCardIds: Set<string>;
  checkBackCardIds: Set<string>;
  showHidden: boolean;
  onToggleShowHidden: () => void;
  onToggleHideCard: (cardId: string) => void;
  onCheckBackCard: (cardId: string) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function filterItems(
  items: FeedItem[],
  hiddenCardIds: Set<string>,
  checkBackCardIds: Set<string>,
  showHidden: boolean
) {
  return items.filter((item) => {
    if (checkBackCardIds.has(item.id)) return false;
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
  dragEnabled,
  commentCounts,
  hiddenCardIds,
  checkBackCardIds,
  showHidden,
  onToggleShowHidden,
  onToggleHideCard,
  onCheckBackCard,
  onCommentCountChange,
}: CategorySectionProps) {
  const categoryCardIds = [
    ...category.items.map((item) => item.id),
    ...category.subsections.flatMap((sub) => sub.items.map((item) => item.id)),
  ];
  const hiddenInCategory = categoryCardIds.filter((id) => hiddenCardIds.has(id)).length;

  const visibleItems = filterItems(
    category.items,
    hiddenCardIds,
    checkBackCardIds,
    showHidden
  );

  const totalVisible =
    visibleItems.length +
    category.subsections.reduce(
      (sum, sub) =>
        sum +
        filterItems(sub.items, hiddenCardIds, checkBackCardIds, showHidden).length,
      0
    );

  const hasCardsInCategory = categoryCardIds.length > 0;

  if (
    totalVisible === 0 &&
    !category.note &&
    hiddenInCategory === 0 &&
    !hasCardsInCategory &&
    !canReorder
  ) {
    return null;
  }

  const categoryContainerId = makeContainerId({ categoryTitle: category.title });

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

      {visibleItems.length > 0 ? (
        <SortableCardList
          items={visibleItems}
          containerId={categoryContainerId}
          feedId={feedId}
          userId={userId}
          canReorder={canReorder}
          dragEnabled={dragEnabled}
          commentCounts={commentCounts}
          hiddenCardIds={hiddenCardIds}
          onToggleHideCard={onToggleHideCard}
          onCheckBackCard={onCheckBackCard}
          onCommentCountChange={onCommentCountChange}
        />
      ) : dragEnabled && canReorder ? (
        <EmptyDroppableCardList containerId={categoryContainerId} />
      ) : null}

      {category.subsections.map((sub) => {
        const visibleSubItems = filterItems(
          sub.items,
          hiddenCardIds,
          checkBackCardIds,
          showHidden
        );
        const subsectionContainerId = makeContainerId({
          categoryTitle: category.title,
          subsectionTitle: sub.title,
        });

        if (visibleSubItems.length === 0 && !(dragEnabled && canReorder)) {
          return null;
        }

        return (
          <div key={sub.title} className="subsection">
            <h4 className="subsection-title">{sub.title}</h4>
            {visibleSubItems.length > 0 ? (
              <SortableCardList
                items={visibleSubItems}
                containerId={subsectionContainerId}
                feedId={feedId}
                userId={userId}
                canReorder={canReorder}
                dragEnabled={dragEnabled}
                commentCounts={commentCounts}
                hiddenCardIds={hiddenCardIds}
                onToggleHideCard={onToggleHideCard}
                onCheckBackCard={onCheckBackCard}
                onCommentCountChange={onCommentCountChange}
              />
            ) : (
              <EmptyDroppableCardList containerId={subsectionContainerId} />
            )}
          </div>
        );
      })}
    </section>
  );
}
