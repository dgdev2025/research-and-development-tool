"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FeedItem } from "@/lib/parseFeed";
import { isContainerId, makeContainerEndId, parseContainerId } from "@/lib/feedDragDrop";
import { ItemCard } from "./ItemCard";
import { useFeedDrag } from "./FeedDragContext";

function CardDropPlaceholder() {
  return <div className="card-drop-placeholder" aria-hidden="true" />;
}

function EndDropZone({ containerEndId }: { containerEndId: string }) {
  const { overId } = useFeedDrag();
  const { setNodeRef, isOver } = useDroppable({ id: containerEndId });
  const isActive = isOver || overId === containerEndId;

  return (
    <div
      ref={setNodeRef}
      className={`card-drop-zone-end${isActive ? " is-active" : ""}`}
      aria-hidden="true"
    >
      {isActive && <CardDropPlaceholder />}
    </div>
  );
}

interface SortableCardListProps {
  items: FeedItem[];
  containerId: string;
  feedId: string;
  userId: string;
  canReorder: boolean;
  dragEnabled: boolean;
  commentCounts: Record<string, number>;
  hiddenCardIds: Set<string>;
  onToggleHideCard: (cardId: string) => void;
  onCheckBackCard?: (cardId: string) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function SortableCard({
  item,
  feedId,
  userId,
  canReorder,
  commentCount,
  isHidden,
  onToggleHideCard,
  onCheckBackCard,
  onCommentCountChange,
}: {
  item: FeedItem;
  feedId: string;
  userId: string;
  canReorder: boolean;
  commentCount: number;
  isHidden: boolean;
  onToggleHideCard: (cardId: string) => void;
  onCheckBackCard?: (cardId: string) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !canReorder });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-card${isDragging ? " dragging" : ""}`}
    >
      {canReorder && (
        <button
          type="button"
          className="drag-handle"
          aria-label={`Drag to reorder ${item.title}`}
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>
      )}
      <ItemCard
        item={item}
        feedId={feedId}
        userId={userId}
        commentCount={commentCount}
        canReorder={canReorder}
        isHidden={isHidden}
        onToggleHide={() => onToggleHideCard(item.id)}
        onCheckBack={
          onCheckBackCard ? () => onCheckBackCard(item.id) : undefined
        }
        onCommentAdded={() => onCommentCountChange(item.id, 1)}
      />
    </div>
  );
}

function StaticCardList({
  items,
  feedId,
  userId,
  commentCounts,
  hiddenCardIds,
  onToggleHideCard,
  onCheckBackCard,
  onCommentCountChange,
}: {
  items: FeedItem[];
  feedId: string;
  userId: string;
  commentCounts: Record<string, number>;
  hiddenCardIds: Set<string>;
  onToggleHideCard: (cardId: string) => void;
  onCheckBackCard?: (cardId: string) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}) {
  return (
    <div className="cards-list">
      {items.map((item) => (
        <div key={item.id} className="sortable-card">
          <ItemCard
            item={item}
            feedId={feedId}
            userId={userId}
            commentCount={commentCounts[item.id] ?? 0}
            isHidden={hiddenCardIds.has(item.id)}
            onToggleHide={() => onToggleHideCard(item.id)}
            onCheckBack={
              onCheckBackCard ? () => onCheckBackCard(item.id) : undefined
            }
            onCommentAdded={() => onCommentCountChange(item.id, 1)}
          />
        </div>
      ))}
    </div>
  );
}

function DroppableCardList({
  containerId,
  isEmpty,
  showEndPlaceholder,
  showEndDropZone = false,
  containerEndId = null,
  children,
}: {
  containerId: string;
  isEmpty: boolean;
  showEndPlaceholder: boolean;
  showEndDropZone?: boolean;
  containerEndId?: string | null;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: containerId });

  return (
    <div
      ref={setNodeRef}
      className={`cards-list${isEmpty ? " cards-list-empty" : ""}${
        isOver ? " cards-list-drop-target" : ""
      }`}
    >
      {children}
      {showEndPlaceholder && <CardDropPlaceholder />}
      {showEndDropZone && containerEndId && (
        <EndDropZone containerEndId={containerEndId} />
      )}
      {isEmpty && !showEndPlaceholder && (
        <p className="cards-list-empty-hint" aria-hidden="true">
          Drop cards here
        </p>
      )}
    </div>
  );
}

export function EmptyDroppableCardList({ containerId }: { containerId: string }) {
  const { activeId, overId } = useFeedDrag();
  const containerRef = parseContainerId(containerId);
  const containerEndId = containerRef ? makeContainerEndId(containerRef) : null;
  const showEndPlaceholder = Boolean(
    activeId &&
      containerEndId &&
      overId === containerId &&
      isContainerId(overId)
  );

  return (
    <DroppableCardList
      containerId={containerId}
      isEmpty
      showEndPlaceholder={showEndPlaceholder}
      showEndDropZone={Boolean(activeId && containerEndId)}
      containerEndId={containerEndId}
    >
      {null}
    </DroppableCardList>
  );
}

export function SortableCardList({
  items,
  containerId,
  feedId,
  userId,
  canReorder,
  dragEnabled,
  commentCounts,
  hiddenCardIds,
  onToggleHideCard,
  onCheckBackCard,
  onCommentCountChange,
}: SortableCardListProps) {
  const { activeId, overId } = useFeedDrag();
  const activeInThisList = Boolean(activeId && items.some((item) => item.id === activeId));
  const containerRef = parseContainerId(containerId);
  const containerEndId = containerRef ? makeContainerEndId(containerRef) : null;
  const lastItemId = items[items.length - 1]?.id;
  const showEndPlaceholder = Boolean(
    activeId && !activeInThisList && lastItemId && overId === lastItemId
  );
  const showEndDropZone = Boolean(activeId && !activeInThisList && containerEndId);

  const shouldShowPlaceholderBefore = (itemId: string) => {
    if (!activeId || !overId || overId !== itemId || activeId === itemId) {
      return false;
    }

    if (activeInThisList) {
      return false;
    }

    if (itemId === lastItemId) {
      return false;
    }

    return true;
  };

  if (!dragEnabled || !canReorder) {
    return (
      <StaticCardList
        items={items}
        feedId={feedId}
        userId={userId}
        commentCounts={commentCounts}
        hiddenCardIds={hiddenCardIds}
        onToggleHideCard={onToggleHideCard}
        onCheckBackCard={onCheckBackCard}
        onCommentCountChange={onCommentCountChange}
      />
    );
  }

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <DroppableCardList
        containerId={containerId}
        isEmpty={items.length === 0}
        showEndPlaceholder={showEndPlaceholder}
        showEndDropZone={showEndDropZone}
        containerEndId={containerEndId}
      >
        {items.map((item) => (
          <div key={item.id} className="sortable-card-slot">
            {shouldShowPlaceholderBefore(item.id) && <CardDropPlaceholder />}
            <SortableCard
              item={item}
              feedId={feedId}
              userId={userId}
              canReorder={canReorder}
              commentCount={commentCounts[item.id] ?? 0}
              isHidden={hiddenCardIds.has(item.id)}
              onToggleHideCard={onToggleHideCard}
              onCheckBackCard={onCheckBackCard}
              onCommentCountChange={onCommentCountChange}
            />
          </div>
        ))}
      </DroppableCardList>
    </SortableContext>
  );
}
