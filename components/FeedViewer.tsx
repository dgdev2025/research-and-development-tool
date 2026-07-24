"use client";

import { useEffect, useState } from "react";
import type { ParsedFeed } from "@/lib/parseFeed";
import { createClient } from "@/lib/supabase/client";
import { prefetchMentionableProfiles } from "@/lib/mentions";
import { FeedDisplay } from "@/components/FeedDisplay";

interface FeedViewerProps {
  feedId: string;
  feedTitle: string;
  initialFeed: ParsedFeed;
  userId: string;
  canReorder: boolean;
  initialCommentCounts: Record<string, number>;
}

export function FeedViewer({
  feedId,
  feedTitle,
  initialFeed,
  userId,
  canReorder,
  initialCommentCounts,
}: FeedViewerProps) {
  const [feed, setFeed] = useState(initialFeed);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);

  useEffect(() => {
    const supabase = createClient();
    void prefetchMentionableProfiles(supabase);
  }, []);

  const handleCommentCountChange = (cardId: string, delta: number) => {
    setCommentCounts((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] ?? 0) + delta,
    }));
  };

  return (
    <FeedDisplay
      feedId={feedId}
      feedTitle={feedTitle}
      feed={feed}
      userId={userId}
      canReorder={canReorder}
      commentCounts={commentCounts}
      onFeedChange={setFeed}
      onCommentCountChange={handleCommentCountChange}
    />
  );
}
