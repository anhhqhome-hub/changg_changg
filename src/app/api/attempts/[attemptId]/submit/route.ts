export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { deriveSubmittedStatus, isAttemptExpired } from "@/domain/exam-timing";
import { gradeObjectiveAnswer, isManualQuestion } from "@/domain/grading";
import { calculateFinalScore, calculateTotalPoints } from "@/domain/scoring";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { attemptId } = await params;
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: session.user.id },
    include: {
      assignment: { include: { exam: true } },
      version: {
        include: {
          sections: {
            include: {
              groups: { include: { questions: { include: { options: true } } } }
            }
          }
        }
      },
      answers: { include: { question: { include: { options: true } } } }
    }
  });
  if (!attempt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ ok: true, status: attempt.status, attemptId });
  }

  const expired = isAttemptExpired(attempt.expiresAt);
  if (expired && !attempt.version.allowLateSubmission) {
    // Expired attempts are accepted as auto-submitted, but no more answer mutations are allowed.
  }
  const questions = attempt.version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const autoScore = attempt.answers.reduce((sum, answer) => {
    const score = gradeObjectiveAnswer(answer.question, {
      selectedOptionIds: parseJson(answer.selectedOptionIdsJson, []),
      textAnswer: answer.textAnswer ?? undefined,
      blankAnswers: parseJson(answer.blankAnswersJson, []),
      matchingAnswers: parseJson(answer.matchingAnswersJson, {}),
      orderingAnswers: parseJson(answer.orderingAnswersJson, []),
      audioAssetId: answer.audioAssetId ?? undefined
    });
    return sum + (score ?? 0);
  }, 0);
  const hasManualQuestions = questions.some((question) => isManualQuestion(question.questionType));
  const status = deriveSubmittedStatus({ hasManualQuestions, expired });
  const totalPoints = calculateTotalPoints(questions);
  const finalScore = hasManualQuestions ? autoScore : calculateFinalScore({ autoScore, manualScore: 0 });
  const submittedAt = new Date();

  await prisma.$transaction([
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        submittedAt,
        autoScore,
        finalScore,
        totalPoints,
        timeSpentSec: Math.max(0, Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
        releaseResults: attempt.version.resultsReleaseMode === "IMMEDIATE" && !hasManualQuestions
      }
    }),
    prisma.notification.create({
      data: {
        userId: attempt.assignment.exam.createdById,
        type: "SUBMISSION_RECEIVED",
        title: "Có bài nộp mới",
        body: attempt.version.title,
        href: "/vi/teacher/grading"
      }
    })
  ]);

  return NextResponse.json({ ok: true, status, attemptId });
}
