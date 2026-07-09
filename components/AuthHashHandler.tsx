"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseAuthHash, shouldRequirePasswordSetup } from "@/lib/authRedirect";
import { PageLoader } from "@/components/PageLoader";

interface AuthHashHandlerProps {
  next?: string | null;
  type?: string | null;
}

export function AuthHashHandler({ next, type }: AuthHashHandlerProps) {
  const [message, setMessage] = useState("Completing your invitation...");

  useEffect(() => {
    let cancelled = false;

    async function completeAuthFromHash() {
      const hash = window.location.hash;
      const tokens = parseAuthHash(hash);

      if (!tokens) {
        window.location.replace("/login?error=auth");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (cancelled || error || !data.session?.user) {
        window.location.replace("/login?error=auth");
        return;
      }

      const user = data.session.user;
      const resolvedType = type ?? tokens.type;
      const mustSetPassword = shouldRequirePasswordSetup({
        type: resolvedType,
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

    void completeAuthFromHash().catch(() => {
      if (!cancelled) {
        setMessage("Could not complete sign-in. Redirecting...");
        window.location.replace("/login?error=auth");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [next, type]);

  return <PageLoader overlay message={message} />;
}
