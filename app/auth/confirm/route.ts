import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { isInviteAuthType } from "@/lib/auth";
import { markPasswordSetupRequired } from "@/lib/authAdmin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const siteUrl = getSiteUrl(request);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/auth/set-password";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error || !data.user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  if (isInviteAuthType(type)) {
    await markPasswordSetupRequired(data.user.id);
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/auth/set-password";

  return NextResponse.redirect(`${siteUrl}${safeNext}`);
}
