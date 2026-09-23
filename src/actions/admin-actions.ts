"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

const userActionSchema = z.object({
  userId: z.string().min(1),
  locale: z.string().default("vi")
});

const schoolActionSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().max(40).optional(),
  address: z.string().max(240).optional(),
  contact: z.string().max(160).optional(),
  locale: z.string().default("vi")
});

async function updateStudentStatus(formData: FormData, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
  const parsed = userActionSchema.parse({
    userId: formData.get("userId"),
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  const user = await prisma.user.update({
    where: { id: parsed.userId, role: "STUDENT" },
    data: { status },
    select: { id: true, name: true, email: true }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: `USER_${status}`,
      entityType: "User",
      entityId: user.id,
      metadata: JSON.stringify({ email: user.email, name: user.name })
    }
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "INFO",
      title: status === "APPROVED" ? "Tài khoản đã được duyệt" : "Cập nhật tài khoản",
      body: status === "APPROVED" ? "Bạn có thể vào lớp và làm bài." : "Vui lòng liên hệ quản trị viên."
    }
  });
  revalidatePath(`/${parsed.locale}/admin`);
}

export async function approveStudentAction(formData: FormData) {
  await updateStudentStatus(formData, "APPROVED");
}

export async function rejectStudentAction(formData: FormData) {
  await updateStudentStatus(formData, "REJECTED");
}

export async function suspendUserAction(formData: FormData) {
  await updateStudentStatus(formData, "SUSPENDED");
}

export async function reactivateUserAction(formData: FormData) {
  const parsed = userActionSchema.parse({
    userId: formData.get("userId"),
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  await prisma.user.update({ where: { id: parsed.userId }, data: { status: "APPROVED" } });
  await prisma.auditLog.create({
    data: { actorUserId: admin.id, action: "USER_REACTIVATED", entityType: "User", entityId: parsed.userId }
  });
  revalidatePath(`/${parsed.locale}/admin`);
}

export async function createSchoolAction(formData: FormData) {
  const parsed = schoolActionSchema.parse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    address: formData.get("address") || undefined,
    contact: formData.get("contact") || undefined,
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  const school = await prisma.school.create({
    data: {
      name: parsed.name,
      code: parsed.code,
      address: parsed.address,
      contact: parsed.contact
    }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "SCHOOL_CREATED",
      entityType: "School",
      entityId: school.id,
      metadata: JSON.stringify({ name: school.name, code: school.code })
    }
  });
  revalidatePath(`/${parsed.locale}/admin`);
  revalidatePath(`/${parsed.locale}/admin/schools`);
  revalidatePath(`/${parsed.locale}/register`);
}

const siteSettingsSchema = z.object({
  founderName: z.string().max(120).optional(),
  founderTitle: z.string().max(160).optional(),
  founderTitleEn: z.string().max(160).optional(),
  founderQuote: z.string().max(400).optional(),
  founderQuoteEn: z.string().max(400).optional(),
  locale: z.string().default("vi")
});

export async function updateSiteSettingsAction(formData: FormData) {
  const emptyToUndefined = (value: FormDataEntryValue | null) => {
    const str = typeof value === "string" ? value.trim() : "";
    return str.length > 0 ? str : undefined;
  };
  const parsed = siteSettingsSchema.parse({
    founderName: emptyToUndefined(formData.get("founderName")),
    founderTitle: emptyToUndefined(formData.get("founderTitle")),
    founderTitleEn: emptyToUndefined(formData.get("founderTitleEn")),
    founderQuote: emptyToUndefined(formData.get("founderQuote")),
    founderQuoteEn: emptyToUndefined(formData.get("founderQuoteEn")),
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      founderName: parsed.founderName ?? null,
      founderTitle: parsed.founderTitle ?? null,
      founderTitleEn: parsed.founderTitleEn ?? null,
      founderQuote: parsed.founderQuote ?? null,
      founderQuoteEn: parsed.founderQuoteEn ?? null
    },
    update: {
      founderName: parsed.founderName ?? null,
      founderTitle: parsed.founderTitle ?? null,
      founderTitleEn: parsed.founderTitleEn ?? null,
      founderQuote: parsed.founderQuote ?? null,
      founderQuoteEn: parsed.founderQuoteEn ?? null
    }
  });
  await prisma.auditLog.create({
    data: { actorUserId: admin.id, action: "SITE_SETTINGS_UPDATED", entityType: "SiteSetting", entityId: "singleton" }
  });
  revalidatePath(`/${parsed.locale}/admin/settings`);
  revalidatePath(`/${parsed.locale}/login`);
  revalidatePath(`/vi/login`);
  revalidatePath(`/en/login`);
}

export async function toggleSchoolAction(formData: FormData) {
  const parsed = z
    .object({
      schoolId: z.string().min(1),
      locale: z.string().default("vi")
    })
    .parse({
      schoolId: formData.get("schoolId"),
      locale: formData.get("locale") || "vi"
    });
  const admin = await requireRole("ADMIN", parsed.locale);
  const current = await prisma.school.findUniqueOrThrow({
    where: { id: parsed.schoolId },
    select: { id: true, name: true, active: true }
  });
  const school = await prisma.school.update({
    where: { id: current.id },
    data: { active: !current.active }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: school.active ? "SCHOOL_ENABLED" : "SCHOOL_DISABLED",
      entityType: "School",
      entityId: school.id,
      metadata: JSON.stringify({ name: school.name })
    }
  });
  revalidatePath(`/${parsed.locale}/admin`);
  revalidatePath(`/${parsed.locale}/admin/schools`);
  revalidatePath(`/${parsed.locale}/register`);
}
