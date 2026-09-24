"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createProvisionedUser, normalizeUsername, usernameEmail, validateUsername } from "@/lib/accounts";
import { hashPassword } from "@/lib/password";

const academicYearSchema = z.object({
  name: z.string().min(4).max(40),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locale: z.string().default("vi")
});

const adminCreateAccountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  schoolId: z.string().optional(),
  gradeLevel: z.string().max(40).optional(),
  locale: z.string().default("vi")
});

const adminUpdateAccountSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]),
  schoolId: z.string().optional(),
  gradeLevel: z.string().max(40).optional(),
  locale: z.string().default("vi")
});

const schoolActionSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().max(40).optional(),
  address: z.string().max(240).optional(),
  contact: z.string().max(160).optional(),
  locale: z.string().default("vi")
});

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
}

export async function createAcademicYearAction(formData: FormData) {
  const parsed = academicYearSchema.parse({
    name: formData.get("name"),
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  const startDate = parsed.startDate ? new Date(parsed.startDate) : null;
  const endDate = parsed.endDate ? new Date(parsed.endDate) : null;
  if (startDate && endDate && startDate >= endDate) throw new Error("INVALID_ACADEMIC_YEAR_RANGE");
  const year = await prisma.academicYear.create({
    data: { name: parsed.name, startDate, endDate, active: true }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACADEMIC_YEAR_CREATED",
      entityType: "AcademicYear",
      entityId: year.id,
      metadata: JSON.stringify({ name: year.name })
    }
  });
  revalidatePath(`/${parsed.locale}/admin/academic-years`);
  revalidatePath(`/${parsed.locale}/teacher/classes`);
}

export async function toggleAcademicYearAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const academicYearId = z.string().min(1).parse(formData.get("academicYearId"));
  const admin = await requireRole("ADMIN", locale);
  const current = await prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
  const year = await prisma.academicYear.update({
    where: { id: academicYearId },
    data: { active: !current.active }
  });
  await prisma.auditLog.create({
    data: { actorUserId: admin.id, action: year.active ? "ACADEMIC_YEAR_ENABLED" : "ACADEMIC_YEAR_DISABLED", entityType: "AcademicYear", entityId: year.id }
  });
  revalidatePath(`/${locale}/admin/academic-years`);
  revalidatePath(`/${locale}/teacher/classes`);
}

export async function createAccountAction(formData: FormData) {
  const parsed = adminCreateAccountSchema.parse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    schoolId: (formData.get("schoolId") as string) || undefined,
    gradeLevel: (formData.get("gradeLevel") as string) || undefined,
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  if (parsed.role === "TEACHER" && !parsed.schoolId) throw new Error("TEACHER_SCHOOL_REQUIRED");
  if (parsed.schoolId) {
    await prisma.school.findFirstOrThrow({ where: { id: parsed.schoolId, active: true } });
  }
  const user = await createProvisionedUser({
    name: parsed.name,
    username: parsed.username,
    password: parsed.password,
    role: parsed.role,
    schoolId: parsed.role === "ADMIN" ? undefined : parsed.schoolId,
    gradeLevel: parsed.role === "STUDENT" ? parsed.gradeLevel : undefined,
    preferredLocale: parsed.locale
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACCOUNT_CREATED_BY_ADMIN",
      entityType: "User",
      entityId: user.id,
      metadata: JSON.stringify({ username: user.username, role: parsed.role, schoolId: parsed.schoolId ?? null })
    }
  });
  revalidatePath(`/${parsed.locale}/admin/users`);
}

