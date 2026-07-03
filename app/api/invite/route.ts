import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profiles";
import { getSupabaseEnv, isServiceRoleConfigured, getSiteUrl } from "@/lib/env";
import type { UserRole } from "@/lib/types";

interface InviteBody {
  email?: string;
  fullName?: string;
  role?: UserRole;
}

export async function POST(request: Request) {
  try {
    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: "Email invites require SUPABASE_SERVICE_ROLE_KEY in .env.local" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile(supabase, user.id);
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as InviteBody;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const role = body.role ?? "contributor";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const siteUrl = getSiteUrl(request);

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || email.split("@")[0],
        role,
      },
      redirectTo: `${siteUrl}/auth/callback?next=/login`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      email: data.user?.email ?? email,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
