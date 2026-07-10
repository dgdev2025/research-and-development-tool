import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommentMentionNotification, CommentWithAuthor } from "./types";
import { parseMentionMatches } from "./mentions";

const NOTIFICATION_SELECT = `
  id,
  comment_id,
  feed_id,
  card_id,
  mentioned_user_id,
  triggered_by_user_id,
  mention_token,
  read_at,
  created_at,
  comment:comments!comment_mentions_comment_id_fkey (
    id,
    body,
    created_at
  ),
  feed:feeds!comment_mentions_feed_id_fkey (
    id,
    title
  ),
  actor:profiles!comment_mentions_triggered_by_user_id_fkey (
    id,
    email,
    full_name,
    avatar_url
  )
`;

export async function syncCommentMentions(
  supabase: SupabaseClient,
  comment: Pick<CommentWithAuthor, "id" | "feed_id" | "card_id" | "user_id" | "body">,
  profiles: Array<{ id: string; email: string; full_name: string | null }>
): Promise<void> {
  const matches = parseMentionMatches(comment.body, profiles).filter(
    (match) => match.userId !== comment.user_id
  );

  const { error: deleteError } = await supabase
    .from("comment_mentions")
    .delete()
    .eq("comment_id", comment.id);

  if (deleteError) throw deleteError;

  if (matches.length === 0) return;

  const { error: insertError } = await supabase.from("comment_mentions").insert(
    matches.map((match) => ({
      comment_id: comment.id,
      feed_id: comment.feed_id,
      card_id: comment.card_id,
      mentioned_user_id: match.userId,
      triggered_by_user_id: comment.user_id,
      mention_token: match.token,
    }))
  );

  if (insertError) throw insertError;
}

export async function getMentionNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<CommentMentionNotification[]> {
  const { data, error } = await supabase
    .from("comment_mentions")
    .select(NOTIFICATION_SELECT)
    .eq("mentioned_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) throw error;
  return (data ?? []) as unknown as CommentMentionNotification[];
}

export async function getUnreadMentionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("comment_mentions")
    .select("id", { count: "exact", head: true })
    .eq("mentioned_user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markMentionAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("comment_mentions")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("mentioned_user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}