export async function updateAccountAction(formData: FormData) {
  const parsed = adminUpdateAccountSchema.parse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    username: formData.get("username"),
    role: formData.get("role"),
    status: formData.get("status"),
    schoolId: (formData.get("schoolId") as string) || undefined,
    gradeLevel: (formData.get("gradeLevel") as string) || undefined,
    locale: formData.get("locale") || "vi"
  });
  const admin = await requireRole("ADMIN", parsed.locale);
  const target = await prisma.user.findUniqueOrThrow({
    where: { id: parsed.userId },
    include: { teacherProfile: true, studentProfile: true }
  });
  if (target.id === admin.id && (parsed.role !== "ADMIN" || parsed.status !== "APPROVED")) {
    throw new Error("ADMIN_CANNOT_DISABLE_SELF");
  }
  if (target.role !== parsed.role) {
    if (target.role === "STUDENT") {
      const [membershipCount, attemptCount] = await Promise.all([
        prisma.classMembership.count({ where: { studentId: target.id } }),
        prisma.examAttempt.count({ where: { studentId: target.id } })
      ]);
      if (membershipCount > 0 || attemptCount > 0) throw new Error("ROLE_CHANGE_BLOCKED_STUDENT_HISTORY");
    }
    if (target.role === "TEACHER") {
      const [classCount, examCount] = await Promise.all([
        prisma.class.count({ where: { teacherId: target.id } }),
        prisma.exam.count({ where: { createdById: target.id } })
      ]);
      if (classCount > 0 || examCount > 0) throw new Error("ROLE_CHANGE_BLOCKED_TEACHER_HISTORY");
    }
  }
  if (parsed.role === "TEACHER" && !parsed.schoolId) throw new Error("TEACHER_SCHOOL_REQUIRED");
  if (parsed.schoolId) await prisma.school.findUniqueOrThrow({ where: { id: parsed.schoolId } });

  const username = normalizeUsername(parsed.username);
  if (!validateUsername(username)) throw new Error("INVALID_USERNAME");
  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: target.id },
      OR: [{ username }, { email: usernameEmail(username) }]
    },
    select: { id: true }
  });
  if (duplicate) throw new Error("USERNAME_EXISTS");

  await prisma.user.update({
    where: { id: target.id },
    data: {
      name: parsed.name,
      username,
      displayUsername: parsed.username.trim(),
      email: usernameEmail(username),
      emailVerified: true,
      role: parsed.role,
      status: parsed.status
    }
  });

  if (parsed.role === "TEACHER") {
    await prisma.studentProfile.deleteMany({ where: { userId: target.id } });
    await prisma.teacherProfile.upsert({
      where: { userId: target.id },
      update: { displayName: parsed.name, schoolId: parsed.schoolId! },
      create: {
        userId: target.id,
        teacherCode: `GV-${username.toUpperCase()}-${target.id.slice(0, 6).toUpperCase()}`,
        displayName: parsed.name,
        schoolId: parsed.schoolId!
      }
    });
  } else if (parsed.role === "STUDENT") {
    await prisma.teacherProfile.deleteMany({ where: { userId: target.id } });
    const school = parsed.schoolId
      ? await prisma.school.findUnique({ where: { id: parsed.schoolId }, select: { name: true } })
      : null;
    await prisma.studentProfile.upsert({
      where: { userId: target.id },
      update: {
        schoolId: parsed.schoolId ?? null,
        schoolName: school?.name ?? null,
        gradeLevel: parsed.gradeLevel ?? null
      },
      create: {
        userId: target.id,
        studentCode: `HS-${username.toUpperCase()}-${target.id.slice(0, 6).toUpperCase()}`,
        schoolId: parsed.schoolId ?? null,
        schoolName: school?.name ?? null,
        gradeLevel: parsed.gradeLevel ?? null
      }
    });
  } else {
    await prisma.studentProfile.deleteMany({ where: { userId: target.id } });
    await prisma.teacherProfile.deleteMany({ where: { userId: target.id } });
  }

  if (target.role !== parsed.role || target.status !== parsed.status || target.username !== username) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACCOUNT_UPDATED_BY_ADMIN",
      entityType: "User",
      entityId: target.id,
      metadata: JSON.stringify({
        from: { username: target.username, role: target.role, status: target.status },
        to: { username, role: parsed.role, status: parsed.status, schoolId: parsed.schoolId ?? null }
      })
    }
  });
  revalidatePath(`/${parsed.locale}/admin/users`);
}

export async function resetUserPasswordAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const password = z.string().min(8).max(128).parse(formData.get("password"));
  const admin = await requireRole("ADMIN", locale);
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, username: true, role: true } });
  const result = await prisma.account.updateMany({
    where: { userId: target.id, providerId: "credential" },
    data: { password: await hashPassword(password), updatedAt: new Date() }
  });
  if (result.count !== 1) throw new Error("CREDENTIAL_NOT_FOUND");
  await prisma.session.deleteMany({ where: { userId: target.id } });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACCOUNT_PASSWORD_RESET_BY_ADMIN",
      entityType: "User",
      entityId: target.id,
      metadata: JSON.stringify({ username: target.username, role: target.role })
    }
  });
  revalidatePath(`/${locale}/admin/users`);
}

export async function deleteAccountAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const admin = await requireRole("ADMIN", locale);
  if (userId === admin.id) throw new Error("ADMIN_CANNOT_DELETE_SELF");
  const target = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, username: true, name: true, role: true }
  });
  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) throw new Error("LAST_ADMIN_CANNOT_BE_DELETED");
  }
  await prisma.user.delete({ where: { id: target.id } });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACCOUNT_DELETED_BY_ADMIN",
      entityType: "User",
      entityId: target.id,
      metadata: JSON.stringify({ username: target.username, name: target.name, role: target.role })
    }
  });
  revalidatePath(`/${locale}/admin/users`);
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
}

export async function revokeUserSessionsAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const admin = await requireRole("ADMIN", locale);
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, username: true, role: true } });
  const result = await prisma.session.deleteMany({ where: { userId: target.id } });
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "ACCOUNT_SESSIONS_REVOKED_BY_ADMIN",
      entityType: "User",
      entityId: target.id,
      metadata: JSON.stringify({ username: target.username, role: target.role, revoked: result.count })
    }
  });
  revalidatePath(`/${locale}/admin/users`);
}
