"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ParsedFeed } from "@/lib/parseFeed";
import { findFeedItem } from "@/lib/parseFeed";
import {
  clearCheckBack,
  getCheckBacksForFeed,
  getCheckBackStatus,
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
import {
  getCardOpenStates,
  getFeedPanelViewState,
  migrateLocalCardOpenStatesIfNeeded,
  resolveCardOpen,
  setCardOpenState,
  setFeedPanelViewState,
} from "@/lib/feedViewState";
import { createClient } from "@/lib/supabase/client";
import { CategorySection } from "./CategorySection";
import { CheckBackDatePicker } from "./CheckBackDatePicker";
import { CheckBackStrip } from "./CheckBackStrip";
import { FeedDragDropProvider } from "./FeedDragDropProvider";
import { FeedNote } from "./FeedNote";
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

function getDueCardIdsFromRows(rows: CheckBackRow[]): string[] {
  return rows
    .filter((row) => {
      const status = getCheckBackStatus(row.check_back_until);
      return status === "overdue" || status === "due_today";
    })
    .map((row) => row.card_id);
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
  const searchParams = useSearchParams();
  const itemCount = countItems(feed);
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [checkBacks, setCheckBacks] = useState<CheckBackRow[]>([]);
  const [cardOpenStates, setCardOpenStates] = useState<Record<string, boolean>>({});
  const [checkBackStripOpen, setCheckBackStripOpen] = useState(false);
  const [expandedCheckBackCardIds, setExpandedCheckBackCardIds] = useState<Set<string>>(
    new Set()
  );
  const [showHiddenByCategory, setShowHiddenByCategory] = useState<Record<string, boolean>>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [checkBackPickerCardId, setCheckBackPickerCardId] = useState<string | null>(
    null
  );
  const targetCardId = searchParams.get("card");

  const persistPanelViewState = useCallback(
    async (stripOpen: boolean, expandedIds: string[]) => {
      const supabase = createClient();
      await setFeedPanelViewState(supabase, feedId, userId, {
        checkbackStripOpen: stripOpen,
        expandedCheckBackCardIds: expandedIds,
      });
    },
    [feedId, userId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setPrefsLoaded(false);
      setPrefsError(null);

      try {
        const supabase = createClient();
        const [hidden, checkbackRows, openStates, panelState] = await Promise.all([
          getHiddenCardIds(supabase, feedId, userId),
          getCheckBacksForFeed(supabase, feedId, userId),
          getCardOpenStates(supabase, feedId, userId),
          getFeedPanelViewState(supabase, feedId, userId),
        ]);

        const migrated = await migrateLocalPreferencesIfNeeded(
          supabase,
          feedId,
          userId,
          hidden,
          []
        );
        const migratedOpenStates = await migrateLocalCardOpenStatesIfNeeded(
          supabase,
          feedId,
          userId,
          openStates
        );

        const dueCardIds = getDueCardIdsFromRows(checkbackRows);
        const stripOpen =
          panelState.checkbackStripOpen ?? (dueCardIds.length > 0 ? true : false);
        const expandedIds = new Set([
          ...panelState.expandedCheckBackCardIds,
          ...dueCardIds,
        ]);

        if (!cancelled) {
          setHiddenCardIds(new Set(migrated.hiddenCardIds));
          setCheckBacks(checkbackRows);
          setCardOpenStates(migratedOpenStates);
          setCheckBackStripOpen(stripOpen);
          setExpandedCheckBackCardIds(expandedIds);
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

  const dueCardIds = useMemo(
    () => getDueCardIdsFromRows(checkBacks),
    [checkBacks]
  );

  useEffect(() => {
    if (!prefsLoaded || dueCardIds.length === 0) return;

    const missingDue = dueCardIds.filter((cardId) => !expandedCheckBackCardIds.has(cardId));
    if (missingDue.length === 0 && checkBackStripOpen) return;

    const nextExpanded = new Set([...expandedCheckBackCardIds, ...dueCardIds]);
    setCheckBackStripOpen(true);
    setExpandedCheckBackCardIds(nextExpanded);

    persistPanelViewState(true, [...nextExpanded]).catch(() => {
      setPrefsError("Could not save your view preferences.");
    });
  }, [
    checkBackStripOpen,
    dueCardIds,
    expandedCheckBackCardIds,
    persistPanelViewState,
    prefsLoaded,
  ]);

  useEffect(() => {
    if (!targetCardId) return;
    if (!checkBacks.some((row) => row.card_id === targetCardId)) return;

    if (!checkBackStripOpen) {
      setCheckBackStripOpen(true);
    }

    if (expandedCheckBackCardIds.has(targetCardId)) return;

    const nextExpanded = new Set(expandedCheckBackCardIds);
    nextExpanded.add(targetCardId);
    setExpandedCheckBackCardIds(nextExpanded);
  }, [checkBackStripOpen, checkBacks, expandedCheckBackCardIds, targetCardId]);

  const feedSaveStatus = useAutoSaveFeed(feedId, feed, canReorder);

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

  const handleToggleCardOpen = useCallback(
    async (cardId: string, defaultOpen = true) => {
      const currentOpen = resolveCardOpen(cardOpenStates, cardId, defaultOpen);
      const nextOpen = !currentOpen;

      setCardOpenStates((prev) => {
        const next = { ...prev };
        if (nextOpen === defaultOpen) {
          delete next[cardId];
        } else {
          next[cardId] = nextOpen;
        }
        return next;
      });

      try {
        const supabase = createClient();
        await setCardOpenState(
          supabase,
          feedId,
          userId,
          cardId,
          nextOpen,
          defaultOpen
        );
        setPrefsError(null);
      } catch {
        setCardOpenStates((prev) => {
          const next = { ...prev };
          if (currentOpen === defaultOpen) {
            delete next[cardId];
          } else {
            next[cardId] = currentOpen;
          }
          return next;
        });
        setPrefsError("Could not save card open state.");
      }
    },
    [cardOpenStates, feedId, userId]
  );

  const handleToggleCheckBackStrip = useCallback(async () => {
    const nextOpen = !checkBackStripOpen;
    setCheckBackStripOpen(nextOpen);

    try {
      await persistPanelViewState(nextOpen, [...expandedCheckBackCardIds]);
      setPrefsError(null);
    } catch {
      setCheckBackStripOpen(!nextOpen);
      setPrefsError("Could not save check back panel state.");
    }
  }, [checkBackStripOpen, expandedCheckBackCardIds, persistPanelViewState]);

  const handleToggleCheckBackEntry = useCallback(
    async (cardId: string) => {
      const nextExpanded = new Set(expandedCheckBackCardIds);
      if (nextExpanded.has(cardId)) {
        nextExpanded.delete(cardId);
      } else {
        nextExpanded.add(cardId);
      }

      setExpandedCheckBackCardIds(nextExpanded);

      try {
        await persistPanelViewState(checkBackStripOpen, [...nextExpanded]);
        setPrefsError(null);
      } catch {
        setExpandedCheckBackCardIds(expandedCheckBackCardIds);
        setPrefsError("Could not save check back entry state.");
      }
    },
    [checkBackStripOpen, expandedCheckBackCardIds, persistPanelViewState]
  );

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

  const handleNoteChange = useCallback(
    (note: string) => {
      onFeedChange({
        ...feed,
        note: note.trim() ? note : undefined,
      });
    },
    [feed, onFeedChange]
  );

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

      <FeedNote
        note={feed.note}
        canEdit={canReorder}
        saveStatus={feedSaveStatus}
        onChange={handleNoteChange}
      />

      <CheckBackStrip
        entries={checkBackEntries}
        feedId={feedId}
        userId={userId}
        commentCounts={commentCounts}
        cardOpenStates={cardOpenStates}
        forcedOpenCardId={targetCardId}
        stripOpen={checkBackStripOpen}
        expandedEntryIds={expandedCheckBackCardIds}
        onToggleStrip={handleToggleCheckBackStrip}
        onToggleEntry={handleToggleCheckBackEntry}
        onToggleCardOpen={handleToggleCardOpen}
        onDone={handleDoneCheckBack}
        onExtend={handleExtendCheckBack}
        onCommentCountChange={onCommentCountChange}
      />

      <FeedDragDropProvider
        enabled={canReorder}
        feed={feed}
        onFeedChange={onFeedChange}
      >
        {feed.categories.map((category) => (
          <CategorySection
            key={category.title}
            category={category}
            feedId={feedId}
            userId={userId}
            canReorder={canReorder}
            dragEnabled={canReorder}
            commentCounts={commentCounts}
            hiddenCardIds={hiddenCardIds}
            checkBackCardIds={checkBackCardIds}
            cardOpenStates={cardOpenStates}
            forcedOpenCardId={targetCardId}
            onToggleCardOpen={handleToggleCardOpen}
            showHidden={!!showHiddenByCategory[category.title]}
            onToggleShowHidden={() => handleToggleShowHidden(category.title)}
            onToggleHideCard={handleToggleHideCard}
            onCheckBackCard={setCheckBackPickerCardId}
            onCommentCountChange={onCommentCountChange}
          />
        ))}
      </FeedDragDropProvider>

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
