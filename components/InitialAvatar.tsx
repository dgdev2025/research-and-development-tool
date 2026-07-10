import { getAvatarColor, getAvatarInitial } from "@/lib/avatar";
import { displayName } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

interface InitialAvatarProps {
  profile: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
  size?: number;
  className?: string;
}

export function InitialAvatar({
  profile,
  size = 36,
  className,
}: InitialAvatarProps) {
  const initial = getAvatarInitial(profile);
  const seed = profile?.id ?? profile?.email ?? initial;
  const { bg, fg } = getAvatarColor(seed);
  const label = displayName(profile);
  const avatarUrl = profile?.avatar_url?.trim() || null;

  return (
    <div
      className={className ? `initial-avatar ${className}` : "initial-avatar"}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarUrl ? "transparent" : bg,
        color: fg,
        fontSize: Math.round(size * 0.42),
      }}
      aria-label={label}
      title={label}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={label} className="initial-avatar-image" />
      ) : (
        initial
      )}
    </div>
  );
}
