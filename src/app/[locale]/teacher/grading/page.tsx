import Link from "next/link";
import { finalizeGradeAction } from "@/actions/teacher-actions";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function GradingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const attempts = await prisma.examAttempt.findMany({
    where: { assignment: { exam: { createdById: teacher.id } }, status: { in: ["GRADING", "SUBMITTED", "AUTO_SUBMITTED"] } },
    include: { student: true, version: true, answers: { include: { question: true, audioAsset: true } } },
    orderBy: { submittedAt: "desc" }
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grading queue</h1>
      {attempts.map((attempt) => (
        <Card key={attempt.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{attempt.student.name} · {attempt.version.title}</CardTitle>
              <StatusBadge status={attempt.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm">Auto score: {attempt.autoScore} / {attempt.totalPoints}</div>
            {attempt.answers.map((answer) => (
              <div key={answer.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold">{answer.question.title}</p>
                {answer.textAnswer ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{answer.textAnswer}</p> : null}
                {answer.audioAsset ? <Link className="text-sm font-semibold text-indigo-700" href={`/api/media/${answer.audioAsset.id}`}>Open recording</Link> : null}
              </div>
            ))}
            <form action={finalizeGradeAction} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="attemptId" value={attempt.id} />
              <Input name="manualScore" type="number" step="0.5" placeholder="Manual score" />
              <Textarea name="comments" placeholder="Teacher feedback" className="min-h-11" />
              <Button type="submit">Finalize</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
