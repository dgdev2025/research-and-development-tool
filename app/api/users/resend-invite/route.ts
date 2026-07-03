import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profiles";
import { getSiteUrl } from "@/lib/env";
import { requireAdmin, getAdminClient } from "@/lib/adminAuth";

interface ResendBody {
  userId?: string;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as ResendBody;
    const userId = body.userId?.trim();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: authUserData, error: fetchError } =
      await admin.auth.admin.getUserById(userId);

    if (fetchError || !authUserData.user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const authUser = authUserData.user;
    const email = authUser.email;

    if (!email) {
      return NextResponse.json(
        { error: "User has no email address." },
        { status: 400 }
      );
    }

    const profile = await getProfile(auth.supabase, userId);
    const siteUrl = getSiteUrl(request);
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/set-password`;
    const metadata = {
      full_name:
        profile?.full_name ??
        authUser.user_metadata?.full_name ??
        email.split("@")[0],
      role: profile?.role ?? authUser.user_metadata?.role ?? "contributor",
      needs_password_setup: true,
    };

    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authUser.user_metadata,
        ...metadata,
      },
    });

    if (authUser.last_sign_in_at) {
      const { error: resetError } = await admin.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        email,
        message: "Password setup email sent.",
      });
    }

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: metadata,
        redirectTo,
      }
    );

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      email,
      message: "Invitation resent.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resend invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
