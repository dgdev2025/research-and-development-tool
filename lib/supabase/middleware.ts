import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { needsPasswordSetup } from "@/lib/auth";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

const ADMIN_ONLY_ROUTES = ["/feeds/new", "/teams"];

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<"admin" | "contributor" | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (data?.role === "admin" || data?.role === "contributor") {
    return data.role;
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login";
  const isAuthCallback = pathname === "/auth/callback";
  const isAuthConfirm = pathname === "/auth/confirm";
  const isAuthHashHandler = pathname === "/auth/hash-handler";
  const isSetPasswordRoute = pathname === "/auth/set-password";
  const isHomeRoute = pathname === "/";
  const isPublicRoute =
    isAuthRoute ||
    isAuthCallback ||
    isAuthConfirm ||
    isAuthHashHandler ||
    isSetPasswordRoute ||
    isHomeRoute ||
    pathname === "/api/health";

  const authCode = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const authType = request.nextUrl.searchParams.get("type");

  if (
    authCode &&
    pathname !== "/auth/callback" &&
    !pathname.startsWith("/api/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", "/auth/set-password");
    }
    if (!url.searchParams.has("type")) {
      url.searchParams.set("type", authType ?? "invite");
    }
    return NextResponse.redirect(url);
  }

  if (
    tokenHash &&
    authType &&
    pathname !== "/auth/confirm" &&
    !pathname.startsWith("/api/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", "/auth/set-password");
    }
    return NextResponse.redirect(url);
  }

  if (!isSupabaseConfigured()) {
    if (isPublicRoute) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname.startsWith("/feeds/")) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = await getUserRole(supabase, user.id);
    const mustSetPassword = needsPasswordSetup(user);
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (mustSetPassword && !isSetPasswordRoute && !isAuthCallback && !isAuthConfirm && !isAuthHashHandler) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/set-password";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (!mustSetPassword && isSetPasswordRoute) {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/dashboard" : "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isAdminOnlyRoute && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("message", "contributor-access");
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      const message = request.nextUrl.searchParams.get("message");

      if (message === "contributor-access") {
        return supabaseResponse;
      }

      const url = request.nextUrl.clone();

      if (redirectTo?.startsWith("/feeds/")) {
        url.pathname = redirectTo;
        url.search = "";
        return NextResponse.redirect(url);
      }

      if (role === "admin") {
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }

      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
