"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { ParsedFeed } from "@/lib/parseFeed";
import { moveCardInFeed } from "@/lib/feedDragDrop";

interface FeedDragDropProviderProps {
  enabled: boolean;
  feed: ParsedFeed;
  onFeedChange: (feed: ParsedFeed) => void;
  children: ReactNode;
}

export function FeedDragDropProvider({
  enabled,
  feed,
  onFeedChange,
  children,
}: FeedDragDropProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const nextFeed = moveCardInFeed(
      feed,
      String(active.id),
      String(over.id)
    );
    if (nextFeed) {
      onFeedChange(nextFeed);
    }
  };

  if (!enabled || !mounted) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
}
