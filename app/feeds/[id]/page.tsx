import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FeedViewer } from "@/components/FeedViewer";
import { createClient } from "@/lib/supabase/server";
import { getFeedById } from "@/lib/feeds";
import { getCommentCountsByFeed } from "@/lib/comments";
import { getProfile } from "@/lib/profiles";
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
      <FeedViewer
        feed={feed}
        initialFeed={feed.content as ParsedFeed}
        userId={user.id}
        isAdmin={isAdmin}
        initialCommentCounts={commentCounts}
      />
    </AppShell>
  );
}
