"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  ok: boolean;
  configured: boolean;
  connected: boolean;
  hasServiceKey: boolean;
  error?: string;
}

export function SupabaseSetupBanner() {
  const [status, setStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthStatus) => setStatus(data))
      .catch(() =>
        setStatus({
          ok: false,
          configured: false,
          connected: false,
          hasServiceKey: false,
          error: "Could not check Supabase status.",
        })
      );
  }, []);

  if (!status || status.ok) return null;

  return (
    <div className="setup-banner">
      <h3>Supabase setup required</h3>
      {status.configured === false ? (
        <ol>
          <li>Copy <code>.env.local.example</code> to <code>.env.local</code></li>
          <li>Add your Supabase URL and anon key</li>
          <li>Run <code>supabase/schema.sql</code> in the SQL Editor</li>
          <li>Restart the dev server</li>
        </ol>
      ) : (
        <p>{status.error ?? "Connected, but the database schema may be missing."}</p>
      )}
      {!status.hasServiceKey && status.connected && (
        <p className="setup-note">
          Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable email invites.
        </p>
      )}
    </div>
  );
}
