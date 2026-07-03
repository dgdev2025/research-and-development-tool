"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileRole } from "@/lib/profiles";
import type { Profile, UserRole } from "@/lib/types";
import { displayName, formatDate } from "@/lib/profiles";

interface SettingsUsersProps {
  initialProfiles: Profile[];
}

export function SettingsUsers({ initialProfiles }: SettingsUsersProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    setError(null);

    try {
      const supabase = createClient();
      await updateProfileRole(supabase, userId, role);
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === userId ? { ...profile, role } : profile
        )
      );
    } catch {
      setError("Failed to update role.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{displayName(profile)}</td>
                <td>{profile.email}</td>
                <td>
                  <select
                    className="role-select"
                    value={profile.role}
                    disabled={savingId === profile.id}
                    onChange={(e) =>
                      handleRoleChange(profile.id, e.target.value as UserRole)
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="contributor">Contributor</option>
                  </select>
                </td>
                <td>{formatDate(profile.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
