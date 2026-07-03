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
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
      }

      if (redirectTo?.startsWith("/feeds/")) {
        router.push(redirectTo);
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
          .single();

        if (profileData?.role === "admin") {
          router.push("/dashboard");
        } else {
          router.replace("/login?message=contributor-access");
        }
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
      {loading && (
        <PageLoader
          overlay
          message={isSignUp ? "Creating your account..." : "Signing you in..."}
        />
      )}

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <AppLogo />
        </div>

        {message === "contributor-access" && (
          <div className="info-msg">
            Contributors can only access feeds via shared links. Open a feed link
            from your team to sign in and comment.
          </div>
        )}

        <p className="auth-subtitle">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          )}
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
            {loading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="text-btn"
          disabled={loading}
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </>
  );
}
