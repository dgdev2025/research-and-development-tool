import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";
import { needsPasswordSetup } from "@/lib/auth";
import { markPasswordSetupComplete } from "@/lib/authAdmin";

interface SetPasswordBody {
  password?: string;
  alreadyUpdated?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SetPasswordBody;
    const password = body.password?.trim();
    const alreadyUpdated = body.alreadyUpdated === true;

    if (!alreadyUpdated && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If the client already updated the password, just finalize metadata.
    // Otherwise update here (legacy / non-client callers).
    if (!alreadyUpdated) {
      if (!needsPasswordSetup(user) && user.app_metadata?.password_setup_complete === true) {
        return NextResponse.json(
          { error: "Password setup is not required for this account." },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password!,
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    await markPasswordSetupComplete(user.id);

    // Refresh so subsequent requests see cleared setup flags.
    await supabase.auth.refreshSession().catch(() => undefined);

    const profile = await getProfile(supabase, user.id);

    return NextResponse.json({
      ok: true,
      role: profile?.role ?? "contributor",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
