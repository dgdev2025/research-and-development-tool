"use client";

import type { FeedItem } from "@/lib/parseFeed";

interface DragCardPreviewProps {
  item: FeedItem;
}

export function DragCardPreview({ item }: DragCardPreviewProps) {
  return (
    <div className="sortable-card drag-overlay-card">
      <div className="drag-handle" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </div>
      <article className="item-card">
        <div className="item-card-header">
          <span className="item-card-title item-card-title-locked">
            <svg
              className="card-chevron"
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
          </span>
        </div>
      </article>
    </div>
  );
}
