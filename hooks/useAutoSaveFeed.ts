"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateFeedContent } from "@/lib/feeds";
import type { ParsedFeed } from "@/lib/parseFeed";

export function useAutoSaveFeed(feedId: string, feed: ParsedFeed, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(feed);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        await updateFeedContent(supabase, feedId, feed);
        lastSavedRef.current = serialized;
      } catch (err) {
        console.error("Failed to save feed:", err);
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [feed, feedId, enabled]);
}
