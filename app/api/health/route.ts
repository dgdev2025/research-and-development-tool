import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      connected: false,
      hasServiceKey: false,
      error: "Supabase environment variables are not configured.",
    });
  }

  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();

  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        configured: true,
        connected: false,
        hasServiceKey: Boolean(serviceRoleKey),
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      hasServiceKey: Boolean(serviceRoleKey),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      configured: true,
      connected: false,
      hasServiceKey: Boolean(serviceRoleKey),
      error: "Could not connect to Supabase.",
    });
  }
}
