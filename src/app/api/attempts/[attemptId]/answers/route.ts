import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerPayloadSchema } from "@/domain/answers";
import { isAttemptExpired } from "@/domain/exam-timing";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const autosaveSchema = answerPayloadSchema.extend({
  questionId: z.string().min(1)
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { attemptId } = await params;
  const body = await request.json();
  const payload = autosaveSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const data = payload.data;
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: session.user.id },
    include: { version: true }
  });
  if (!attempt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "ATTEMPT_CLOSED" }, { status: 409 });
  if (isAttemptExpired(attempt.expiresAt)) return NextResponse.json({ error: "ATTEMPT_EXPIRED" }, { status: 409 });

  const current = await prisma.attemptAnswer.findUnique({
    where: { attemptId_questionId: { attemptId, questionId: data.questionId } },
    select: { clientUpdatedAt: true }
  });
  if (current?.clientUpdatedAt && data.clientUpdatedAt && current.clientUpdatedAt > data.clientUpdatedAt) {
    return NextResponse.json({ ok: true, staleIgnored: true });
  }

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId: body.questionId } },
    create: {
      attemptId,
      questionId: data.questionId,
      selectedOptionIdsJson: data.selectedOptionIds ? JSON.stringify(data.selectedOptionIds) : null,
      textAnswer: data.textAnswer,
      blankAnswersJson: data.blankAnswers ? JSON.stringify(data.blankAnswers) : null,
      matchingAnswersJson: data.matchingAnswers ? JSON.stringify(data.matchingAnswers) : null,
      orderingAnswersJson: data.orderingAnswers ? JSON.stringify(data.orderingAnswers) : null,
      audioAssetId: data.audioAssetId,
      isFlagged: data.isFlagged ?? false,
      clientUpdatedAt: data.clientUpdatedAt ?? new Date()
    },
    update: {
      selectedOptionIdsJson: data.selectedOptionIds ? JSON.stringify(data.selectedOptionIds) : undefined,
      textAnswer: data.textAnswer,
      blankAnswersJson: data.blankAnswers ? JSON.stringify(data.blankAnswers) : undefined,
      matchingAnswersJson: data.matchingAnswers ? JSON.stringify(data.matchingAnswers) : undefined,
      orderingAnswersJson: data.orderingAnswers ? JSON.stringify(data.orderingAnswers) : undefined,
      audioAssetId: data.audioAssetId,
      isFlagged: data.isFlagged,
      clientUpdatedAt: data.clientUpdatedAt ?? new Date()
    }
  });
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
