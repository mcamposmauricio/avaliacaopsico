export const SUPER_ADMIN_EMAIL = "mauricio@marqponto.com.br";
export const SUPER_ADMIN_USER_ID = "302dc367-1b53-4a47-af5e-d54a6b877e59";

export function isSuperAdmin(profile?: { email?: string | null; user_id?: string | null } | null): boolean {
  if (!profile) return false;
  return (
    profile.email?.toLowerCase() === SUPER_ADMIN_EMAIL &&
    profile.user_id === SUPER_ADMIN_USER_ID
  );
}