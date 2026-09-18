"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  CheckBackRow,
  CheckBackStatus,
  FeedCheckBackRow,
} from "@/lib/checkback";
import {
  compareCheckBackDates,
  formatCheckBackDate,
  getCheckBackStatus,
  getCheckBackStatusPrefix,
} from "@/lib/checkback";
import { resolveCardOpen } from "@/lib/feedViewState";
import { displayName } from "@/lib/profiles";
import type { FeedItemLocation } from "@/lib/parseFeed";
import { ItemCard } from "./ItemCard";
import { CheckBackDatePicker } from "./CheckBackDatePicker";
import { LinkifiedText } from "./LinkifiedText";

interface CheckBackEntry {
  checkBack: CheckBackRow;
  location: FeedItemLocation;
  feedTitle: string;
  sourceFeedId: string;
  isForeignFeed: boolean;
}

export interface FeedCheckBackEntry {
  checkBack: FeedCheckBackRow;
  feedTitle: string;
  sourceFeedId: string;
  isForeignFeed: boolean;
}

type StripItem =
  | { kind: "card"; entry: CheckBackEntry }
  | { kind: "feed"; entry: FeedCheckBackEntry };

interface ExtendTarget {
  kind: StripItem["kind"];
  id: string;
}

interface CheckBackStripProps {
  entries: CheckBackEntry[];
  feedEntries: FeedCheckBackEntry[];
  userId: string;
  commentCounts: Record<string, number>;
  cardOpenStates: Record<string, boolean>;
  forcedOpenCardId?: string | null;
  stripOpen: boolean;
  expandedEntryIds: Set<string>;
  onToggleStrip: () => void;
  onToggleEntry: (cardId: string) => void;
  onToggleCardOpen: (cardId: string, defaultOpen?: boolean) => void;
  onDone: (checkBackId: string) => Promise<void>;
  onExtend: (checkBackId: string, date: string) => Promise<void>;
  onAddFeedCheckBack: () => void;
  onMoveCard: (checkBackId: string) => void;
  onDoneFeedCheckBack: (checkBackId: string) => Promise<void>;
  onExtendFeedCheckBack: (checkBackId: string, date: string) => Promise<void>;
  onEditCard?: (cardId: string) => void;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function isDueStatus(status: CheckBackStatus): boolean {
  return status === "overdue" || status === "due_today";
}

function CommentCountBadge({ count }: { count: number }) {
  const label =
    count > 0 ? `${count} Comment${count === 1 ? "" : "s"}` : "Comment";

  return (
    <span className="item-card-comment-count" title={label}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count}
    </span>
  );
}

function StatusBadge({ status, until }: { status: CheckBackStatus; until: string }) {
  return (
    <span className={`checkback-badge checkback-badge--${status}`}>
      <span className="checkback-badge-label">{getCheckBackStatusPrefix(status)}</span>
      <span className="checkback-badge-sep" aria-hidden="true">
        ·
      </span>
      <time className="checkback-badge-date" dateTime={until}>
        {formatCheckBackDate(until)}
      </time>
    </span>
  );
}

