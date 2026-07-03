import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { InviteUserForm } from "@/components/InviteUserForm";
import { SettingsUsers } from "@/components/SettingsUsers";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getProfile } from "@/lib/profiles";
import { getSettingsUsers } from "@/lib/users";
import { isServiceRoleConfigured } from "@/lib/env";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== "admin") {
    redirect("/login?message=contributor-access");
  }

  const users = isServiceRoleConfigured()
    ? await getSettingsUsers(supabase)
    : (await getAllProfiles(supabase)).map((profile) => ({
        ...profile,
        status: "active" as const,
      }));

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage users and roles</p>
        </div>
      </div>

      <div className="settings-info">
        <p>
          <strong>Admin</strong> — can import feeds, reorder cards, delete
          feeds, and manage users.
        </p>
        <p>
          <strong>Contributor</strong> — can view shared feed links and comment
          on cards.
        </p>
        <p>
          Invited users must set a password from the invite link before they
          can sign in. Re-send invites after changing production URL settings.
        </p>
      </div>

      <InviteUserForm />
      <SettingsUsers initialUsers={users} currentUserId={user.id} />
    </AppShell>
  );
}
