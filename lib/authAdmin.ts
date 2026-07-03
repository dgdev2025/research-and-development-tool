import { getAdminClient } from "@/lib/adminAuth";
import { isServiceRoleConfigured } from "@/lib/env";

export async function markPasswordSetupRequired(userId: string): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const admin = getAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const existing = data.user;

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existing?.app_metadata,
      require_password_setup: true,
      password_setup_complete: false,
    },
    user_metadata: {
      ...existing?.user_metadata,
      needs_password_setup: true,
    },
  });
}

export async function markPasswordSetupComplete(userId: string): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const admin = getAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...data.user?.app_metadata,
      require_password_setup: false,
      password_setup_complete: true,
    },
    user_metadata: {
      ...data.user?.user_metadata,
      needs_password_setup: false,
    },
  });
}
