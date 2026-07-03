"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("contributor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send invite.");
        return;
      }

      setSuccess(`Invite sent to ${data.email}`);
      setEmail("");
      setFullName("");
      setRole("contributor");
    } catch {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-form-card">
      <h2>Invite user</h2>
      <p className="invite-form-hint">
        Sends a Supabase email invite. The user sets their password from the link before signing in.
      </p>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <form onSubmit={handleSubmit} className="invite-form">
        <label className="invite-field-group">
          Email
          <input
            type="email"
            className="invite-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="invite-field-group">
          Full name
          <input
            type="text"
            className="invite-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="invite-field-group">
          Role
          <select
            className="invite-field"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="contributor">Contributor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" className="submit-btn invite-submit-btn" disabled={loading}>
          {loading ? "Sending..." : "Send invite"}
        </button>
      </form>
    </div>
  );
}
