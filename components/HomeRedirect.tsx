"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseAuthHash, shouldRequirePasswordSetup } from "@/lib/authRedirect";
import { PageLoader } from "@/components/PageLoader";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function resolveHomeDestination() {
      const hashTokens = parseAuthHash(window.location.hash);
      const supabase = createClient();

      if (hashTokens) {
        const { data, error } = await supabase.auth.setSession({
          access_token: hashTokens.accessToken,
          refresh_token: hashTokens.refreshToken,
        });

        if (!cancelled && !error && data.session?.user) {
          const user = data.session.user;
          const mustSetPassword = shouldRequirePasswordSetup({
            type: hashTokens.type,
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
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
    }

    void resolveHomeDestination();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <PageLoader overlay message="Loading..." />;
}
