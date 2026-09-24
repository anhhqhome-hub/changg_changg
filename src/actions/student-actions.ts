"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateAttemptExpiresAt } from "@/domain/exam-timing";
import { canStartAttempt } from "@/domain/attempt-policy";
import { calculateTotalPoints } from "@/domain/scoring";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export async function startAttemptAction(formData: FormData) {
  const locale = z.string().default("vi").parse(formData.get("locale") || "vi");
  const student = await requireRole("STUDENT", locale);
  const assignmentId = z.string().parse(formData.get("assignmentId"));
  const assignment = await prisma.examAssignment.findFirstOrThrow({
    where: {
      id: assignmentId,
      OR: [{ studentId: student.id }, { class: { memberships: { some: { studentId: student.id } } } }]
    },
    include: {
      version: {
        include: {
          sections: { include: { groups: { include: { questions: true } } } }
        }
      }
    }
  });
  const existing = await prisma.examAttempt.findFirst({
    where: { assignmentId, studentId: student.id, status: "IN_PROGRESS" }
  });
  if (existing) redirect(`/${locale}/student/attempts/${existing.id}`);
  if (assignment.version.deadline && new Date() >= assignment.version.deadline) {
    redirect(`/${locale}/student?error=deadline-passed`);
  }

  const attemptCount = await prisma.examAttempt.count({ where: { assignmentId, studentId: student.id } });
  if (!canStartAttempt({
    mode: assignment.version.mode,
    attemptCount,
    attemptsAllowed: assignment.version.attemptsAllowed
  })) {
    const latest = await prisma.examAttempt.findFirst({
      where: { assignmentId, studentId: student.id },
      orderBy: { attemptNumber: "desc" }
    });
    if (latest) redirect(`/${locale}/student/results/${latest.id}`);
    throw new Error("NO_ATTEMPTS_LEFT");
  }

  const startedAt = new Date();
  const questions = assignment.version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const attempt = await prisma.examAttempt.create({
    data: {
      assignmentId,
      studentId: student.id,
      versionId: assignment.versionId,
      attemptNumber: attemptCount + 1,
      startedAt,
      expiresAt: calculateAttemptExpiresAt({
        startedAt,
        timeLimitMinutes: assignment.version.timeLimitMinutes,
        deadline: assignment.version.deadline
      }),
      totalPoints: calculateTotalPoints(questions)
    }
  });
  redirect(`/${locale}/student/attempts/${attempt.id}`);
}
