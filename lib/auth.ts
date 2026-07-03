import type { User } from "@supabase/supabase-js";

export function needsPasswordSetup(user: User): boolean {
  if (user.app_metadata?.require_password_setup === true) {
    return true;
  }

  return user.user_metadata?.needs_password_setup === true;
}

export function getUserAccountStatus(user: {
  invited_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): "active" | "pending" | "needs_password" {
  if (
    user.app_metadata?.require_password_setup === true ||
    user.user_metadata?.needs_password_setup === true
  ) {
    return "needs_password";
  }

  if (user.invited_at && !user.last_sign_in_at) {
    return "pending";
  }

  return "active";
}

export function isInviteAuthType(type: string | null | undefined): boolean {
  return type === "invite" || type === "signup";
}
