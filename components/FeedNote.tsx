"use client";

import { useEffect, useState } from "react";

interface FeedNoteProps {
  note?: string;
  canEdit: boolean;
  onChange: (note: string) => void;
}

export function FeedNote({ note = "", canEdit, onChange }: FeedNoteProps) {
  const [draft, setDraft] = useState(note);

  useEffect(() => {
    setDraft(note);
  }, [note]);

  if (!canEdit && !draft.trim()) {
    return null;
  }

  return (
    <section className="feed-note" aria-label="Feed note">
      <label className="feed-note-label" htmlFor="feed-note-input">
        Note
      </label>
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
