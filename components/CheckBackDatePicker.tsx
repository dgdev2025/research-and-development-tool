"use client";

import { useEffect, useRef, useState } from "react";
import { addDaysToDate } from "@/lib/checkback";

interface CheckBackDatePickerProps {
  cardTitle: string;
  onConfirm: (date: string, note: string) => void;
  onCancel: () => void;
}

const QUICK_OPTIONS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "In 1 week", days: 7 },
  { label: "In 2 weeks", days: 14 },
] as const;

export function CheckBackDatePicker({
  cardTitle,
  onConfirm,
  onCancel,
}: CheckBackDatePickerProps) {
  const [customDate, setCustomDate] = useState(addDaysToDate(7));
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  return (
    <div className="checkback-picker-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="checkback-picker"
        role="dialog"
        aria-labelledby="checkback-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="checkback-picker-title">Check back on</h3>
        <p className="checkback-picker-subtitle">{cardTitle}</p>

        <div className="checkback-quick-options">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              className="checkback-quick-btn"
              onClick={() => onConfirm(addDaysToDate(option.days), note)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="checkback-picker-field">
          Custom date
          <input
            type="date"
            value={customDate}
            min={addDaysToDate(0)}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        </label>

        <label className="checkback-picker-field">
          Note (optional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Review A/B test results"
          />
        </label>

        <div className="checkback-picker-actions">
          <button type="button" className="reset-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={() => onConfirm(customDate, note)}
          >
            Set check back
          </button>
        </div>
      </div>
    </div>
  );
}
