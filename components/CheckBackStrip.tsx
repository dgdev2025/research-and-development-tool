"use client";

import { useState } from "react";
import type { CheckBackRow } from "@/lib/checkback";
import {
  getCheckBackStatus,
  getCheckBackStatusLabel,
} from "@/lib/checkback";
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
  onDone: (cardId: string) => Promise<void>;
  onExtend: (cardId: string, date: string) => Promise<void>;
  onCommentCountChange: (cardId: string, delta: number) => void;
}

export function CheckBackStrip({
  entries,
  feedId,
  userId,
  commentCounts,
  onDone,
  onExtend,
  onCommentCountChange,
}: CheckBackStripProps) {
  const [extendCardId, setExtendCardId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  if (entries.length === 0) return null;

  const extendEntry = extendCardId
    ? entries.find((entry) => entry.checkBack.card_id === extendCardId)
    : null;

  return (
    <section className="checkback-strip" aria-label="Check back">
      <div className="checkback-strip-header">
        <h3>Check back</h3>
        <span className="checkback-strip-count">
          {entries.length} item{entries.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="checkback-strip-list">
        {entries.map(({ checkBack, location }) => {
          const status = getCheckBackStatus(checkBack.check_back_until);
          const isDue = status === "overdue" || status === "due_today";
          const isCollapsed = !isDue && collapsedIds.has(checkBack.card_id);
          const locationLabel = location.subsectionTitle
            ? `${location.categoryTitle} · ${location.subsectionTitle}`
            : location.categoryTitle;

          return (
            <article
              key={checkBack.id}
              className={`checkback-entry checkback-entry--${status}${
                isCollapsed ? " is-collapsed" : ""
              }`}
            >
              <div className="checkback-entry-bar">
                <div className="checkback-entry-meta">
                  <span className={`checkback-badge checkback-badge--${status}`}>
                    {getCheckBackStatusLabel(status, checkBack.check_back_until)}
                  </span>
                  <span className="checkback-entry-category">{locationLabel}</span>
                  {checkBack.note && (
                    <span className="checkback-entry-note">{checkBack.note}</span>
                  )}
                </div>
                <div className="checkback-entry-actions">
                  {!isDue && (
                    <button
                      type="button"
                      className="secondary-btn-sm"
                      onClick={() =>
                        setCollapsedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(checkBack.card_id)) {
                            next.delete(checkBack.card_id);
                          } else {
                            next.add(checkBack.card_id);
                          }
                          return next;
                        })
                      }
                    >
                      {isCollapsed ? "Expand" : "Collapse"}
                    </button>
                  )}
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

              {!isCollapsed && (
                <ItemCard
                  item={location.item}
                  feedId={feedId}
                  userId={userId}
                  commentCount={commentCounts[location.item.id] ?? 0}
                  defaultOpen={isDue}
                  lockOpen={isDue}
                  onCommentAdded={() => onCommentCountChange(location.item.id, 1)}
                />
              )}
            </article>
          );
        })}
      </div>

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
