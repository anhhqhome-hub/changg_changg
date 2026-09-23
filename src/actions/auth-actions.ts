"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2).max(120),
  schoolId: z.string().min(1),
  gradeLevel: z.string().max(40).optional(),
  locale: z.enum(["vi", "en"]).default("vi")
});

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type LoginActionState = {
  error?: string;
};

export async function signInAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });
  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }
  const limit = checkRateLimit(`login:${parsed.data.email}`, 8, 10 * 60_000);
  if (!limit.ok) {
    return { error: "Too many login attempts. Please wait a few minutes and try again." };
  }

  const result = await auth.api
    .signInEmail({
      body: parsed.data,
      headers: await headers()
    })
    .catch(() => null);
  if (!result?.user?.id) {
    return { error: "Invalid email or password." };
  }
  const user = await (async () => {
    try {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { lastLoginAt: new Date() }
      });
      return await prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    } catch (error) {
      console.error("[login] User database lookup failed after authentication.", error);
      return null;
    }
  })();
  if (!user) {
    return { error: "The database is temporarily unavailable. Please retry." };
  }
  const locale = user.preferredLocale || "vi";
  if (user.status === "PENDING") redirect(`/${locale}/pending`);
  if (user.status === "REJECTED") redirect(`/${locale}/rejected`);
  if (user.status === "SUSPENDED") redirect(`/${locale}/suspended`);
  redirect(`/${locale}/${user.role.toLocaleLowerCase()}`);
}

export async function registerStudentAction(formData: FormData) {
  const parsed = registerSchema.parse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    schoolId: formString(formData, "schoolId"),
    gradeLevel: formString(formData, "gradeLevel") || undefined,
    locale: formString(formData, "locale") || "vi"
  });
  const limit = checkRateLimit(`register:${parsed.email}`, 4, 60 * 60_000);
  if (!limit.ok) throw new Error("TOO_MANY_ATTEMPTS");
  const school = await prisma.school.findFirstOrThrow({
    where: { id: parsed.schoolId, active: true },
    select: { id: true, name: true }
  });

  const result = await auth.api.signUpEmail({
    body: {
      email: parsed.email,
      password: parsed.password,
      name: parsed.name,
      preferredLocale: parsed.locale
    },
    headers: await headers()
  });
  await prisma.user.update({
    where: { id: result.user.id },
    data: {
      role: "STUDENT",
      status: "PENDING",
      preferredLocale: parsed.locale,
      studentProfile: {
        create: {
          studentCode: `STU-${Date.now().toString(36).toUpperCase()}`,
          schoolId: school.id,
          schoolName: school.name,
          gradeLevel: parsed.gradeLevel
        }
      }
    }
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "APPROVED" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "ACCOUNT_PENDING",
      title: "Học viên mới chờ duyệt",
      body: parsed.name,
      href: `/${parsed.locale}/admin/approvals`
    }))
  });
  redirect(`/${parsed.locale}/pending`);
}

export async function signOutAction(locale: string) {
  await auth.api.signOut({ headers: await headers() });
  revalidatePath(`/${locale}`);
  redirect(`/${locale}/login`);
}

export async function updateLocaleAction(locale: "vi" | "en") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { preferredLocale: locale } });
  }
  redirect(`/${locale}`);
}
