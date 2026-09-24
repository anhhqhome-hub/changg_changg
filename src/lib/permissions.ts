import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AccountStatus, Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
export { canAccessRole } from "@/domain/permissions";

export type AppUser = {
  id: string;
  name: string;
  username: string | null;
  role: Role;
  status: AccountStatus;
  preferredLocale: string;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch((error) => {
    console.error("[auth] Session lookup failed.", error);
    return null;
  });
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      status: true,
      preferredLocale: true
    }
  });
}

export async function requireUser(locale = "vi") {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.status === "PENDING") redirect(`/${locale}/pending`);
  if (user.status === "REJECTED") redirect(`/${locale}/rejected`);
  if (user.status === "SUSPENDED") redirect(`/${locale}/suspended`);
  return user;
}

export async function requireRole(role: Role, locale = "vi") {
  const user = await requireUser(locale);
  if (user.role !== role) redirect(`/${locale}`);
  return user;
}

export async function assertRole(user: AppUser, roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
}
