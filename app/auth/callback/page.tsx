import { AuthCallbackClient } from "@/components/AuthCallbackClient";

interface AuthCallbackPageProps {
  searchParams: Promise<{ next?: string; type?: string; code?: string }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const { next, type } = await searchParams;

  return (
    <main className="auth-page">
      <AuthCallbackClient
        next={next ?? "/auth/set-password"}
        type={type ?? "invite"}
      />
    </main>
  );
}
