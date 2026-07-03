import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profiles";
import { isServiceRoleConfigured } from "@/lib/env";

type AdminContext =
  | { ok: true; user: User; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminContext> {
  if (!isServiceRoleConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "User management requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user, supabase };
}

export function getAdminClient() {
  return createAdminClient();
}
