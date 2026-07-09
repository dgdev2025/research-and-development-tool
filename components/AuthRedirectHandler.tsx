"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildAuthCallbackUrl,
  parseAuthHash,
  shouldRequirePasswordSetup,
} from "@/lib/authRedirect";

export function AuthRedirectHandler() {
  useEffect(() => {
    let cancelled = false;

    async function handleAuthRedirect() {
      const { pathname, search, hash } = window.location;

      const callbackUrl = buildAuthCallbackUrl(search);
      if (
        callbackUrl &&
        !pathname.startsWith("/auth/callback") &&
        !pathname.startsWith("/auth/confirm")
      ) {
        window.location.replace(callbackUrl);
        return;
      }

      const hashTokens = parseAuthHash(hash);
      if (!hashTokens) {
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.setSession({
        access_token: hashTokens.accessToken,
        refresh_token: hashTokens.refreshToken,
      });

      if (cancelled || error || !data.session?.user) {
        return;
      }

      const searchParams = new URLSearchParams(search);
      const next = searchParams.get("next");
      const type = searchParams.get("type") ?? hashTokens.type;
      const user = data.session.user;

      const mustSetPassword = shouldRequirePasswordSetup({
        type,
        next,
        requirePasswordSetup: user.app_metadata?.require_password_setup === true,
        needsPasswordSetup: user.user_metadata?.needs_password_setup === true,
        invitedAt: user.invited_at,
        passwordSetupComplete: user.app_metadata?.password_setup_complete === true,
      });

      if (mustSetPassword) {
        await fetch("/api/auth/prepare-invite-session", { method: "POST" });
        window.location.replace("/auth/set-password");
        return;
      }

      window.location.replace("/dashboard");
    }

    void handleAuthRedirect();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
