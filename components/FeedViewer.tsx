"use client";

import { useState } from "react";
import type { ParsedFeed } from "@/lib/parseFeed";
import { FeedDisplay } from "@/components/FeedDisplay";

interface FeedViewerProps {
  feedId: string;
  initialFeed: ParsedFeed;
  userId: string;
  canReorder: boolean;
  initialCommentCounts: Record<string, number>;
}

export function FeedViewer({
  feedId,
  initialFeed,
  userId,
  canReorder,
  initialCommentCounts,
}: FeedViewerProps) {
  const [feed, setFeed] = useState(initialFeed);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);

  const handleCommentCountChange = (cardId: string, delta: number) => {
    setCommentCounts((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] ?? 0) + delta,
    }));
  };

  return (
    <FeedDisplay
      feedId={feedId}
      feed={feed}
      userId={userId}
      canReorder={canReorder}
      commentCounts={commentCounts}
      onFeedChange={setFeed}
      onCommentCountChange={handleCommentCountChange}
    />
  );
}
