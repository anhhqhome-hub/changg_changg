import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { hashPassword } from "@/lib/password";

export type ProvisionRole = "ADMIN" | "TEACHER" | "STUDENT";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  return /^[a-zA-Z0-9_.]{3,30}$/.test(value.trim());
}

/** Better Auth's credential provider still expects an email field in its user model.
 * This address is internal-only and is never requested from or shown to end users.
 */
export function usernameEmail(username: string) {
  return `${normalizeUsername(username)}@local.invalid`;
}

export async function createProvisionedUser(input: {
  username: string;
  password: string;
  name: string;
  role: ProvisionRole;
  preferredLocale?: string;
  schoolId?: string;
  classId?: string;
  gradeLevel?: string;
}) {
  const username = normalizeUsername(input.username);
  if (!validateUsername(username)) throw new Error("INVALID_USERNAME");
  if (input.password.length < 8) throw new Error("PASSWORD_TOO_SHORT");

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: usernameEmail(username) }] },
    select: { id: true }
  });
  if (exists) throw new Error("USERNAME_EXISTS");

  const id = randomUUID();
  const now = new Date();
  const password = await hashPassword(input.password);
  const email = usernameEmail(username);
  const userData = {
    id,
    name: input.name.trim(),
    email,
    emailVerified: true,
    username,
    displayUsername: input.username.trim(),
    role: input.role,
    status: "APPROVED" as const,
    preferredLocale: input.preferredLocale ?? "vi"
  };
  const accountData = {
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password,
    createdAt: now,
    updatedAt: now
  };

  if (input.role === "TEACHER") {
    const [user] = await prisma.$transaction([
      prisma.user.create({ data: userData }),
      prisma.account.create({ data: accountData }),
      prisma.teacherProfile.create({
        data: {
          userId: id,
          teacherCode: `GV-${username.toUpperCase()}-${id.slice(0, 6).toUpperCase()}`,
          displayName: input.name.trim(),
          schoolId: input.schoolId || null
        }
      })
    ]);
    return user;
  }

  if (input.role === "STUDENT") {
    let resolvedSchoolId = input.schoolId || null;
    let resolvedSchoolName: string | null = null;
    let classId: string | null = null;

    if (input.classId) {
      const currentAcademicYear = await getOrCreateCurrentAcademicYear();
      const klass = await prisma.class.findFirst({
        where: {
          id: input.classId,
          archivedAt: null,
          academicYearId: currentAcademicYear.id,
          school: { is: { active: true } }
        },
        select: {
          id: true,
          schoolId: true,
          academicYearId: true,
          school: { select: { id: true, name: true } },
          academicYear: { select: { id: true } }
        }
      });

      if (
        !klass ||
        !klass.schoolId ||
        !klass.academicYearId ||
        !klass.school ||
        !klass.academicYear ||
        (input.schoolId && input.schoolId !== klass.schoolId)
      ) {
        throw new Error("CLASS_SELECTION_INVALID");
      }

      resolvedSchoolId = klass.schoolId;
      resolvedSchoolName = klass.school.name;
      classId = klass.id;
    } else if (input.schoolId) {
      const school = await prisma.school.findFirst({
        where: { id: input.schoolId, active: true },
        select: { id: true, name: true }
      });
      if (!school) throw new Error("CLASS_SELECTION_INVALID");
      resolvedSchoolId = school.id;
      resolvedSchoolName = school.name;
    }

    if (classId) {
      const [user] = await prisma.$transaction([
        prisma.user.create({ data: userData }),
        prisma.account.create({ data: accountData }),
        prisma.studentProfile.create({
          data: {
            userId: id,
            studentCode: `HS-${username.toUpperCase()}-${id.slice(0, 6).toUpperCase()}`,
            schoolId: resolvedSchoolId,
            schoolName: resolvedSchoolName,
            gradeLevel: input.gradeLevel || null
          }
        }),
        prisma.classMembership.create({
          data: {
            classId,
            studentId: id
          }
        })
      ]);
      return user;
    }

    const [user] = await prisma.$transaction([
      prisma.user.create({ data: userData }),
      prisma.account.create({ data: accountData }),
      prisma.studentProfile.create({
        data: {
          userId: id,
          studentCode: `HS-${username.toUpperCase()}-${id.slice(0, 6).toUpperCase()}`,
          schoolId: resolvedSchoolId,
          schoolName: resolvedSchoolName,
          gradeLevel: input.gradeLevel || null
        }
      })
    ]);
    return user;
  }

  const [user] = await prisma.$transaction([
    prisma.user.create({ data: userData }),
    prisma.account.create({ data: accountData })
  ]);
  return user;
}
