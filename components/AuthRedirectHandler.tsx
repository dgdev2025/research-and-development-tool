"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function buildCallbackUrl(search: string, hash: string): string | null {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (code) {
    const callbackParams = new URLSearchParams({
      code,
      type: type ?? "invite",
      next: "/auth/set-password",
    });
    return `/auth/callback?${callbackParams.toString()}`;
  }

  if (tokenHash && type) {
    const confirmParams = new URLSearchParams({
      token_hash: tokenHash,
      type,
      next: "/auth/set-password",
    });
    return `/auth/confirm?${confirmParams.toString()}`;
  }

  if (hash.includes("access_token")) {
    return null;
  }

  return null;
}

export function AuthRedirectHandler() {
  useEffect(() => {
    let cancelled = false;

    async function handleAuthRedirect() {
      const { pathname, search, hash } = window.location;

      if (pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm")) {
        return;
      }

      const callbackUrl = buildCallbackUrl(search, hash);
      if (callbackUrl) {
        window.location.replace(callbackUrl);
        return;
      }

      if (!hash.includes("access_token")) {
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (cancelled || error || !data.session) {
        return;
      }

      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const type = hashParams.get("type");

      if (type === "invite" || type === "signup") {
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
