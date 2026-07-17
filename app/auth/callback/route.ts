import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { shouldRequirePasswordSetup } from "@/lib/authRedirect";
import { markPasswordSetupRequired } from "@/lib/authAdmin";
import { createAuthCallbackClient } from "@/lib/supabase/routeHandlerClient";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");
  const siteUrl = getSiteUrl(request);

  if (!code) {
    // Hash-based invite tokens are handled client-side; keep the URL hash.
    const rewriteUrl = new URL(requestUrl.toString());
    rewriteUrl.pathname = "/auth/hash-handler";
    if (!rewriteUrl.searchParams.has("next")) {
      rewriteUrl.searchParams.set("next", "/auth/set-password");
    }
    if (!rewriteUrl.searchParams.has("type")) {
      rewriteUrl.searchParams.set("type", type ?? "invite");
    }
    return NextResponse.rewrite(rewriteUrl);
  }

  const { supabase, applyCookies } = await createAuthCallbackClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const mustSetPassword = shouldRequirePasswordSetup({
    type,
    next,
    requirePasswordSetup: data.user.app_metadata?.require_password_setup === true,
    needsPasswordSetup: data.user.user_metadata?.needs_password_setup === true,
    invitedAt: data.user.invited_at,
    passwordSetupComplete: data.user.app_metadata?.password_setup_complete === true,
  });

  if (mustSetPassword) {
    await markPasswordSetupRequired(data.user.id);
    await supabase.auth.refreshSession().catch(() => undefined);
    return applyCookies(NextResponse.redirect(`${siteUrl}/auth/set-password`));
  }

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return applyCookies(NextResponse.redirect(`${siteUrl}${safeNext}`));
}
