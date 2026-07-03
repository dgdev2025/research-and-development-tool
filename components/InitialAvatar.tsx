import { getAvatarColor, getAvatarInitial } from "@/lib/avatar";
import { displayName } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

interface InitialAvatarProps {
  profile: Pick<Profile, "id" | "email" | "full_name"> | null;
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

  return (
    <div
      className={className ? `initial-avatar ${className}` : "initial-avatar"}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: fg,
        fontSize: Math.round(size * 0.42),
      }}
      aria-label={label}
      title={label}
    >
      {initial}
    </div>
  );
}
