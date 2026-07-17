import { SetPasswordGate } from "@/components/SetPasswordGate";

export default function SetPasswordPage() {
  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        <SetPasswordGate />
      </div>
    </main>
  );
}
