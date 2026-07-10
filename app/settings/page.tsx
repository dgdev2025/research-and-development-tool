import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/login");

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Update your profile name and photo</p>
        </div>
      </div>

      <section className="settings-card" aria-label="User settings">
        <ProfileSettingsForm profile={profile} />
      </section>
    </AppShell>
  );
}
