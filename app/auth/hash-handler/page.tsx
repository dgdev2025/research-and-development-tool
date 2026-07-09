import { AuthHashHandler } from "@/components/AuthHashHandler";

interface HashHandlerPageProps {
  searchParams: Promise<{ next?: string; type?: string }>;
}

export default async function AuthHashHandlerPage({
  searchParams,
}: HashHandlerPageProps) {
  const { next, type } = await searchParams;

  return (
    <main className="auth-page">
      <AuthHashHandler next={next ?? "/auth/set-password"} type={type ?? "invite"} />
    </main>
  );
}
