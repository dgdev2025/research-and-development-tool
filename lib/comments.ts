import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommentWithAuthor } from "./types";

const COMMENT_SELECT = `
  id,
  feed_id,
  card_id,
  user_id,
  body,
  image_url,
  parent_comment_id,
  created_at,
  author:profiles!user_id (
    id,
    email,
    full_name
  ),
  images:comment_images (
    id,
    comment_id,
    image_url,
    position
  )
`;

export const INITIAL_VISIBLE_COMMENTS = 5;
export const LOAD_MORE_COMMENTS = 10;

export async function getCommentsForCard(
  supabase: SupabaseClient,
  feedId: string,
  cardId: string
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("feed_id", feedId)
    .eq("card_id", cardId)
    .order("created_at", { ascending: true })
    .order("position", { foreignTable: "comment_images", ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function getCommentById(
  supabase: SupabaseClient,
  commentId: string
): Promise<CommentWithAuthor | null> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("id", commentId)
    .single();

  if (error) return null;
  return data as unknown as CommentWithAuthor;
}

export function sortCommentsAscending(
  comments: CommentWithAuthor[]
): CommentWithAuthor[] {
  return [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function mergeComment(
  comments: CommentWithAuthor[],
  comment: CommentWithAuthor
): CommentWithAuthor[] {
  const existingIndex = comments.findIndex((item) => item.id === comment.id);
  if (existingIndex >= 0) {
    const next = [...comments];
    next[existingIndex] = comment;
    return sortCommentsAscending(next);
  }
  return sortCommentsAscending([...comments, comment]);
}

export async function getCommentCountsByFeed(
  supabase: SupabaseClient,
  feedId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("comments")
    .select("card_id")
    .eq("feed_id", feedId);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.card_id] = (counts[row.card_id] ?? 0) + 1;
  }
  return counts;
}

export async function createComment(
  supabase: SupabaseClient,
  params: {
    feedId: string;
    cardId: string;
    userId: string;
    body: string;
    imageUrls?: string[];
    parentCommentId?: string | null;
  }
): Promise<CommentWithAuthor> {
  const body = params.body.trim();
  const imageUrls = params.imageUrls ?? [];

  if (!body && imageUrls.length === 0) {
    throw new Error("Comment must include text or an image.");
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert({
      feed_id: params.feedId,
      card_id: params.cardId,
      user_id: params.userId,
      body,
      parent_comment_id: params.parentCommentId ?? null,
    })
    .select(
      `
      id,
      feed_id,
      card_id,
      user_id,
      body,
      image_url,
      parent_comment_id,
      created_at,
      author:profiles!user_id (
        id,
        email,
        full_name
      )
    `
    )
    .single();

  if (commentError) throw commentError;

  let images: CommentWithAuthor["images"] = [];

  if (imageUrls.length > 0) {
    const { data: imageRows, error: imagesError } = await supabase
      .from("comment_images")
      .insert(
        imageUrls.map((imageUrl, index) => ({
          comment_id: comment.id,
          image_url: imageUrl,
          position: index,
        }))
      )
      .select("id, comment_id, image_url, position")
      .order("position", { ascending: true });

    if (imagesError) throw imagesError;
    images = imageRows ?? [];
  }

  return { ...comment, images } as unknown as CommentWithAuthor;
}

export async function uploadCommentImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("comment-images")
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("comment-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCommentImages(
  supabase: SupabaseClient,
  userId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadCommentImage(supabase, userId, file));
  }
  return urls;
}

export async function updateComment(
  supabase: SupabaseClient,
  commentId: string,
  body: string
): Promise<CommentWithAuthor> {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Comment cannot be empty.");
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ body: trimmedBody })
    .eq("id", commentId)
    .select(COMMENT_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as CommentWithAuthor;
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string
): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}
