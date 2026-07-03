export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
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
