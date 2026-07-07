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
  handle: string;
  label: string;
}

export function getMentionLabel(profile: Pick<Profile, "email" | "full_name">): string {
  return profile.full_name?.trim() || profile.email;
}

function normalizeMentionHandle(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "");

  return normalized;
}

export function getMentionHandle(profile: Pick<Profile, "email" | "full_name">): string {
  const firstName = profile.full_name?.trim().split(/\s+/)[0];
  const firstNameHandle = firstName ? normalizeMentionHandle(firstName) : "";
  if (firstNameHandle) return firstNameHandle;

  const emailHandle = profile.email.split("@")[0] ?? profile.email;
  return normalizeMentionHandle(emailHandle) || profile.email.toLowerCase();
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
  const mentionToken = `${prefix}@${suggestion.handle} `;
  const nextText = `${text.slice(0, replaceStart)}${mentionToken}${afterCaret}`;
  const nextCaretIndex = replaceStart + mentionToken.length;

  return { nextText, nextCaretIndex };
}

export function parseMentionMatches(
  body: string,
  profiles: Pick<Profile, "id" | "email" | "full_name">[]
): MentionMatch[] {
  const byToken = new Map<string, string>();
  for (const profile of profiles) {
    byToken.set(profile.email.toLowerCase(), profile.id);
    const handle = getMentionHandle(profile);
    if (!byToken.has(handle)) {
      byToken.set(handle, profile.id);
    }
  }
  const matches = new Map<string, MentionMatch>();

  for (const match of body.matchAll(MENTION_REGEX)) {
    const token = match[2];
    const rawToken = match[3]?.trim().toLowerCase();
    if (!token || !rawToken) continue;
    const userId = byToken.get(rawToken);
    if (!userId) continue;
    matches.set(userId, { token, email: rawToken, userId });
  }

  return [...matches.values()];
}

export function renderMentionText(
  body: string,
  profiles: Pick<Profile, "id" | "email" | "full_name">[]
): Array<{ text: string; mentionedUserId?: string }> {
  const byToken = new Map<string, Pick<Profile, "id" | "email" | "full_name">>();
  for (const profile of profiles) {
    byToken.set(profile.email.toLowerCase(), profile);
    const handle = getMentionHandle(profile);
    if (!byToken.has(handle)) {
      byToken.set(handle, profile);
    }
  }
  const parts: Array<{ text: string; mentionedUserId?: string }> = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MENTION_REGEX)) {
    const fullMatch = match[0];
    const leading = match[1] ?? "";
    const token = match[2];
    const rawToken = match[3]?.trim().toLowerCase();
    const index = match.index ?? 0;
    const tokenStart = index + leading.length;

    if (tokenStart > lastIndex) {
      parts.push({ text: body.slice(lastIndex, tokenStart) });
    }

    const profile = rawToken ? byToken.get(rawToken) : null;
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
        getMentionHandle(profile).includes(normalized) ||
        profile.email.toLowerCase().includes(normalized) ||
        profile.full_name?.toLowerCase().includes(normalized)
      );
    })
    .slice(0, 6)
    .map((profile) => ({
      userId: profile.id,
      email: profile.email,
      handle: getMentionHandle(profile),
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
