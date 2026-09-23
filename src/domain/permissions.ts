export type AccessUser = {
  role: string;
  status: string;
};

export function canAccessRole(role: string, user: AccessUser | null) {
  return Boolean(user && user.status === "APPROVED" && user.role === role);
}
