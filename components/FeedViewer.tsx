"use client";

import { useEffect, useState } from "react";
import { findFeedItem, updateFeedItem, type ParsedFeed } from "@/lib/parseFeed";
import { createClient } from "@/lib/supabase/client";
import { updateFeedContent } from "@/lib/feeds";
import { prependTeamAddition } from "@/lib/feedCustomCards";
import { prefetchMentionableProfiles } from "@/lib/mentions";
import { displayName, formatDate } from "@/lib/profiles";
import type { FeedWithUploader } from "@/lib/types";
import { AddFeedCardModal } from "@/components/AddFeedCardModal";
import { DeleteFeedButton } from "@/components/DeleteFeedButton";
import { EditFeedCardModal } from "@/components/EditFeedCardModal";
import { FeedBackLink } from "@/components/FeedBackLink";
import { FeedDisplay } from "@/components/FeedDisplay";

interface FeedViewerProps {
  feed: FeedWithUploader;
  initialFeed: ParsedFeed;
  userId: string;
  isAdmin: boolean;
  initialCommentCounts: Record<string, number>;
}

export function FeedViewer({
  feed,
  initialFeed,
  userId,
  isAdmin,
  initialCommentCounts,
}: FeedViewerProps) {
  const [content, setContent] = useState(initialFeed);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void prefetchMentionableProfiles(supabase);
  }, []);

  const handleCommentCountChange = (cardId: string, delta: number) => {
    setCommentCounts((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] ?? 0) + delta,
    }));
  };

  const handleAddCard = async (title: string, body: string) => {
    const { feed: nextFeed } = prependTeamAddition(content, { title, body });
    const supabase = createClient();
    await updateFeedContent(supabase, feed.id, nextFeed);
    setContent(nextFeed);
    setShowAddCard(false);
    setAddError(null);
  };

  const editingCard = editingCardId ? findFeedItem(content, editingCardId) : null;

  const handleEditCard = async (title: string, body: string) => {
    if (!editingCardId) return;
    const nextFeed = updateFeedItem(content, editingCardId, { title, body });
    const supabase = createClient();
    await updateFeedContent(supabase, feed.id, nextFeed);
    setContent(nextFeed);
    setEditingCardId(null);
  };

  return (
    <>
      <div className="feed-meta-bar">
        <div className="feed-meta-left">
          <FeedBackLink show />
          <div>
            <p className="feed-record-title">{feed.title}</p>
            <p className="feed-record-meta">
              Uploaded by {displayName(feed.uploader)} · {formatDate(feed.created_at)}
              {" · "}Last modified {formatDate(feed.updated_at)}
            </p>
          </div>
        </div>
        <div className="feed-meta-actions">
          <button
            type="button"
            className="submit-btn feed-add-card-btn"
            onClick={() => {
              setAddError(null);
              setShowAddCard(true);
            }}
          >
            Add New
          </button>
          {isAdmin && (
            <DeleteFeedButton feedId={feed.id} feedTitle={feed.title} />
          )}
        </div>
      </div>

      {addError && <p className="form-error">{addError}</p>}

      <FeedDisplay
        feedId={feed.id}
        feedTitle={feed.title}
        feed={content}
        userId={userId}
        canReorder={isAdmin}
        commentCounts={commentCounts}
        onFeedChange={setContent}
        onCommentCountChange={handleCommentCountChange}
        onEditCard={isAdmin ? setEditingCardId : undefined}
      />

      {showAddCard && (
        <AddFeedCardModal
          onConfirm={handleAddCard}
          onCancel={() => setShowAddCard(false)}
        />
      )}

      {editingCard && (
        <EditFeedCardModal
          initialTitle={editingCard.item.title}
          initialBody={editingCard.item.body}
          onConfirm={handleEditCard}
          onCancel={() => setEditingCardId(null)}
        />
      )}
    </>
  );
}
