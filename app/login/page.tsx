import { LoginForm } from "@/components/LoginForm";
import { SupabaseSetupBanner } from "@/components/SupabaseSetupBanner";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect, message } = await searchParams;

  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        <SupabaseSetupBanner />
        <LoginForm redirectTo={redirect} message={message} />
      </div>
    </main>
  );
}
