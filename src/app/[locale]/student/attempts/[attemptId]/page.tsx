import { ExamRunner } from "@/components/exam/exam-runner";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { parseJson } from "@/lib/utils";

export default async function AttemptPage({ params }: { params: Promise<{ locale: string; attemptId: string }> }) {
  const { locale, attemptId } = await params;
  const student = await requireRole("STUDENT", locale);
  const attempt = await prisma.examAttempt.findFirstOrThrow({
    where: { id: attemptId, studentId: student.id },
    include: {
      version: {
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              groups: {
                orderBy: { sortOrder: "asc" },
                include: {
                  readingPassage: true,
                  questions: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }
                }
              }
            }
          }
        }
      },
      answers: true
    }
  });
  const answers = Object.fromEntries(
    attempt.answers.map((answer) => [
      answer.questionId,
      {
        selectedOptionIds: parseJson(answer.selectedOptionIdsJson, []),
        textAnswer: answer.textAnswer ?? undefined,
        blankAnswers: parseJson(answer.blankAnswersJson, undefined),
        matchingAnswers: parseJson(answer.matchingAnswersJson, undefined),
        orderingAnswers: parseJson(answer.orderingAnswersJson, undefined),
        audioAssetId: answer.audioAssetId ?? undefined,
        isFlagged: answer.isFlagged
      }
    ])
  );
  const sections = attempt.version.sections.map((section) => ({
    id: section.id,
    title: section.title,
    skill: section.skill,
    groups: section.groups.map((group) => ({
      id: group.id,
      title: group.title,
      instructions: group.instructions,
      mediaAssetId: group.mediaAssetId,
      readingPassage: group.readingPassage
        ? { title: group.readingPassage.title, body: group.readingPassage.body, instructions: group.readingPassage.instructions }
        : null,
      questions: group.questions.map((question) => ({
        id: question.id,
        title: question.title,
        prompt: question.prompt,
        instructions: question.instructions,
        questionType: question.questionType,
        points: question.points,
        options: question.options.map((option) => ({ id: option.id, label: option.label, value: option.value }))
      }))
    }))
  }));
  return (
    <ExamRunner
      locale={locale}
      attemptId={attempt.id}
      title={attempt.version.title}
      expiresAt={attempt.expiresAt?.toISOString() ?? null}
      sections={sections}
      initialAnswers={answers}
    />
  );
}
