"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  displayName,
  removeAvatarFile,
  updateOwnProfile,
  uploadAvatar,
} from "@/lib/profiles";
import type { Profile } from "@/lib/types";
import { InitialAvatar } from "@/components/InitialAvatar";
import { PageLoader } from "@/components/PageLoader";

interface ProfileSettingsFormProps {
  profile: Profile;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewProfile: Profile = {
    ...profile,
    full_name: fullName.trim() || profile.full_name,
    avatar_url: removeAvatar ? null : previewUrl ?? avatarUrl,
  };

  const handleFileChange = (file: File | null) => {
    setError(null);
    setSuccess(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Photo must be 2MB or smaller.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      let nextAvatarUrl = avatarUrl;

      if (removeAvatar) {
        await removeAvatarFile(supabase, profile.id);
        nextAvatarUrl = null;
      } else if (pendingFile) {
        nextAvatarUrl = await uploadAvatar(supabase, profile.id, pendingFile);
      }

      const updated = await updateOwnProfile(supabase, profile.id, {
        full_name: fullName.trim() || null,
        avatar_url: nextAvatarUrl,
      });

      setAvatarUrl(updated.avatar_url);
      setFullName(updated.full_name ?? "");
      setPendingFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setRemoveAvatar(false);
      setSuccess("Profile updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <PageLoader overlay message="Saving profile..." />}

      <form onSubmit={handleSubmit} className="profile-settings-form">
        <div className="profile-settings-photo">
          <InitialAvatar profile={previewProfile} size={88} className="profile-settings-avatar" />
          <div className="profile-settings-photo-actions">
            <p className="profile-settings-photo-label">Profile photo</p>
            <p className="profile-settings-photo-hint">
              JPG, PNG, WEBP, or GIF up to 2MB. Shown in comments and your menu.
            </p>
            <div className="profile-settings-photo-buttons">
              <label className="secondary-btn-sm profile-settings-upload-btn">
                Choose photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </label>
              {(avatarUrl || previewUrl) && !removeAvatar && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={handleRemovePhoto}
                  disabled={loading}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="profile-settings-field">
          Display name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={profile.email}
            maxLength={80}
            disabled={loading}
          />
        </label>

        <label className="profile-settings-field">
          Email
          <input type="email" value={profile.email} disabled readOnly />
        </label>

        <p className="profile-settings-preview-name">
          Appears as <strong>{displayName(previewProfile)}</strong>
        </p>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <div className="profile-settings-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </>
  );
}
