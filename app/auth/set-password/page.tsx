import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { needsPasswordSetup } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!needsPasswordSetup(user)) {
    const profile = await getProfile(supabase, user.id);
    if (profile?.role === "admin") {
      redirect("/dashboard");
    }
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        <SetPasswordForm />
      </div>
    </main>
  );
}
