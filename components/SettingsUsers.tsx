"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileRole } from "@/lib/profiles";
import type { SettingsUserRow, UserRole } from "@/lib/types";
import { displayName, formatDate } from "@/lib/profiles";

interface SettingsUsersProps {
  initialUsers: SettingsUserRow[];
  currentUserId: string;
}

function statusLabel(status: SettingsUserRow["status"]): string {
  switch (status) {
    case "pending":
      return "Invite pending";
    case "needs_password":
      return "Needs password";
    default:
      return "Active";
  }
}

export function SettingsUsers({
  initialUsers,
  currentUserId,
}: SettingsUsersProps) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      await updateProfileRole(supabase, userId, role);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role } : user))
      );
    } catch {
      setError("Failed to update role.");
    } finally {
      setSavingId(null);
    }
  };

  const handleResendInvite = async (userId: string) => {
    setActionUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/users/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resend invitation.");
        return;
      }

      setSuccess(data.message ?? `Invitation resent to ${data.email}.`);
    } catch {
      setError("Failed to resend invitation.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setActionUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete user.");
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setConfirmDeleteId(null);
      setSuccess("User deleted.");
    } catch {
      setError("Failed to delete user.");
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const canResend =
                user.status === "pending" || user.status === "needs_password";

              return (
                <tr key={user.id}>
                  <td>{displayName(user)}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="role-select"
                      value={user.role}
                      disabled={savingId === user.id || isSelf}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRole)
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="contributor">Contributor</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-badge--${user.status}`}
                    >
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="user-actions">
                      {canResend && (
                        <button
                          type="button"
                          className="secondary-btn-sm"
                          disabled={actionUserId === user.id}
                          onClick={() => handleResendInvite(user.id)}
                        >
                          {actionUserId === user.id
                            ? "Sending..."
                            : "Resend invite"}
                        </button>
                      )}

                      {!isSelf &&
                        (confirmDeleteId === user.id ? (
                          <div className="delete-confirm">
                            <span>Delete this user?</span>
                            <button
                              type="button"
                              className="danger-btn-sm"
                              disabled={actionUserId === user.id}
                              onClick={() => handleDelete(user.id)}
                            >
                              {actionUserId === user.id
                                ? "Deleting..."
                                : "Confirm"}
                            </button>
                            <button
                              type="button"
                              className="reset-btn"
                              disabled={actionUserId === user.id}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="danger-btn-sm"
                            disabled={actionUserId === user.id}
                            onClick={() => setConfirmDeleteId(user.id)}
                          >
                            Delete
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
