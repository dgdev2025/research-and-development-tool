"use client";

import { NavigationProgress } from "./NavigationProgress";
import { AuthRedirectHandler } from "./AuthRedirectHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthRedirectHandler />
      <NavigationProgress />
      {children}
    </>
  );
}
