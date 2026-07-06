"use client";

import { useEffect, useState } from "react";
import type { FeedSaveStatus } from "@/hooks/useAutoSaveFeed";

interface FeedNoteProps {
  note?: string;
  canEdit: boolean;
  saveStatus: FeedSaveStatus;
  onChange: (note: string) => void;
}

function FeedSaveIndicator({ status }: { status: FeedSaveStatus }) {
  if (status === "idle") {
    return (
      <span className="feed-save-indicator feed-save-indicator--idle" aria-live="polite">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Saved
      </span>
    );
  }

  if (status === "pending" || status === "saving") {
    return (
      <span className="feed-save-indicator feed-save-indicator--saving" aria-live="polite">
        <span className="feed-save-spinner" aria-hidden="true" />
        Saving...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="feed-save-indicator feed-save-indicator--saved" aria-live="polite">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Saved
      </span>
    );
  }

  return (
    <span className="feed-save-indicator feed-save-indicator--error" role="alert">
      Could not save
    </span>
  );
}

export function FeedNote({ note = "", canEdit, saveStatus, onChange }: FeedNoteProps) {
  const [draft, setDraft] = useState(note);

  useEffect(() => {
    setDraft(note);
  }, [note]);

  if (!canEdit && !draft.trim()) {
    return null;
  }

  return (
    <section className="feed-note" aria-label="Feed note">
      <div className="feed-note-header">
        <label className="feed-note-label" htmlFor="feed-note-input">
          Note
        </label>
        {canEdit && <FeedSaveIndicator status={saveStatus} />}
      </div>
      {canEdit ? (
        <textarea
          id="feed-note-input"
          className="feed-note-input"
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            onChange(next);
          }}
          placeholder="Add a note for this feed..."
          rows={3}
        />
      ) : (
        <p className="feed-note-text">{draft}</p>
      )}
    </section>
  );
}
