import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

const MENTION_REGEX = /(^|\s)(@([^\s]+))/g;

export interface MentionMatch {
  token: string;
  email: string;
  userId: string;
}

export interface MentionSuggestion {
  userId: string;
  email: string;
  label: string;
}

export function getMentionLabel(profile: Pick<Profile, "email" | "full_name">): string {
  return profile.full_name?.trim() || profile.email;
}

export function extractMentionQuery(text: string, caretIndex: number): string | null {
  const beforeCaret = text.slice(0, caretIndex);
  const match = beforeCaret.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  return match[2] ?? "";
}

export function applyMentionSuggestion(
  text: string,
  caretIndex: number,
  suggestion: MentionSuggestion
): { nextText: string; nextCaretIndex: number } {
  const beforeCaret = text.slice(0, caretIndex);
  const afterCaret = text.slice(caretIndex);
  const match = beforeCaret.match(/(^|\s)@([^\s@]*)$/);

  if (!match) {
    return { nextText: text, nextCaretIndex: caretIndex };
  }

  const prefix = match[1] ?? "";
  const replaceStart = beforeCaret.length - match[0].length;
  const mentionToken = `${prefix}@${suggestion.email} `;
  const nextText = `${text.slice(0, replaceStart)}${mentionToken}${afterCaret}`;
  const nextCaretIndex = replaceStart + mentionToken.length;

  return { nextText, nextCaretIndex };
}

export function parseMentionMatches(
  body: string,
  profiles: Pick<Profile, "id" | "email" | "full_name">[]
): MentionMatch[] {
  const byEmail = new Map(
    profiles.map((profile) => [profile.email.toLowerCase(), profile.id])
  );
  const matches = new Map<string, MentionMatch>();

  for (const match of body.matchAll(MENTION_REGEX)) {
    const token = match[2];
    const email = match[3]?.trim().toLowerCase();
    if (!token || !email) continue;
    const userId = byEmail.get(email);
    if (!userId) continue;
    matches.set(userId, { token, email, userId });
  }

  return [...matches.values()];
}

export function renderMentionText(
  body: string,
  profiles: Pick<Profile, "id" | "email" | "full_name">[]
): Array<{ text: string; mentionedUserId?: string }> {
  const byEmail = new Map(
    profiles.map((profile) => [profile.email.toLowerCase(), profile])
  );
  const parts: Array<{ text: string; mentionedUserId?: string }> = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MENTION_REGEX)) {
    const fullMatch = match[0];
    const leading = match[1] ?? "";
    const token = match[2];
    const email = match[3]?.trim().toLowerCase();
    const index = match.index ?? 0;
    const tokenStart = index + leading.length;

    if (tokenStart > lastIndex) {
      parts.push({ text: body.slice(lastIndex, tokenStart) });
    }

    const profile = email ? byEmail.get(email) : null;
    if (profile && token) {
      parts.push({
        text: `@${getMentionLabel(profile)}`,
        mentionedUserId: profile.id,
      });
    } else {
      parts.push({ text: token ?? fullMatch.trimStart() });
    }

    lastIndex = tokenStart + (token?.length ?? 0);
  }

  if (lastIndex < body.length) {
    parts.push({ text: body.slice(lastIndex) });
  }

  return parts;
}

export function filterMentionSuggestions(
  profiles: Pick<Profile, "id" | "email" | "full_name">[],
  query: string,
  currentUserId: string
): MentionSuggestion[] {
  const normalized = query.trim().toLowerCase();

  return profiles
    .filter((profile) => profile.id !== currentUserId)
    .filter((profile) => {
      if (!normalized) return true;
      return (
        profile.email.toLowerCase().includes(normalized) ||
        profile.full_name?.toLowerCase().includes(normalized)
      );
    })
    .slice(0, 6)
    .map((profile) => ({
      userId: profile.id,
      email: profile.email,
      label: getMentionLabel(profile),
    }));
}

export async function getMentionableProfiles(
  supabase: SupabaseClient
): Promise<Pick<Profile, "id" | "email" | "full_name">[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Pick<Profile, "id" | "email" | "full_name">[];
}
