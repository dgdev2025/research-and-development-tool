"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

interface EditFeedCardModalProps {
  initialTitle: string;
  initialBody: string;
  onConfirm: (title: string, body: string) => Promise<void>;
  onCancel: () => void;
}

export function EditFeedCardModal({
  initialTitle,
  initialBody,
  onConfirm,
  onCancel,
}: EditFeedCardModalProps) {
  const titleId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onCancel();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, saving]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirm(trimmedTitle, body.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
      setSaving(false);
    }
  };

  return (
    <div className="checkback-picker-overlay" onClick={() => !saving && onCancel()}>
      <form
        className="checkback-picker add-card-modal"
        role="dialog"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 id={titleId}>Edit card</h3>
        <p className="checkback-picker-subtitle">
          Updates the imported card&apos;s title and details.
        </p>

        <label className="checkback-picker-field">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            autoFocus
            disabled={saving}
            required
          />
        </label>

        <label className="checkback-picker-field">
          Details (optional)
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notes, context, or next steps"
            rows={4}
            disabled={saving}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="checkback-picker-actions">
          <button
            type="button"
            className="secondary-btn-sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
