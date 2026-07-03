import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedFeed } from "./parseFeed";
import type { FeedRow, FeedWithUploader } from "./types";

export async function getFeeds(supabase: SupabaseClient): Promise<FeedWithUploader[]> {
  const { data, error } = await supabase
    .from("feeds")
    .select(
      `
      id,
      title,
      content,
      uploaded_by,
      created_at,
      updated_at,
      uploader:profiles!uploaded_by (
        id,
        email,
        full_name
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as FeedWithUploader[];
}

export async function getFeedById(
  supabase: SupabaseClient,
  id: string
): Promise<FeedWithUploader | null> {
  const { data, error } = await supabase
    .from("feeds")
    .select(
      `
      id,
      title,
      content,
      uploaded_by,
      created_at,
      updated_at,
      uploader:profiles!uploaded_by (
        id,
        email,
        full_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as FeedWithUploader;
}

export async function createFeed(
  supabase: SupabaseClient,
  title: string,
  content: ParsedFeed,
  userId: string
): Promise<FeedRow> {
  const { data, error } = await supabase
    .from("feeds")
    .insert({ title, content, uploaded_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data as FeedRow;
}

export async function updateFeedContent(
  supabase: SupabaseClient,
  id: string,
  content: ParsedFeed
): Promise<void> {
  const { error } = await supabase
    .from("feeds")
    .update({ content })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteFeed(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("feeds").delete().eq("id", id);
  if (error) throw error;
}
