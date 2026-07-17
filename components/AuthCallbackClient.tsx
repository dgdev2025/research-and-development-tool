"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  parseAuthHash,
  shouldRequirePasswordSetup,
} from "@/lib/authRedirect";
import { PageLoader } from "@/components/PageLoader";

interface AuthCallbackClientProps {
  next?: string | null;
  type?: string | null;
}

export function AuthCallbackClient({ next, type }: AuthCallbackClientProps) {
  const [message, setMessage] = useState("Completing your invitation...");

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const supabase = createClient();
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const resolvedType = type ?? searchParams.get("type");
      const resolvedNext = next ?? searchParams.get("next") ?? "/auth/set-password";
      const hashTokens = parseAuthHash(window.location.hash);

      let user = null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.user) {
          throw new Error(error?.message ?? "Could not exchange invite code.");
        }
        user = data.user;
      } else if (hashTokens) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashTokens.accessToken,
          refresh_token: hashTokens.refreshToken,
        });
        if (error || !data.session?.user) {
          throw new Error(error?.message ?? "Could not restore invite session.");
        }
        user = data.session.user;
      } else {
        // Hash can arrive a tick later in some browsers; retry once.
        await new Promise((resolve) => setTimeout(resolve, 50));
        const retryHash = parseAuthHash(window.location.hash);
        if (!retryHash) {
          window.location.replace("/login?error=auth");
          return;
        }
        const { data, error } = await supabase.auth.setSession({
          access_token: retryHash.accessToken,
          refresh_token: retryHash.refreshToken,
        });
        if (error || !data.session?.user) {
          throw new Error(error?.message ?? "Could not restore invite session.");
        }
        user = data.session.user;
      }

      if (cancelled || !user) return;

      const hashType = hashTokens?.type ?? null;
      const mustSetPassword = shouldRequirePasswordSetup({
        type: resolvedType ?? hashType,
        next: resolvedNext,
        requirePasswordSetup: user.app_metadata?.require_password_setup === true,
        needsPasswordSetup: user.user_metadata?.needs_password_setup === true,
        invitedAt: user.invited_at,
        passwordSetupComplete: user.app_metadata?.password_setup_complete === true,
      });

      const inviteLike =
        mustSetPassword ||
        resolvedType === "invite" ||
        resolvedType === "recovery" ||
        resolvedType === "signup" ||
        hashType === "invite" ||
        hashType === "recovery";

      if (inviteLike) {
        await fetch("/api/auth/prepare-invite-session", { method: "POST" }).catch(
          () => undefined
        );
        window.location.replace("/auth/set-password");
        return;
      }

      const safeNext =
        resolvedNext.startsWith("/") && !resolvedNext.startsWith("//")
          ? resolvedNext
          : "/dashboard";
      window.location.replace(safeNext);
    }

    void completeAuth().catch(() => {
      if (!cancelled) {
        setMessage("Could not complete invitation. Redirecting...");
        window.location.replace("/login?error=auth");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [next, type]);

  return <PageLoader overlay message={message} />;
}
