"use client";

import { AuthCallbackClient } from "@/components/AuthCallbackClient";

interface AuthHashHandlerProps {
  next?: string | null;
  type?: string | null;
}

/** @deprecated Prefer /auth/callback — kept for older invite links. */
export function AuthHashHandler({ next, type }: AuthHashHandlerProps) {
  return <AuthCallbackClient next={next} type={type} />;
}
