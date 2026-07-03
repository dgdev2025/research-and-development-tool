"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/PageLoader";
import { AppLogo } from "@/components/AppLogo";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { needs_password_setup: false },
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .single();

      if (profileData?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.replace("/login?message=contributor-access");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set password."
      );
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {loading && <PageLoader overlay message="Saving your password..." />}

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <AppLogo />
        </div>

        <p className="auth-subtitle">Set your password to finish joining</p>
        <p className="auth-hint">
          You must create a password before you can sign in to the app.
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : "Set password and continue"}
          </button>
        </form>

        <button
          type="button"
          className="text-btn auth-secondary-btn"
          onClick={handleSignOut}
          disabled={loading}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
