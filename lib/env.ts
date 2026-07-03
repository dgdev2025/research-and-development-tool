export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    siteUrl: getSiteUrl(),
  };
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

/** Production-safe URL for auth emails and redirects (never localhost on Vercel). */
export function getPublicSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !isLocalhostUrl(configured)) {
    return normalizeSiteUrl(configured);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    const host = productionUrl.replace(/^https?:\/\//, "");
    return normalizeSiteUrl(`https://${host}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && !isLocalhostUrl(vercelUrl)) {
    return normalizeSiteUrl(`https://${vercelUrl.replace(/^https?:\/\//, "")}`);
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    if (forwardedHost && !forwardedHost.includes("localhost")) {
      return normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`);
    }
  }

  return normalizeSiteUrl(configured || "http://localhost:3000");
}

export function getSiteUrl(request?: Request): string {
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    if (forwardedHost) {
      return normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`);
    }

    const origin = new URL(request.url).origin;
    if (origin) {
      return normalizeSiteUrl(origin);
    }
  }

  return getPublicSiteUrl(request);
}

export function getInviteRedirectUrl(request?: Request): string {
  const siteUrl = getPublicSiteUrl(request);
  const params = new URLSearchParams({
    type: "invite",
    next: "/auth/set-password",
  });
  return `${siteUrl}/auth/callback?${params.toString()}`;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return (
    Boolean(url && anonKey) &&
    !url.includes("your-project") &&
    anonKey !== "your-anon-key"
  );
}

export function isServiceRoleConfigured(): boolean {
  const { serviceRoleKey } = getSupabaseEnv();
  return Boolean(serviceRoleKey && serviceRoleKey !== "your-service-role-key");
}
