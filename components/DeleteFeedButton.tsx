"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteFeed } from "@/lib/feeds";

interface DeleteFeedButtonProps {
  feedId: string;
  feedTitle: string;
  variant?: "icon" | "button";
}

export function DeleteFeedButton({
  feedId,
  feedTitle,
  variant = "button",
}: DeleteFeedButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      await deleteFeed(supabase, feedId);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to delete feed.");
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className={variant === "icon" ? "danger-btn-sm" : "danger-btn"}
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="delete-confirm">
      {error && <span className="inline-error">{error}</span>}
      <span>Delete &quot;{feedTitle}&quot;?</span>
      <button
        type="button"
        className="danger-btn"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Confirm"}
      </button>
      <button
        type="button"
        className="reset-btn"
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        disabled={loading}
      >
        Cancel
      </button>
    </div>
  );
}
