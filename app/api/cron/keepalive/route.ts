import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    // Allow in development so local testing still works without a secret.
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Weekly keep-alive for Supabase.
 * Invoked by Vercel Cron — pings the database so the project stays active.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase is not configured.",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  const { url, anonKey } = getSupabaseEnv();
  const startedAt = Date.now();

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          connected: false,
          error: error.message,
          checkedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      rowsSeen: data?.length ?? 0,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      message: "Supabase keep-alive ping succeeded.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: error instanceof Error ? error.message : "Keep-alive ping failed.",
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
