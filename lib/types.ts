import type { ParsedFeed } from "./parseFeed";

export type UserRole = "admin" | "contributor";

export type UserAccountStatus = "active" | "pending" | "needs_password";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SettingsUserRow extends Profile {
  status: UserAccountStatus;
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
  uploader: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
}

export interface CommentRow {
  id: string;
  feed_id: string;
  card_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  parent_comment_id: string | null;
  created_at: string;
}

export interface CommentImageRow {
  id: string;
  comment_id: string;
  image_url: string;
  position: number;
}

export interface CommentWithAuthor extends CommentRow {
  author: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
  images: CommentImageRow[];
}

export interface CommentMentionRow {
  id: string;
  comment_id: string;
  feed_id: string;
  card_id: string;
  mentioned_user_id: string;
  triggered_by_user_id: string;
  mention_token: string;
  read_at: string | null;
  created_at: string;
}

export interface CommentMentionNotification extends CommentMentionRow {
  comment: Pick<CommentRow, "id" | "body" | "created_at"> | null;
  feed: Pick<FeedRow, "id" | "title"> | null;
  actor: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
}
