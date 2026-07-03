"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/PageLoader";
import { AppLogo } from "@/components/AppLogo";

interface LoginFormProps {
  redirectTo?: string;
  message?: string;
}

export function LoginForm({ redirectTo, message }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (redirectTo?.startsWith("/feeds/")) {
        router.push(redirectTo);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Check your Supabase configuration."
      );
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <PageLoader overlay message="Signing you in..." />}

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <AppLogo />
        </div>

        {message === "contributor-access" && (
          <div className="info-msg">
            Contributors can view feeds on the dashboard and comment on cards.
            Import and settings are limited to admins.
          </div>
        )}

        <p className="auth-subtitle">Sign in to continue</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </label>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : "Sign in"}
          </button>
        </form>
      </div>
    </>
  );
}
