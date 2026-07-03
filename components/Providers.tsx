"use client";

import { NavigationProgress } from "./NavigationProgress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationProgress />
      {children}
    </>
  );
}
