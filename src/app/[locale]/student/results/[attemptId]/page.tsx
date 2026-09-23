import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function ResultPage({ params }: { params: Promise<{ locale: string; attemptId: string }> }) {
  const { locale, attemptId } = await params;
  const student = await requireRole("STUDENT", locale);
  const attempt = await prisma.examAttempt.findFirstOrThrow({
    where: { id: attemptId, studentId: student.id },
    include: { version: true, manualGrade: true, answers: { include: { question: true } } }
  });
  const canView = attempt.releaseResults || attempt.version.resultsReleaseMode === "IMMEDIATE";
  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{attempt.version.title}</CardTitle>
          <StatusBadge status={attempt.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canView ? (
          <p className="text-slate-600">Your result is not released yet.</p>
        ) : (
          <>
            <div className="rounded-lg bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-800">Final score</p>
              <p className="text-3xl font-bold text-indigo-950">{attempt.finalScore} / {attempt.totalPoints}</p>
            </div>
            {attempt.manualGrade?.comments ? <div className="rounded-md bg-slate-50 p-3">{attempt.manualGrade.comments}</div> : null}
            {attempt.version.showCorrectAnswersAfterSubmit ? (
              <div className="space-y-2">
                {attempt.answers.map((answer) => (
                  <div key={answer.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-semibold">{answer.question.title}</p>
                    <p className="text-sm text-slate-600">Score: {answer.score ?? "Pending"} / {answer.question.points}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
