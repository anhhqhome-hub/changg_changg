import { prisma } from "@/lib/db";

export type ReportFilters = {
  teacherId: string;
  academicYearId?: string;
  classId?: string;
  studentId?: string;
};

export async function getTeacherReportData(filters: ReportFilters) {
  const attempts = await prisma.examAttempt.findMany({
    where: {
      assignment: {
        createdById: filters.teacherId,
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.classId ? { classId: filters.classId } : {})
      },
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "GRADING", "GRADED"] }
    },
    include: {
      student: { select: { id: true, name: true, username: true } },
      version: { select: { id: true, title: true, mode: true } },
      assignment: {
        include: {
          class: { include: { academicYear: true, school: true } },
          academicYear: true
        }
      }
    },
    orderBy: [{ student: { name: "asc" } }, { startedAt: "asc" }]
  });

  const students = new Map<string, {
    id: string;
    name: string;
    username: string | null;
    testScores: number[];
    practiceScores: number[];
    practiceAttempts: number;
    practiceImprovement: number | null;
  }>();

  for (const attempt of attempts) {
    const row = students.get(attempt.studentId) ?? {
      id: attempt.student.id,
      name: attempt.student.name,
      username: attempt.student.username,
      testScores: [],
      practiceScores: [],
      practiceAttempts: 0,
      practiceImprovement: null
    };
    const pct = attempt.totalPoints > 0 ? Math.round((attempt.finalScore / attempt.totalPoints) * 1000) / 10 : 0;
    if (attempt.version.mode === "PRACTICE") {
      row.practiceScores.push(pct);
      row.practiceAttempts += 1;
    } else {
      row.testScores.push(pct);
    }
    students.set(attempt.studentId, row);
  }

  const summary = [...students.values()].map((row) => {
    const averageTest = row.testScores.length
      ? Math.round((row.testScores.reduce((sum, value) => sum + value, 0) / row.testScores.length) * 10) / 10
      : null;
    const bestPractice = row.practiceScores.length ? Math.max(...row.practiceScores) : null;
    const practiceImprovement = row.practiceScores.length >= 2
      ? Math.round((row.practiceScores[row.practiceScores.length - 1] - row.practiceScores[0]) * 10) / 10
      : null;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      testCount: row.testScores.length,
      averageTest,
      practiceAttempts: row.practiceAttempts,
      bestPractice,
      practiceImprovement
    };
  });

  return { attempts, summary };
}
