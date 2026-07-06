"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { ParsedFeed } from "@/lib/parseFeed";
import { findFeedItem } from "@/lib/parseFeed";
import { moveCardInFeed } from "@/lib/feedDragDrop";
import { DragCardPreview } from "./DragCardPreview";
import { FeedDragProvider } from "./FeedDragContext";

interface FeedDragDropProviderProps {
  enabled: boolean;
  feed: ParsedFeed;
  onFeedChange: (feed: ParsedFeed) => void;
  children: ReactNode;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export function FeedDragDropProvider({
  enabled,
  feed,
  onFeedChange,
  children,
}: FeedDragDropProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = activeId ? findFeedItem(feed, activeId)?.item ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setOverId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  };

  const clearDragState = () => {
    setActiveId(null);
    setOverId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const nextFeed = moveCardInFeed(feed, String(active.id), String(over.id));
      if (nextFeed) {
        onFeedChange(nextFeed);
      }
    }

    clearDragState();
  };

  if (!enabled || !mounted) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <FeedDragProvider activeId={activeId} overId={overId}>
        {children}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? <DragCardPreview item={activeItem} /> : null}
        </DragOverlay>
      </FeedDragProvider>
    </DndContext>
  );
}
