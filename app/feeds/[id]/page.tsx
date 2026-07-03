import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DeleteFeedButton } from "@/components/DeleteFeedButton";
import { FeedBackLink } from "@/components/FeedBackLink";
import { FeedViewer } from "@/components/FeedViewer";
import { createClient } from "@/lib/supabase/server";
import { getFeedById } from "@/lib/feeds";
import { getCommentCountsByFeed } from "@/lib/comments";
import { displayName, formatDate, getProfile } from "@/lib/profiles";
import type { ParsedFeed } from "@/lib/parseFeed";

interface FeedPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedPage({ params }: FeedPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/feeds/${id}`);

  const profile = await getProfile(supabase, user.id);
  const feed = await getFeedById(supabase, id);

  if (!feed) notFound();

  const commentCounts = await getCommentCountsByFeed(supabase, id);
  const isAdmin = profile?.role === "admin";

  return (
    <AppShell>
      <div className="feed-meta-bar">
        <div className="feed-meta-left">
          <FeedBackLink show={isAdmin} />
          <div>
            <p className="feed-record-title">{feed.title}</p>
            <p className="feed-record-meta">
              Uploaded by {displayName(feed.uploader)} · {formatDate(feed.created_at)}
              {" · "}Last modified {formatDate(feed.updated_at)}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="feed-meta-actions">
            <DeleteFeedButton feedId={feed.id} feedTitle={feed.title} />
          </div>
        )}
      </div>

      <FeedViewer
        feedId={feed.id}
        initialFeed={feed.content as ParsedFeed}
        userId={user.id}
        canReorder={isAdmin}
        initialCommentCounts={commentCounts}
      />
    </AppShell>
  );
}
