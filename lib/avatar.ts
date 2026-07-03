import type { Profile } from "./types";

const AVATAR_COLORS = [
  { bg: "#E57373", fg: "#ffffff" },
  { bg: "#F06292", fg: "#ffffff" },
  { bg: "#BA68C8", fg: "#ffffff" },
  { bg: "#9575CD", fg: "#ffffff" },
  { bg: "#7986CB", fg: "#ffffff" },
  { bg: "#64B5F6", fg: "#ffffff" },
  { bg: "#4FC3F7", fg: "#ffffff" },
  { bg: "#4DD0E1", fg: "#ffffff" },
  { bg: "#4DB6AC", fg: "#ffffff" },
  { bg: "#81C784", fg: "#ffffff" },
  { bg: "#AED581", fg: "#1f2937" },
  { bg: "#FFD54F", fg: "#1f2937" },
  { bg: "#FFB74D", fg: "#1f2937" },
  { bg: "#FF8A65", fg: "#ffffff" },
  { bg: "#A1887F", fg: "#ffffff" },
  { bg: "#90A4AE", fg: "#ffffff" },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarInitial(
  profile: Pick<Profile, "email" | "full_name"> | null
): string {
  if (!profile) return "?";

  const fullName = profile.full_name?.trim();
  if (fullName) {
    return fullName.charAt(0).toUpperCase();
  }

  const email = profile.email?.trim();
  if (email) {
    return email.charAt(0).toUpperCase();
  }

  return "?";
}

export function getAvatarColor(seed: string): { bg: string; fg: string } {
  const index = hashString(seed) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
