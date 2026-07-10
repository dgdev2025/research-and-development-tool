import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserRole } from "./types";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function getAllProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: { full_name?: string | null; avatar_url?: string | null }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${userId}/avatar.${safeExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function removeAvatarFile(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase.storage.from("avatars").list(userId);
  const files = (data ?? []).map((file) => `${userId}/${file.name}`);
  if (files.length === 0) return;

  const { error } = await supabase.storage.from("avatars").remove(files);
  if (error) throw error;
}

export function displayName(profile: Pick<Profile, "email" | "full_name"> | null): string {
  if (!profile) return "Unknown";
  return profile.full_name?.trim() || profile.email;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
