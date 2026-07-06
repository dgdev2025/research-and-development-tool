"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateFeedContent } from "@/lib/feeds";
import type { ParsedFeed } from "@/lib/parseFeed";

export type FeedSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export function useAutoSaveFeed(
  feedId: string,
  feed: ParsedFeed,
  enabled: boolean
): FeedSaveStatus {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetStatusRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<FeedSaveStatus>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const serialized = JSON.stringify(feed);

    if (!initializedRef.current) {
      lastSavedRef.current = serialized;
      initializedRef.current = true;
      return;
    }

    if (serialized === lastSavedRef.current) return;

    setStatus("pending");

    if (timerRef.current) clearTimeout(timerRef.current);
    if (resetStatusRef.current) clearTimeout(resetStatusRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus("saving");

      try {
        const supabase = createClient();
        await updateFeedContent(supabase, feedId, feed);
        lastSavedRef.current = serialized;
        setStatus("saved");

        resetStatusRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2500);
      } catch (err) {
        console.error("Failed to save feed:", err);
        setStatus("error");
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [feed, feedId, enabled]);

  useEffect(() => {
    return () => {
      if (resetStatusRef.current) clearTimeout(resetStatusRef.current);
    };
  }, []);

  return status;
}
