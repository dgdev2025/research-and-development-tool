import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markPasswordSetupRequired } from "@/lib/authAdmin";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markPasswordSetupRequired(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to prepare invite session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
