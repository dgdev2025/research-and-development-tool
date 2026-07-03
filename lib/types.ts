import type { ParsedFeed } from "./parseFeed";

export type UserRole = "admin" | "contributor";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface FeedRow {
  id: string;
  title: string;
  content: ParsedFeed;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeedWithUploader extends FeedRow {
  uploader: Pick<Profile, "id" | "email" | "full_name"> | null;
}

export interface CommentRow {
  id: string;
  feed_id: string;
  card_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export interface CommentImageRow {
  id: string;
  comment_id: string;
  image_url: string;
  position: number;
}

export interface CommentWithAuthor extends CommentRow {
  author: Pick<Profile, "id" | "email" | "full_name"> | null;
  images: CommentImageRow[];
}
