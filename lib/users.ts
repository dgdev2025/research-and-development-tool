import type { User } from "@supabase/supabase-js";
import { getUserAccountStatus } from "@/lib/auth";
import { getAllProfiles } from "@/lib/profiles";
import { getAdminClient } from "@/lib/adminAuth";
import type { SettingsUserRow } from "@/lib/types";

export async function getSettingsUsers(
  supabase: Parameters<typeof getAllProfiles>[0]
): Promise<SettingsUserRow[]> {
  const profiles = await getAllProfiles(supabase);
  const admin = getAdminClient();

  const authUsers = new Map<string, User>();

  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      authUsers.set(user.id, user);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return profiles.map((profile) => {
    const authUser = authUsers.get(profile.id);

    return {
      ...profile,
      status: authUser
        ? getUserAccountStatus(authUser)
        : "active",
    };
  });
}
