import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";
import { needsPasswordSetup } from "@/lib/auth";
import { markPasswordSetupComplete } from "@/lib/authAdmin";

interface SetPasswordBody {
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SetPasswordBody;
    const password = body.password?.trim();

    if (!password || password.length < 6) {
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

    if (!needsPasswordSetup(user)) {
      return NextResponse.json(
        { error: "Password setup is not required for this account." },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await markPasswordSetupComplete(user.id);

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
