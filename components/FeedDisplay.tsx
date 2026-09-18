"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ParsedFeed } from "@/lib/parseFeed";
import {
  addFeedItem,
  findFeedItem,
  listFeedHeadlines,
  moveFeedItem,
  removeFeedItem,
} from "@/lib/parseFeed";
import {
  clearCheckBack,
  clearFeedCheckBack,
  createFeedCheckBack,
  getAllCheckBacks,
  getAllFeedCheckBacks,
  setCheckBack,
  sortCheckBacks,
  updateCheckBackDate,
  updateFeedCheckBackDate,
  type CheckBackRow,
  type FeedCheckBackRow,
} from "@/lib/checkback";
import { getCommentCountsByFeed } from "@/lib/comments";
import { getFeedsByIds, updateFeedContent } from "@/lib/feeds";
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
import { CheckBackStrip, type FeedCheckBackEntry } from "./CheckBackStrip";
import { FeedDragDropProvider } from "./FeedDragDropProvider";
import { FeedNote } from "./FeedNote";
import { MoveCardModal } from "./MoveCardModal";
import { LinkifiedText } from "./LinkifiedText";
import { useAutoSaveFeed } from "@/hooks/useAutoSaveFeed";

interface FeedDisplayProps {
  feedId: string;
  feedTitle: string;
  feed: ParsedFeed;
  userId: string;
  canReorder: boolean;
  commentCounts: Record<string, number>;
  onFeedChange: (feed: ParsedFeed) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
  onEditCard?: (cardId: string) => void;
}

function countItems(feed: ParsedFeed): number {
  return feed.categories.reduce((total, cat) => {
    const subTotal = cat.subsections.reduce((s, sub) => s + sub.items.length, 0);
    return total + cat.items.length + subTotal;
  }, 0);
}

