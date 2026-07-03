import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/login";
  const siteUrl = getSiteUrl(request);

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const safeNext = next.startsWith("/") ? next : "/login";
  return NextResponse.redirect(`${siteUrl}${safeNext}`);
}
