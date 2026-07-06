"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedCategory, FeedItem, ParsedFeed } from "@/lib/parseFeed";
import { findFeedItem } from "@/lib/parseFeed";
import {
  clearCheckBack,
  getCheckBacksForFeed,
  setCheckBack,
  sortCheckBacks,
  updateCheckBackDate,
  type CheckBackRow,
} from "@/lib/checkback";
import {
  getHiddenCardIds,
  migrateLocalPreferencesIfNeeded,
  setCardHidden,
} from "@/lib/feedPreferences";
import { createClient } from "@/lib/supabase/client";
import { CategorySection } from "./CategorySection";
import { CheckBackDatePicker } from "./CheckBackDatePicker";
import { CheckBackStrip } from "./CheckBackStrip";
import { useAutoSaveFeed } from "@/hooks/useAutoSaveFeed";

interface FeedDisplayProps {
  feedId: string;
  feed: ParsedFeed;
  userId: string;
  canReorder: boolean;
  commentCounts: Record<string, number>;
  onFeedChange: (feed: ParsedFeed) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function countItems(feed: ParsedFeed): number {
  return feed.categories.reduce((total, cat) => {
    const subTotal = cat.subsections.reduce((s, sub) => s + sub.items.length, 0);
    return total + cat.items.length + subTotal;
  }, 0);
}

function updateCategory(
  categories: FeedCategory[],
  categoryTitle: string,
  updater: (category: FeedCategory) => FeedCategory
): FeedCategory[] {
  return categories.map((category) =>
    category.title === categoryTitle ? updater(category) : category
  );
}

export function FeedDisplay({
  feedId,
  feed,
  userId,
  canReorder,
  commentCounts,
  onFeedChange,
  onCommentCountChange,
}: FeedDisplayProps) {
  const itemCount = countItems(feed);
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [checkBacks, setCheckBacks] = useState<CheckBackRow[]>([]);
  const [showHiddenByCategory, setShowHiddenByCategory] = useState<Record<string, boolean>>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [checkBackPickerCardId, setCheckBackPickerCardId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setPrefsLoaded(false);
      setPrefsError(null);

      try {
        const supabase = createClient();
        const [hidden, checkbackRows] = await Promise.all([
          getHiddenCardIds(supabase, feedId, userId),
          getCheckBacksForFeed(supabase, feedId, userId),
        ]);

        const migrated = await migrateLocalPreferencesIfNeeded(
          supabase,
          feedId,
          userId,
          hidden,
          []
        );

        if (!cancelled) {
          setHiddenCardIds(new Set(migrated.hiddenCardIds));
          setCheckBacks(checkbackRows);
        }
      } catch {
        if (!cancelled) {
          setPrefsError("Could not load your saved preferences.");
        }
      } finally {
        if (!cancelled) {
          setPrefsLoaded(true);
        }
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [feedId, userId]);

  useAutoSaveFeed(feedId, feed, canReorder);

  const checkBackCardIds = useMemo(
    () => new Set(checkBacks.map((row) => row.card_id)),
    [checkBacks]
  );

  const checkBackEntries = useMemo(() => {
    return sortCheckBacks(checkBacks)
      .map((checkBack) => {
        const location = findFeedItem(feed, checkBack.card_id);
        if (!location) return null;
        return { checkBack, location };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [checkBacks, feed]);

  const checkBackPickerItem = checkBackPickerCardId
    ? findFeedItem(feed, checkBackPickerCardId)
    : null;

  const handleToggleHideCard = useCallback(
    async (cardId: string) => {
      const isHidden = hiddenCardIds.has(cardId);
      const nextHidden = !isHidden;

      setHiddenCardIds((prev) => {
        const next = new Set(prev);
        if (nextHidden) {
          next.add(cardId);
        } else {
          next.delete(cardId);
        }
        return next;
      });

      try {
        const supabase = createClient();
        await setCardHidden(supabase, feedId, userId, cardId, nextHidden);
        setPrefsError(null);
      } catch {
        setHiddenCardIds((prev) => {
          const next = new Set(prev);
          if (isHidden) {
            next.add(cardId);
          } else {
            next.delete(cardId);
          }
          return next;
        });
        setPrefsError("Could not save card visibility.");
      }
    },
    [feedId, userId, hiddenCardIds]
  );

  const handleSetCheckBack = useCallback(
    async (cardId: string, date: string, note: string) => {
      try {
        const supabase = createClient();
        const row = await setCheckBack(supabase, {
          feedId,
          userId,
          cardId,
          checkBackUntil: date,
          note,
        });
        setCheckBacks((prev) => {
          const next = prev.filter((item) => item.card_id !== cardId);
          return [...next, row];
        });
        setCheckBackPickerCardId(null);
        setPrefsError(null);
      } catch {
        setPrefsError("Could not save check back.");
      }
    },
    [feedId, userId]
  );

  const handleDoneCheckBack = useCallback(
    async (cardId: string) => {
      try {
        const supabase = createClient();
        await clearCheckBack(supabase, feedId, userId, cardId);
        setCheckBacks((prev) => prev.filter((row) => row.card_id !== cardId));
        setPrefsError(null);
      } catch {
        setPrefsError("Could not clear check back.");
      }
    },
    [feedId, userId]
  );

  const handleExtendCheckBack = useCallback(
    async (cardId: string, date: string) => {
      try {
        const supabase = createClient();
        await updateCheckBackDate(supabase, feedId, userId, cardId, date);
        setCheckBacks((prev) =>
          prev.map((row) =>
            row.card_id === cardId ? { ...row, check_back_until: date } : row
          )
        );
        setPrefsError(null);
      } catch {
        setPrefsError("Could not update check back date.");
      }
    },
    [feedId, userId]
  );

  const handleToggleShowHidden = useCallback((categoryTitle: string) => {
    setShowHiddenByCategory((prev) => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle],
    }));
  }, []);

  const handleReorderItems = (categoryTitle: string, items: FeedItem[]) => {
    onFeedChange({
      ...feed,
      categories: updateCategory(feed.categories, categoryTitle, (category) => ({
        ...category,
        items,
      })),
    });
  };

  const handleReorderSubsectionItems = (
    categoryTitle: string,
    subsectionTitle: string,
    items: FeedItem[]
  ) => {
    onFeedChange({
      ...feed,
      categories: updateCategory(feed.categories, categoryTitle, (category) => ({
        ...category,
        subsections: category.subsections.map((subsection) =>
          subsection.title === subsectionTitle
            ? { ...subsection, items }
            : subsection
        ),
      })),
    });
  };

  if (!prefsLoaded) {
    return <p className="comments-loading">Loading feed...</p>;
  }

  return (
    <>
      {prefsError && <div className="error-msg">{prefsError}</div>}

      <header className="feed-header">
        <div className="feed-header-main">
          <h2>{feed.title}</h2>
          {feed.meta.length > 0 && (
            <div className="feed-meta">
              {feed.meta.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          )}
        </div>

        <div className="stats-bar">
          <div className="stat">
            <strong>{feed.categories.length}</strong> categories
          </div>
          <div className="stat">
            <strong>{itemCount}</strong> items
          </div>
        </div>
      </header>

      <CheckBackStrip
        entries={checkBackEntries}
        feedId={feedId}
        userId={userId}
        commentCounts={commentCounts}
        onDone={handleDoneCheckBack}
        onExtend={handleExtendCheckBack}
        onCommentCountChange={onCommentCountChange}
      />

      {feed.categories.map((category) => (
        <CategorySection
          key={category.title}
          category={category}
          feedId={feedId}
          userId={userId}
          canReorder={canReorder}
          commentCounts={commentCounts}
          hiddenCardIds={hiddenCardIds}
          checkBackCardIds={checkBackCardIds}
          showHidden={!!showHiddenByCategory[category.title]}
          onToggleShowHidden={() => handleToggleShowHidden(category.title)}
          onToggleHideCard={handleToggleHideCard}
          onCheckBackCard={setCheckBackPickerCardId}
          onReorderItems={(items) => handleReorderItems(category.title, items)}
          onReorderSubsectionItems={(subsectionTitle, items) =>
            handleReorderSubsectionItems(category.title, subsectionTitle, items)
          }
          onCommentCountChange={onCommentCountChange}
        />
      ))}

      {feed.footer && (
        <p className="category-note feed-footer">{feed.footer}</p>
      )}

      {checkBackPickerItem && (
        <CheckBackDatePicker
          cardTitle={checkBackPickerItem.item.title}
          onConfirm={(date, note) =>
            handleSetCheckBack(checkBackPickerItem.item.id, date, note)
          }
          onCancel={() => setCheckBackPickerCardId(null)}
        />
      )}
    </>
  );
}