export function FeedDisplay({
  feedId,
  feedTitle,
  feed,
  userId,
  canReorder,
  commentCounts,
  onFeedChange,
  onCommentCountChange,
  onEditCard,
}: FeedDisplayProps) {
  const searchParams = useSearchParams();
  const itemCount = countItems(feed);
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [checkBacks, setCheckBacks] = useState<CheckBackRow[]>([]);
  const [feedCheckBacks, setFeedCheckBacks] = useState<FeedCheckBackRow[]>([]);
  const [showFeedCheckBackPicker, setShowFeedCheckBackPicker] = useState(false);
  const [moveCheckBackId, setMoveCheckBackId] = useState<string | null>(null);
  const [checkBackFeedMap, setCheckBackFeedMap] = useState<
    Record<string, { title: string; content: ParsedFeed }>
  >({});
  const [crossFeedCommentCounts, setCrossFeedCommentCounts] = useState<
    Record<string, number>
  >({});
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
        const [hidden, checkbackRows, feedCheckbackRows, openStates, panelState] =
          await Promise.all([
            getHiddenCardIds(supabase, feedId, userId),
            getAllCheckBacks(supabase),
            // Feed-level check backs need add_feed_checkbacks.sql; don't block the feed without it.
            getAllFeedCheckBacks(supabase).catch(() => [] as FeedCheckBackRow[]),
            getCardOpenStates(supabase, feedId, userId),
            getFeedPanelViewState(supabase, feedId, userId),
          ]);

        const otherFeedIds = [
          ...new Set(
            [...checkbackRows, ...feedCheckbackRows]
              .map((row) => row.feed_id)
              .filter((id) => id && id !== feedId)
          ),
        ];

        const otherFeeds = await getFeedsByIds(supabase, otherFeedIds);
        const otherCountsList = await Promise.all(
          otherFeedIds.map((id) => getCommentCountsByFeed(supabase, id))
        );

        const nextFeedMap: Record<string, { title: string; content: ParsedFeed }> = {
          [feedId]: { title: feedTitle, content: feed },
        };
        for (const row of otherFeeds) {
          nextFeedMap[row.id] = {
            title: row.title,
            content: row.content as ParsedFeed,
          };
        }

        const nextCrossCounts: Record<string, number> = {};
        for (const counts of otherCountsList) {
          Object.assign(nextCrossCounts, counts);
        }

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

        // Strip stays collapsed by default; only reopen if the user left it open.
        const stripOpen = panelState.checkbackStripOpen ?? false;
        const expandedIds = new Set(panelState.expandedCheckBackCardIds);

        if (!cancelled) {
          setHiddenCardIds(new Set(migrated.hiddenCardIds));
          setCheckBacks(checkbackRows);
          setFeedCheckBacks(feedCheckbackRows);
          setCheckBackFeedMap(nextFeedMap);
          setCrossFeedCommentCounts(nextCrossCounts);
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
  }, [feedId, feedTitle, userId]);

  // Hidden cards are shared per feed; keep everyone's view in sync while the feed is open.
  useEffect(() => {
    const supabase = createClient();

    const refreshHiddenCards = async () => {
      try {
        const ids = await getHiddenCardIds(supabase, feedId);
        setHiddenCardIds(new Set(ids));
      } catch {
        // Keep the current state; the next change or reload will resync.
      }
    };

    const channel = supabase
      .channel(`hidden-cards-${feedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_hidden_cards",
          filter: `feed_id=eq.${feedId}`,
        },
        () => void refreshHiddenCards()
      )
      // Delete events can't be filtered by column, so refetch on any unhide.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_hidden_cards" },
        () => void refreshHiddenCards()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [feedId]);

  // Keep the current feed's content in the check-back map when admins reorder/edit.
  useEffect(() => {
    setCheckBackFeedMap((prev) => ({
      ...prev,
      [feedId]: { title: feedTitle, content: feed },
    }));
  }, [feed, feedId, feedTitle]);

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
    () =>
      new Set(
        checkBacks
          .filter((row) => row.feed_id === feedId)
          .map((row) => row.card_id)
      ),
    [checkBacks, feedId]
  );

  const mergedCommentCounts = useMemo(
    () => ({ ...crossFeedCommentCounts, ...commentCounts }),
    [commentCounts, crossFeedCommentCounts]
  );

  const checkBackEntries = useMemo(() => {
    return sortCheckBacks(checkBacks)
      .map((checkBack) => {
        const source =
          checkBack.feed_id === feedId
            ? { title: feedTitle, content: feed }
            : checkBackFeedMap[checkBack.feed_id];
        if (!source) return null;

        const location = findFeedItem(source.content, checkBack.card_id);
        if (!location) return null;

        return {
          checkBack,
          location,
          feedTitle: source.title,
          sourceFeedId: checkBack.feed_id,
          isForeignFeed: checkBack.feed_id !== feedId,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [checkBackFeedMap, checkBacks, feed, feedId, feedTitle]);

  const feedCheckBackEntries = useMemo<FeedCheckBackEntry[]>(() => {
    return sortCheckBacks(feedCheckBacks).map((checkBack) => ({
      checkBack,
      feedTitle:
        checkBack.feed_id === feedId
          ? feedTitle
          : checkBackFeedMap[checkBack.feed_id]?.title ?? "Another feed",
      sourceFeedId: checkBack.feed_id,
      isForeignFeed: checkBack.feed_id !== feedId,
    }));
  }, [checkBackFeedMap, feedCheckBacks, feedId, feedTitle]);

  const feedHeadlines = useMemo(() => listFeedHeadlines(feed), [feed]);

  const moveCheckBackEntry = moveCheckBackId
    ? checkBackEntries.find((entry) => entry.checkBack.id === moveCheckBackId) ?? null
    : null;

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
          const next = prev.filter(
            (item) => !(item.card_id === cardId && item.feed_id === feedId)
          );
          return [...next, row];
        });
        setCheckBackFeedMap((prev) => ({
          ...prev,
          [feedId]: { title: feedTitle, content: feed },
        }));
        setCheckBackPickerCardId(null);
        setPrefsError(null);
      } catch {
        setPrefsError("Could not save check back.");
      }
    },
    [feed, feedId, feedTitle, userId]
  );

  const handleDoneCheckBack = useCallback(async (checkBackId: string) => {
    try {
      const supabase = createClient();
      await clearCheckBack(supabase, checkBackId);
      setCheckBacks((prev) => prev.filter((row) => row.id !== checkBackId));
      setPrefsError(null);
    } catch {
      setPrefsError("Could not clear check back.");
    }
  }, []);

  const handleExtendCheckBack = useCallback(
    async (checkBackId: string, date: string) => {
      try {
        const supabase = createClient();
        await updateCheckBackDate(supabase, checkBackId, date);
        setCheckBacks((prev) =>
          prev.map((row) =>
            row.id === checkBackId ? { ...row, check_back_until: date } : row
          )
        );
        setPrefsError(null);
      } catch {
        setPrefsError("Could not update check back date.");
      }
    },
    []
  );

  const handleMoveCheckBackCard = useCallback(
    async (
      checkBackId: string,
      target: { categoryTitle: string; subsectionTitle?: string }
    ) => {
      const row = checkBacks.find((item) => item.id === checkBackId);
      if (!row) return;

      const supabase = createClient();

      // Moving files the card back into the feed, so the check back is done with.
      if (row.feed_id === feedId) {
        const nextFeed = moveFeedItem(feed, row.card_id, target);
        await updateFeedContent(supabase, feedId, nextFeed);
        await clearCheckBack(supabase, checkBackId);
        setCheckBacks((prev) => prev.filter((item) => item.id !== checkBackId));
        onFeedChange(nextFeed);
        setMoveCheckBackId(null);
        setPrefsError(null);
        return;
      }

      const source = checkBackFeedMap[row.feed_id];
      if (!source) {
        throw new Error("Could not load the feed this card came from.");
      }

      const { feed: nextSource, item } = removeFeedItem(source.content, row.card_id);
      if (!item) {
        throw new Error("Could not find this card in its feed.");
      }

      // Re-home comments and card state first: if this fails nothing has moved yet.
      const { error: moveError } = await supabase.rpc("move_card_to_feed", {
        p_card_id: row.card_id,
        p_from_feed_id: row.feed_id,
        p_to_feed_id: feedId,
      });
      if (moveError) {
        throw new Error(
          "Could not move the card's comments. Make sure add_move_card_between_feeds.sql has been run in Supabase."
        );
      }

      const nextFeed = addFeedItem(feed, item, target);
      await updateFeedContent(supabase, feedId, nextFeed);
      await updateFeedContent(supabase, row.feed_id, nextSource);
      await clearCheckBack(supabase, checkBackId);

      const sourceFeedId = row.feed_id;
      setCheckBackFeedMap((prev) => ({
        ...prev,
        [sourceFeedId]: { ...source, content: nextSource },
      }));
      setCheckBacks((prev) => prev.filter((item) => item.id !== checkBackId));
      onFeedChange(nextFeed);
      setMoveCheckBackId(null);
      setPrefsError(null);
    },
    [checkBackFeedMap, checkBacks, feed, feedId, onFeedChange]
  );

  const handleAddFeedCheckBack = useCallback(
    async (title: string, date: string, note: string) => {
      try {
        const supabase = createClient();
        const row = await createFeedCheckBack(supabase, {
          feedId,
          userId,
          title,
          checkBackUntil: date,
          note,
        });
        setFeedCheckBacks((prev) => [...prev, row]);
        setShowFeedCheckBackPicker(false);
        setPrefsError(null);

        if (!checkBackStripOpen) {
          setCheckBackStripOpen(true);
          void persistPanelViewState(true, [...expandedCheckBackCardIds]).catch(
            () => undefined
          );
        }
      } catch {
        setPrefsError(
          "Could not save feed check back. Make sure add_feed_checkbacks.sql has been run in Supabase."
        );
      }
    },
    [
      checkBackStripOpen,
      expandedCheckBackCardIds,
      feedId,
      persistPanelViewState,
      userId,
    ]
  );

  const handleDoneFeedCheckBack = useCallback(async (checkBackId: string) => {
    try {
      const supabase = createClient();
      await clearFeedCheckBack(supabase, checkBackId);
      setFeedCheckBacks((prev) => prev.filter((row) => row.id !== checkBackId));
      setPrefsError(null);
    } catch {
      setPrefsError("Could not clear check back.");
    }
  }, []);

  const handleExtendFeedCheckBack = useCallback(
    async (checkBackId: string, date: string) => {
      try {
        const supabase = createClient();
        await updateFeedCheckBackDate(supabase, checkBackId, date);
        setFeedCheckBacks((prev) =>
          prev.map((row) =>
            row.id === checkBackId ? { ...row, check_back_until: date } : row
          )
        );
        setPrefsError(null);
      } catch {
        setPrefsError("Could not update check back date.");
      }
    },
    []
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
            onEditCard={onEditCard}
            onCommentCountChange={onCommentCountChange}
          />
        ))}
      </FeedDragDropProvider>

      {feed.footer && (
        <LinkifiedText text={feed.footer} className="category-note feed-footer" />
      )}

      <CheckBackStrip
        entries={checkBackEntries}
        feedEntries={feedCheckBackEntries}
        userId={userId}
        commentCounts={mergedCommentCounts}
        cardOpenStates={cardOpenStates}
        forcedOpenCardId={targetCardId}
        stripOpen={checkBackStripOpen}
        expandedEntryIds={expandedCheckBackCardIds}
        onToggleStrip={handleToggleCheckBackStrip}
        onToggleEntry={handleToggleCheckBackEntry}
        onToggleCardOpen={handleToggleCardOpen}
        onDone={handleDoneCheckBack}
        onExtend={handleExtendCheckBack}
        onAddFeedCheckBack={() => setShowFeedCheckBackPicker(true)}
        onMoveCard={setMoveCheckBackId}
        onDoneFeedCheckBack={handleDoneFeedCheckBack}
        onExtendFeedCheckBack={handleExtendFeedCheckBack}
        onEditCard={onEditCard}
        onCommentCountChange={onCommentCountChange}
      />

      {checkBackPickerItem && (
        <CheckBackDatePicker
          cardTitle={checkBackPickerItem.item.title}
          onConfirm={(date, note) =>
            handleSetCheckBack(checkBackPickerItem.item.id, date, note)
          }
          onCancel={() => setCheckBackPickerCardId(null)}
        />
      )}

      {moveCheckBackEntry && (
        <MoveCardModal
          cardTitle={moveCheckBackEntry.location.item.title}
          feedTitle={feedTitle}
          headlines={feedHeadlines}
          isForeignFeed={moveCheckBackEntry.isForeignFeed}
          onConfirm={(target) =>
            handleMoveCheckBackCard(moveCheckBackEntry.checkBack.id, target)
          }
          onCancel={() => setMoveCheckBackId(null)}
        />
      )}

      {showFeedCheckBackPicker && (
        <CheckBackDatePicker
          heading="Add feed check back"
          cardTitle={feedTitle}
          withTitle
          onConfirm={(date, note, title) =>
            handleAddFeedCheckBack(title, date, note)
          }
          onCancel={() => setShowFeedCheckBackPicker(false)}
        />
      )}
    </>
  );
}
