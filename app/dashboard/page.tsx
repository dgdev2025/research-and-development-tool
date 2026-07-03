import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DashboardTable } from "@/components/DashboardTable";
import { SupabaseSetupBanner } from "@/components/SupabaseSetupBanner";
import { createClient } from "@/lib/supabase/server";
import { getFeeds } from "@/lib/feeds";
import { getProfile } from "@/lib/profiles";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== "admin") {
    redirect("/login?message=contributor-access");
  }

  const feeds = await getFeeds(supabase);

  return (
    <AppShell>
      <SupabaseSetupBanner />

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>All imported research feeds</p>
        </div>
        <Link href="/feeds/new" className="submit-btn">
          Import Feed
        </Link>
      </div>

      <DashboardTable feeds={feeds} isAdmin />
    </AppShell>
  );
}