export function CheckBackStrip({
  entries,
  feedEntries,
  userId,
  commentCounts,
  cardOpenStates,
  forcedOpenCardId,
  stripOpen,
  expandedEntryIds,
  onToggleStrip,
  onToggleEntry,
  onToggleCardOpen,
  onDone,
  onExtend,
  onAddFeedCheckBack,
  onMoveCard,
  onDoneFeedCheckBack,
  onExtendFeedCheckBack,
  onEditCard,
  onCommentCountChange,
}: CheckBackStripProps) {
  const [extendTarget, setExtendTarget] = useState<ExtendTarget | null>(null);

  const items = useMemo<StripItem[]>(() => {
    const all: StripItem[] = [
      ...entries.map((entry) => ({ kind: "card" as const, entry })),
      ...feedEntries.map((entry) => ({ kind: "feed" as const, entry })),
    ];
    return all.sort((a, b) =>
      compareCheckBackDates(
        a.entry.checkBack.check_back_until,
        b.entry.checkBack.check_back_until
      )
    );
  }, [entries, feedEntries]);

  const dueCount = items.filter((item) =>
    isDueStatus(getCheckBackStatus(item.entry.checkBack.check_back_until))
  ).length;

  const extendItem = extendTarget
    ? items.find(
        (item) =>
          item.kind === extendTarget.kind &&
          item.entry.checkBack.id === extendTarget.id
      )
    : null;

  const extendTitle = extendItem
    ? extendItem.kind === "card"
      ? extendItem.entry.location.item.title
      : extendItem.entry.checkBack.title
    : "";

  return (
    <section
      className={`checkback-strip${stripOpen ? " is-open" : ""}`}
      aria-label="Check backs"
    >
      <div className="checkback-strip-header">
        <button
          type="button"
          className="checkback-strip-header-btn"
          onClick={onToggleStrip}
          aria-expanded={stripOpen}
        >
          <svg
            className={`card-chevron${stripOpen ? " open" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3>Check backs</h3>
          <span className="checkback-strip-count">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
          {dueCount > 0 && (
            <span className="checkback-strip-due-pill">{dueCount} due</span>
          )}
        </button>
        <button
          type="button"
          className="secondary-btn-sm checkback-strip-add-btn"
          onClick={onAddFeedCheckBack}
        >
          + Add check back
        </button>
      </div>

      {stripOpen && items.length === 0 && (
        <p className="checkback-strip-empty">
          No check backs yet. Add one for this feed, or use &ldquo;Add to check
          back&rdquo; on a card.
        </p>
      )}

      {stripOpen && items.length > 0 && (
        <div className="checkback-strip-list">
          {items.map((stripItem) => {
            if (stripItem.kind === "feed") {
              const { checkBack, feedTitle, sourceFeedId, isForeignFeed } =
                stripItem.entry;
              const status = getCheckBackStatus(checkBack.check_back_until);

              return (
                <article
                  key={`feed-${checkBack.id}`}
                  className={`checkback-entry checkback-entry--${status} checkback-entry--feed`}
                >
                  <div className="checkback-entry-bar">
                    <div className="checkback-entry-title checkback-entry-title--static">
                      <span className="checkback-feed-tag">Feed</span>
                      <span className="checkback-entry-title-text">
                        {checkBack.title}
                      </span>
                    </div>

                    <div className="checkback-entry-meta">
                      <StatusBadge status={status} until={checkBack.check_back_until} />
                      <span className="checkback-entry-author" title="Added by">
                        {displayName(checkBack.author ?? null)}
                      </span>
                      {isForeignFeed ? (
                        <Link
                          href={`/feeds/${sourceFeedId}`}
                          className="checkback-entry-feed-link"
                          title={`Open ${feedTitle}`}
                        >
                          {feedTitle}
                        </Link>
                      ) : (
                        <span className="checkback-entry-category">This feed</span>
                      )}
                      {checkBack.note && (
                        <LinkifiedText
                          text={checkBack.note}
                          as="span"
                          className="checkback-entry-note"
                        />
                      )}
                    </div>

                    <div className="checkback-entry-actions">
                      <button
                        type="button"
                        className="secondary-btn-sm"
                        onClick={() =>
                          setExtendTarget({ kind: "feed", id: checkBack.id })
                        }
                      >
                        Extend
                      </button>
                      <button
                        type="button"
                        className="submit-btn checkback-done-btn"
                        onClick={() => onDoneFeedCheckBack(checkBack.id)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            const { checkBack, location, feedTitle, sourceFeedId, isForeignFeed } =
              stripItem.entry;
            const status = getCheckBackStatus(checkBack.check_back_until);
            const isExpanded = expandedEntryIds.has(checkBack.card_id);
            const commentCount = commentCounts[location.item.id] ?? 0;
            const locationLabel = location.subsectionTitle
              ? `${location.categoryTitle} · ${location.subsectionTitle}`
              : location.categoryTitle;
            const authorLabel = displayName(checkBack.author ?? null);

            return (
              <article
                key={checkBack.id}
                className={`checkback-entry checkback-entry--${status}${
                  isExpanded ? " is-open" : ""
                }`}
              >
                <div className="checkback-entry-bar">
                  <button
                    type="button"
                    className="checkback-entry-title"
                    onClick={() => onToggleEntry(checkBack.card_id)}
                    aria-expanded={isExpanded}
                  >
                    <svg
                      className={`card-chevron${isExpanded ? " open" : ""}`}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="checkback-entry-title-text">
                      {location.item.title}
                    </span>
                    {!isExpanded && <CommentCountBadge count={commentCount} />}
                  </button>

                  <div className="checkback-entry-meta">
                    <StatusBadge status={status} until={checkBack.check_back_until} />
                    <span className="checkback-entry-author" title="Added by">
                      {authorLabel}
                    </span>
                    {isForeignFeed ? (
                      <Link
                        href={`/feeds/${sourceFeedId}?card=${checkBack.card_id}`}
                        className="checkback-entry-feed-link"
                        title={`Open in ${feedTitle}`}
                      >
                        {feedTitle}
                      </Link>
                    ) : (
                      <span className="checkback-entry-category">{locationLabel}</span>
                    )}
                    {isForeignFeed && (
                      <span className="checkback-entry-category">{locationLabel}</span>
                    )}
                    {checkBack.note && (
                      <LinkifiedText
                        text={checkBack.note}
                        as="span"
                        className="checkback-entry-note"
                      />
                    )}
                  </div>

                  <div className="checkback-entry-actions">
                    <button
                      type="button"
                      className="secondary-btn-sm"
                      onClick={() => onMoveCard(checkBack.id)}
                      title={
                        isForeignFeed
                          ? "Move this card into the feed you are viewing"
                          : "Move this card under another headline"
                      }
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      className="secondary-btn-sm"
                      onClick={() => setExtendTarget({ kind: "card", id: checkBack.id })}
                    >
                      Extend
                    </button>
                    <button
                      type="button"
                      className="submit-btn checkback-done-btn"
                      onClick={() => onDone(checkBack.id)}
                    >
                      Done
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <ItemCard
                    item={location.item}
                    feedId={sourceFeedId}
                    userId={userId}
                    commentCount={commentCount}
                    isOpen={resolveCardOpen(cardOpenStates, location.item.id)}
                    lockOpen={
                      !isForeignFeed && forcedOpenCardId === location.item.id
                    }
                    onToggleOpen={() => onToggleCardOpen(location.item.id)}
                    onEditCard={
                      !isForeignFeed && onEditCard
                        ? () => onEditCard(location.item.id)
                        : undefined
                    }
                    onCommentAdded={() =>
                      onCommentCountChange(location.item.id, 1)
                    }
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      {extendItem && extendTarget && (
        <CheckBackDatePicker
          cardTitle={extendTitle}
          onConfirm={async (date) => {
            if (extendTarget.kind === "feed") {
              await onExtendFeedCheckBack(extendTarget.id, date);
            } else {
              await onExtend(extendTarget.id, date);
            }
            setExtendTarget(null);
          }}
          onCancel={() => setExtendTarget(null)}
        />
      )}
    </section>
  );
}
