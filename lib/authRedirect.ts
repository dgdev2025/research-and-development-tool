import { isInviteAuthType } from "@/lib/auth";

export interface AuthHashTokens {
  accessToken: string;
  refreshToken: string;
  type: string | null;
}

export function parseAuthHash(hash: string): AuthHashTokens | null {
  const normalized = hash.replace(/^#/, "");
  if (!normalized.includes("access_token")) {
    return null;
  }

  const params = new URLSearchParams(normalized);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    type: params.get("type"),
  };
}

export function shouldRequirePasswordSetup(options: {
  type?: string | null;
  next?: string | null;
  requirePasswordSetup?: boolean;
  needsPasswordSetup?: boolean;
  invitedAt?: string | null;
  passwordSetupComplete?: boolean;
}): boolean {
  if (isInviteAuthType(options.type)) {
    return true;
  }

  if (options.next === "/auth/set-password") {
    return true;
  }

  if (options.requirePasswordSetup === true || options.needsPasswordSetup === true) {
    return true;
  }

  if (options.invitedAt && options.passwordSetupComplete !== true) {
    return true;
  }

  return false;
}

export function buildAuthCallbackUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (code) {
    const callbackParams = new URLSearchParams({
      code,
      type: type ?? "invite",
      next: "/auth/set-password",
    });
    return `/auth/callback?${callbackParams.toString()}`;
  }

  if (tokenHash && type) {
    const confirmParams = new URLSearchParams({
      token_hash: tokenHash,
      type,
      next: "/auth/set-password",
    });
    return `/auth/confirm?${confirmParams.toString()}`;
  }

  return null;
}
