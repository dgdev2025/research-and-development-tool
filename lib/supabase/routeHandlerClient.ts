import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Builds a Supabase client for auth callback route handlers.
 * Captures Set-Cookie values so they can be applied to the final redirect
 * response (Next.js 15+ does not propagate cookies().set onto redirects).
 */
export async function createAuthCallbackClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore if the request cookie store is read-only.
          }
        });
      },
    },
  });

  function applyCookies(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return { supabase, applyCookies };
}
