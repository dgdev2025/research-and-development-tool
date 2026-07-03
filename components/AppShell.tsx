import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";
import { AppNav } from "@/components/AppNav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    redirect("/login");
  }

  return (
    <>
      <AppNav profile={profile} />
      <main className="app">{children}</main>
    </>
  );
}
