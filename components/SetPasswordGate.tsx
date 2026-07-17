"use client";

import { useEffect, useState } from "react";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { createClient } from "@/lib/supabase/client";
import { needsPasswordSetup } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";

/**
 * Client gate for invite acceptance: waits briefly for the auth session cookie
 * to become readable after the callback redirect before bouncing to login.
 */
export function SetPasswordGate() {
  const [state, setState] = useState<"loading" | "ready" | "unauthorized">("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    let attempts = 0;

    async function resolveSession() {
      while (!cancelled && attempts < 8) {
        attempts += 1;
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (!needsPasswordSetup(user)) {
            window.location.replace("/dashboard");
            return;
          }
          if (!cancelled) setState("ready");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (!cancelled) {
        setState("unauthorized");
        window.location.replace("/login?error=auth");
      }
    }

    void resolveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state !== "ready") {
    return <PageLoader overlay message="Preparing password setup..." />;
  }

  return <SetPasswordForm />;
}
