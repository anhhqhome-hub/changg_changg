import { prisma } from "@/lib/db";

/**
 * Vietnamese school-year convention used by the app:
 * August -> July. For example, Sep 2026 belongs to 2026-2027,
 * while Jan 2027 still belongs to 2026-2027.
 */
export function getCurrentAcademicYearDescriptor(now = new Date()) {
  const calendarYear = now.getFullYear();
  const startYear = now.getMonth() >= 7 ? calendarYear : calendarYear - 1;
  const endYear = startYear + 1;

  return {
    name: `${startYear}-${endYear}`,
    startDate: new Date(startYear, 7, 1, 0, 0, 0, 0),
    endDate: new Date(endYear, 6, 31, 23, 59, 59, 999)
  };
}

/**
 * Operational flows always use the current school year automatically.
 * The row is created lazily so users never need to choose an academic year
 * just to register a student or create a class.
 */
export async function getOrCreateCurrentAcademicYear(now = new Date()) {
  const descriptor = getCurrentAcademicYearDescriptor(now);

  const existing = await prisma.academicYear.findUnique({
    where: { name: descriptor.name }
  });

  if (existing?.active) return existing;

  if (existing) {
    return prisma.academicYear.update({
      where: { id: existing.id },
      data: { active: true }
    });
  }

  return prisma.academicYear.create({
    data: {
      name: descriptor.name,
      active: true,
      startDate: descriptor.startDate,
      endDate: descriptor.endDate
    }
  });
}
