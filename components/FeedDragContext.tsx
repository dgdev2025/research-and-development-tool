"use client";

import { createContext, useContext, type ReactNode } from "react";

interface FeedDragContextValue {
  activeId: string | null;
  overId: string | null;
}

const FeedDragContext = createContext<FeedDragContextValue>({
  activeId: null,
  overId: null,
});

export function FeedDragProvider({
  activeId,
  overId,
  children,
}: FeedDragContextValue & { children: ReactNode }) {
  return (
    <FeedDragContext.Provider value={{ activeId, overId }}>
      {children}
    </FeedDragContext.Provider>
  );
}

export function useFeedDrag() {
  return useContext(FeedDragContext);
}
