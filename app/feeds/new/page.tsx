import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ImportFeedForm } from "@/components/ImportFeedForm";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";

export default async function NewFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== "admin") {
    redirect("/login?message=contributor-access");
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Import Feed</h1>
          <p>Upload a markdown file and give it a title</p>
        </div>
      </div>
      <ImportFeedForm userId={user.id} />
    </AppShell>
  );
}
