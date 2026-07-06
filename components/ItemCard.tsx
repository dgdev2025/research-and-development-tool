"use client";

import { useEffect, useState } from "react";
import type { FeedItem } from "@/lib/parseFeed";
import {
  CardCommentGallery,
  CardCommentPanel,
  CardCommentsProvider,
} from "./CardComments";

interface ItemCardProps {
  item: FeedItem;
  feedId: string;
  userId: string;
  commentCount?: number;
  canReorder?: boolean;
  isHidden?: boolean;
  defaultOpen?: boolean;
  lockOpen?: boolean;
  onToggleHide?: () => void;
  onCheckBack?: () => void;
  onCommentAdded?: () => void;
}

export function ItemCard({
  item,
  feedId,
  userId,
  commentCount = 0,
  isHidden = false,
  defaultOpen = true,
  lockOpen = false,
  onToggleHide,
  onCheckBack,
  onCommentAdded,
}: ItemCardProps) {
  const [cardOpen, setCardOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  const cardOpenStorageKey = `card-open-${feedId}-${item.id}`;

  useEffect(() => {
    const stored = localStorage.getItem(cardOpenStorageKey);
    if (stored !== null) {
      setCardOpen(stored === "true");
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardOpenStorageKey]);

  useEffect(() => {
    if (lockOpen) {
      setCardOpen(true);
    }
  }, [lockOpen]);

  useEffect(() => {
    if (!hydrated) return;
    if (lockOpen) return;
    localStorage.setItem(cardOpenStorageKey, String(cardOpen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardOpen, hydrated]);

  const commentLabel =
    commentCount > 0
      ? `${commentCount} Comment${commentCount === 1 ? "" : "s"}`
      : "Comment";

  const toggleCardOpen = () => {
    if (lockOpen) return;
    setCardOpen((prev) => !prev);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCardOpen();
    }
  };

  return (
    <article
      className={`item-card${cardOpen ? " comments-open card-open" : ""}${isHidden ? " is-hidden-card" : ""}`}
    >
      <div className="item-card-header">
        <span
          className={`item-card-title${lockOpen ? " item-card-title-locked" : ""}`}
          role={lockOpen ? undefined : "button"}
          tabIndex={lockOpen ? undefined : 0}
          aria-expanded={cardOpen}
          onClick={lockOpen ? undefined : toggleCardOpen}
          onKeyDown={lockOpen ? undefined : handleTitleKeyDown}
        >
          <svg
            className={`card-chevron${cardOpen ? " open" : ""}`}
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
          <h4>{item.title}</h4>
          {!cardOpen && (
            <span className="item-card-comment-count" title={commentLabel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {commentCount}
            </span>
          )}
        </span>
        <div className="item-card-actions">
          {onCheckBack && (
            <button
              type="button"
              className="checkback-card-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCheckBack();
              }}
              aria-label="Add to check back"
            >
              Add to check back
            </button>
          )}
          {onToggleHide &&
            (isHidden ? (
              <button
                type="button"
                className="show-card-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHide();
                }}
                aria-label="Show card"
                title="Show card"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="hide-card-text-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHide();
                }}
                aria-label="Hide card"
              >
                Hide
              </button>
            ))}
        </div>
      </div>

      {cardOpen && (
        <CardCommentsProvider
          feedId={feedId}
          card={item}
          userId={userId}
          onCommentAdded={() => onCommentAdded?.()}
        >
          <div className="item-card-split">
            <div className="item-card-main">
              {item.body && <p>{item.body}</p>}
              {item.links.length > 0 && (
                <div className="card-links">
                  {item.links.map((link, i) => (
                    <a
                      key={`${link.url}-${i}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-chip"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              <CardCommentGallery />
            </div>
            <aside
              id={`comments-${item.id}`}
              className="item-card-comments-panel"
              aria-label="Comments"
            >
              <CardCommentPanel />
            </aside>
          </div>
        </CardCommentsProvider>
      )}
    </article>
  );
}
