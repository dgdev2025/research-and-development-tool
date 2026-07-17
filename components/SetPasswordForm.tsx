"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageLoader } from "@/components/PageLoader";
import { AppLogo } from "@/components/AppLogo";

async function readJsonSafe(res: Response): Promise<{ error?: string; role?: string; ok?: boolean }> {
  const text = await res.text();
  if (!text) {
    return {
      error: res.ok
        ? "Empty response from server."
        : `Request failed (${res.status}).`,
    };
  }

  try {
    return JSON.parse(text) as { error?: string; role?: string; ok?: boolean };
  } catch {
    return { error: `Unexpected server response (${res.status}).` };
  }
}

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
      // Set password on the client session first (most reliable after invite hash auth).
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, alreadyUpdated: true }),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) {
        setError(data.error ?? "Failed to finish password setup.");
        setLoading(false);
        return;
      }

      // Pick up cleared require_password_setup flags before leaving this page.
      await supabase.auth.refreshSession().catch(() => undefined);

      router.replace("/dashboard");
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
