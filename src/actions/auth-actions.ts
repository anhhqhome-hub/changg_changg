"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createProvisionedUser } from "@/lib/accounts";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/),
  password: z.string().min(8)
});

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type LoginActionState = {
  error?: string;
};

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    schoolId: z.string().min(1),
    classId: z.string().min(1),
    locale: z.enum(["vi", "en"]).default("vi")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "PASSWORD_MISMATCH"
  });

export type RegisterActionState = {
  error?: string;
};

export async function registerStudentAction(
  _state: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    name: formString(formData, "name"),
    username: formString(formData, "username"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
    schoolId: formString(formData, "schoolId"),
    classId: formString(formData, "classId"),
    locale: formString(formData, "locale") || "vi"
  });

  const locale = formString(formData, "locale") === "en" ? "en" : "vi";
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((issue) => issue.message === "PASSWORD_MISMATCH");
    return {
      error: mismatch
        ? locale === "en" ? "Passwords do not match." : "Mật khẩu xác nhận không khớp."
        : locale === "en" ? "Please check your registration information." : "Vui lòng kiểm tra lại thông tin đăng ký."
    };
  }

  const username = parsed.data.username.toLowerCase();
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipLimit = checkRateLimit(`register-ip:${forwardedFor}`, 10, 60 * 60_000);
  const usernameLimit = checkRateLimit(`register-user:${username}`, 3, 30 * 60_000);
  if (!ipLimit.ok || !usernameLimit.ok) {
    return { error: locale === "en" ? "Too many registration attempts. Please try again later." : "Có quá nhiều lần đăng ký. Vui lòng thử lại sau." };
  }

  try {
    await createProvisionedUser({
      name: parsed.data.name,
      username,
      password: parsed.data.password,
      role: "STUDENT",
      preferredLocale: parsed.data.locale,
      schoolId: parsed.data.schoolId,
      classId: parsed.data.classId
    });
  } catch (error) {
    console.error("[register] Student registration failed.", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("USERNAME_EXISTS") || message.includes("Unique constraint")) {
      return { error: locale === "en" ? "This username is already in use." : "Tên đăng nhập này đã được sử dụng." };
    }
    if (message.includes("CLASS_SELECTION_INVALID")) {
      return {
        error: locale === "en"
          ? "The selected school or class is no longer available for the current academic year. Please choose again."
          : "Trường hoặc lớp đã chọn không còn hợp lệ trong năm học hiện tại. Vui lòng chọn lại."
      };
    }
    return { error: locale === "en" ? "Could not create the account. Please try again." : "Không thể tạo tài khoản. Vui lòng thử lại." };
  }

  redirect(`/${parsed.data.locale}/login?registered=1`);
}

export async function signInAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = credentialsSchema.safeParse({
    username: formString(formData, "username"),
    password: formString(formData, "password")
  });
  if (!parsed.success) {
    return { error: "Tên đăng nhập hoặc mật khẩu không hợp lệ." };
  }

  const username = parsed.data.username.toLowerCase();
  const limit = checkRateLimit(`login:${username}`, 8, 10 * 60_000);
  if (!limit.ok) {
    return { error: "Đăng nhập quá nhiều lần. Vui lòng thử lại sau vài phút." };
  }

  const result = await auth.api
    .signInUsername({
      body: { username, password: parsed.data.password },
      headers: await headers()
    })
    .catch((error) => {
      console.error("[login] Username sign-in failed.", error);
      return null;
    });

  if (!result?.user?.id) {
    return { error: "Sai tên đăng nhập hoặc mật khẩu." };
  }

  const user = await prisma.user.findUnique({ where: { id: result.user.id } }).catch((error) => {
    console.error("[login] User lookup failed.", error);
    return null;
  });
  if (!user) return { error: "Không thể đọc thông tin tài khoản. Vui lòng thử lại." };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
  const locale = user.preferredLocale || "vi";
  if (user.status === "PENDING") redirect(`/${locale}/pending`);
  if (user.status === "REJECTED") redirect(`/${locale}/rejected`);
  if (user.status === "SUSPENDED") redirect(`/${locale}/suspended`);
  redirect(`/${locale}/${user.role.toLocaleLowerCase()}`);
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
