import { NextResponse } from "next/server";
import { getSiteUrl, isServiceRoleConfigured } from "@/lib/env";
import { requireAdmin, getAdminClient } from "@/lib/adminAuth";
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

    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as InviteBody;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const role = body.role ?? "contributor";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const admin = getAdminClient();
    const siteUrl = getSiteUrl(request);

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || email.split("@")[0],
        role,
        needs_password_setup: true,
      },
      redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
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
