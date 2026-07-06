"use client";

import { useMemo, useState } from "react";
import type { CheckBackRow, CheckBackStatus } from "@/lib/checkback";
import {
  formatCheckBackDate,
  getCheckBackStatus,
  getCheckBackStatusPrefix,
} from "@/lib/checkback";
import { resolveCardOpen } from "@/lib/feedViewState";
import type { FeedItemLocation } from "@/lib/parseFeed";
import { ItemCard } from "./ItemCard";
import { CheckBackDatePicker } from "./CheckBackDatePicker";

interface CheckBackEntry {
  checkBack: CheckBackRow;
  location: FeedItemLocation;
}

interface CheckBackStripProps {
  entries: CheckBackEntry[];
  feedId: string;
  userId: string;
  commentCounts: Record<string, number>;
  cardOpenStates: Record<string, boolean>;
  stripOpen: boolean;
  expandedEntryIds: Set<string>;
  onToggleStrip: () => void;
  onToggleEntry: (cardId: string) => void;
  onToggleCardOpen: (cardId: string, defaultOpen?: boolean) => void;
  onDone: (cardId: string) => Promise<void>;
  onExtend: (cardId: string, date: string) => Promise<void>;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

function isDueStatus(status: CheckBackStatus): boolean {
  return status === "overdue" || status === "due_today";
}

function getDueCardIds(entries: CheckBackEntry[]): string[] {
  return entries
    .filter((entry) =>
      isDueStatus(getCheckBackStatus(entry.checkBack.check_back_until))
    )
    .map((entry) => entry.checkBack.card_id);
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

export function CheckBackStrip({
  entries,
  feedId,
  userId,
  commentCounts,
  cardOpenStates,
  stripOpen,
  expandedEntryIds,
  onToggleStrip,
  onToggleEntry,
  onToggleCardOpen,
  onDone,
  onExtend,
  onCommentCountChange,
}: CheckBackStripProps) {
  const dueCardIds = useMemo(() => getDueCardIds(entries), [entries]);
  const dueCount = dueCardIds.length;
  const [extendCardId, setExtendCardId] = useState<string | null>(null);

  if (entries.length === 0) return null;

  const extendEntry = extendCardId
    ? entries.find((entry) => entry.checkBack.card_id === extendCardId)
    : null;

  return (
    <section
      className={`checkback-strip${stripOpen ? " is-open" : ""}`}
      aria-label="Check backs"
    >
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
          {entries.length} item{entries.length === 1 ? "" : "s"}
        </span>
        {dueCount > 0 && (
          <span className="checkback-strip-due-pill">
            {dueCount} due
          </span>
        )}
      </button>

      {stripOpen && (
        <div className="checkback-strip-list">
          {entries.map(({ checkBack, location }) => {
            const status = getCheckBackStatus(checkBack.check_back_until);
            const isExpanded = expandedEntryIds.has(checkBack.card_id);
            const commentCount = commentCounts[location.item.id] ?? 0;
            const locationLabel = location.subsectionTitle
              ? `${location.categoryTitle} · ${location.subsectionTitle}`
              : location.categoryTitle;

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
                    <span className={`checkback-badge checkback-badge--${status}`}>
                      <span className="checkback-badge-label">
                        {getCheckBackStatusPrefix(status)}
                      </span>
                      <span className="checkback-badge-sep" aria-hidden="true">
                        ·
                      </span>
                      <time
                        className="checkback-badge-date"
                        dateTime={checkBack.check_back_until}
                      >
                        {formatCheckBackDate(checkBack.check_back_until)}
                      </time>
                    </span>
                    <span className="checkback-entry-category">{locationLabel}</span>
                    {checkBack.note && (
                      <span className="checkback-entry-note">{checkBack.note}</span>
                    )}
                  </div>

                  <div className="checkback-entry-actions">
                    <button
                      type="button"
                      className="secondary-btn-sm"
                      onClick={() => setExtendCardId(checkBack.card_id)}
                    >
                      Extend
                    </button>
                    <button
                      type="button"
                      className="submit-btn checkback-done-btn"
                      onClick={() => onDone(checkBack.card_id)}
                    >
                      Done
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <ItemCard
                    item={location.item}
                    feedId={feedId}
                    userId={userId}
                    commentCount={commentCount}
                    isOpen={resolveCardOpen(cardOpenStates, location.item.id)}
                    onToggleOpen={() => onToggleCardOpen(location.item.id)}
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

      {extendEntry && (
        <CheckBackDatePicker
          cardTitle={extendEntry.location.item.title}
          onConfirm={async (date) => {
            await onExtend(extendEntry.checkBack.card_id, date);
            setExtendCardId(null);
          }}
          onCancel={() => setExtendCardId(null)}
        />
      )}
    </section>
  );
}
