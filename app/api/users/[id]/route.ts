import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profiles";
import { requireAdmin, getAdminClient } from "@/lib/adminAuth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { user: currentUser, supabase } = auth;
    const { id: targetUserId } = await params;

    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const targetProfile = await getProfile(supabase, targetUserId);
    if (!targetProfile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetProfile.role === "admin") {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account." },
          { status: 400 }
        );
      }
    }

    const { count: feedCount } = await supabase
      .from("feeds")
      .select("*", { count: "exact", head: true })
      .eq("uploaded_by", targetUserId);

    if ((feedCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This user uploaded feeds and cannot be deleted. Reassign or delete their feeds first.",
        },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(targetUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
