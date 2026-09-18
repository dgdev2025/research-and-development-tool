import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

export interface CheckBackRow {
  id: string;
  user_id: string;
  feed_id: string;
  card_id: string;
  check_back_until: string;
  note: string | null;
  created_at: string;
  author?: Pick<Profile, "id" | "email" | "full_name"> | null;
}

export type CheckBackStatus = "overdue" | "due_today" | "upcoming";

const CHECKBACK_SELECT = `
  *,
  author:profiles!user_id (
    id,
    email,
    full_name
  )
`;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getCheckBackStatus(until: string): CheckBackStatus {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(until));

  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "due_today";
  return "upcoming";
}

export function formatCheckBackDate(until: string): string {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(
    new Date(until)
  );
}

export function getCheckBackStatusPrefix(status: CheckBackStatus): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_today":
      return "Due today";
    default:
      return "Scheduled";
  }
}

export function getCheckBackStatusLabel(status: CheckBackStatus, until: string): string {
  return `${getCheckBackStatusPrefix(status)} · ${formatCheckBackDate(until)}`;
}

export function addDaysToDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function getAllCheckBacks(
  supabase: SupabaseClient
): Promise<CheckBackRow[]> {
  const { data, error } = await supabase
    .from("user_checkback_cards")
    .select(CHECKBACK_SELECT)
    .order("check_back_until", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CheckBackRow[];
}

/** @deprecated Prefer getAllCheckBacks — kept for compatibility. */
export async function getCheckBacksForUser(
  supabase: SupabaseClient,
  _userId?: string
): Promise<CheckBackRow[]> {
  return getAllCheckBacks(supabase);
}

/** @deprecated Prefer getAllCheckBacks — kept for compatibility. */
export async function getCheckBacksForFeed(
  supabase: SupabaseClient,
  feedId: string,
  _userId?: string
): Promise<CheckBackRow[]> {
  const { data, error } = await supabase
    .from("user_checkback_cards")
    .select(CHECKBACK_SELECT)
    .eq("feed_id", feedId)
    .order("check_back_until", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CheckBackRow[];
}

export async function setCheckBack(
  supabase: SupabaseClient,
  params: {
    feedId: string;
    userId: string;
    cardId: string;
    checkBackUntil: string;
    note?: string | null;
  }
): Promise<CheckBackRow> {
  const { data, error } = await supabase
    .from("user_checkback_cards")
    .upsert(
      {
        user_id: params.userId,
        feed_id: params.feedId,
        card_id: params.cardId,
        check_back_until: params.checkBackUntil,
        note: params.note?.trim() || null,
      },
      { onConflict: "feed_id,card_id" }
    )
    .select(CHECKBACK_SELECT)
    .single();

  if (error) throw error;
  return data as CheckBackRow;
}

export async function updateCheckBackDate(
  supabase: SupabaseClient,
  checkBackId: string,
  checkBackUntil: string
): Promise<void> {
  const { error } = await supabase
    .from("user_checkback_cards")
    .update({ check_back_until: checkBackUntil })
    .eq("id", checkBackId);

  if (error) throw error;
}

export async function clearCheckBack(
  supabase: SupabaseClient,
  checkBackId: string
): Promise<void> {
  const { error } = await supabase
    .from("user_checkback_cards")
    .delete()
    .eq("id", checkBackId);

  if (error) throw error;
}

export function compareCheckBackDates(a: string, b: string): number {
  const priority = { overdue: 0, due_today: 1, upcoming: 2 };
  const priorityDiff =
    priority[getCheckBackStatus(a)] - priority[getCheckBackStatus(b)];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(a).getTime() - new Date(b).getTime();
}

export function sortCheckBacks<T extends { check_back_until: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) =>
    compareCheckBackDates(a.check_back_until, b.check_back_until)
  );
}

/** A check back on a whole feed, not tied to a specific card. */
export interface FeedCheckBackRow {
  id: string;
  user_id: string;
  feed_id: string;
  title: string;
  note: string | null;
  check_back_until: string;
  created_at: string;
  author?: Pick<Profile, "id" | "email" | "full_name"> | null;
}

export async function getAllFeedCheckBacks(
  supabase: SupabaseClient
): Promise<FeedCheckBackRow[]> {
  const { data, error } = await supabase
    .from("feed_checkbacks")
    .select(CHECKBACK_SELECT)
    .order("check_back_until", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FeedCheckBackRow[];
}

export async function createFeedCheckBack(
  supabase: SupabaseClient,
  params: {
    feedId: string;
    userId: string;
    title: string;
    checkBackUntil: string;
    note?: string | null;
  }
): Promise<FeedCheckBackRow> {
  const title = params.title.trim();
  if (!title) {
    throw new Error("Add what to check back on.");
  }

  const { data, error } = await supabase
    .from("feed_checkbacks")
    .insert({
      user_id: params.userId,
      feed_id: params.feedId,
      title,
      check_back_until: params.checkBackUntil,
      note: params.note?.trim() || null,
    })
    .select(CHECKBACK_SELECT)
    .single();

  if (error) throw error;
  return data as FeedCheckBackRow;
}

export async function updateFeedCheckBackDate(
  supabase: SupabaseClient,
  checkBackId: string,
  checkBackUntil: string
): Promise<void> {
  const { error } = await supabase
    .from("feed_checkbacks")
    .update({ check_back_until: checkBackUntil })
    .eq("id", checkBackId);

  if (error) throw error;
}

export async function clearFeedCheckBack(
  supabase: SupabaseClient,
  checkBackId: string
): Promise<void> {
  const { error } = await supabase
    .from("feed_checkbacks")
    .delete()
    .eq("id", checkBackId);

  if (error) throw error;
}
