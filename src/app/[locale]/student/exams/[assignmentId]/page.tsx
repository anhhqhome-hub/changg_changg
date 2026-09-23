import { startAttemptAction } from "@/actions/student-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/lib/date";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentExamDetail({ params }: { params: Promise<{ locale: string; assignmentId: string }> }) {
  const { locale, assignmentId } = await params;
  const student = await requireRole("STUDENT", locale);
  const assignment = await prisma.examAssignment.findFirstOrThrow({
    where: { id: assignmentId, OR: [{ studentId: student.id }, { class: { memberships: { some: { studentId: student.id } } } }] },
    include: { version: { include: { sections: true } }, attempts: { where: { studentId: student.id }, orderBy: { attemptNumber: "desc" } } }
  });
  const latest = assignment.attempts[0];
  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>{assignment.version.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-700">{assignment.version.description}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-3 text-sm">Deadline<br /><b>{formatVietnamDateTime(assignment.version.deadline)}</b></div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">Time limit<br /><b>{assignment.version.timeLimitMinutes ?? "No limit"} min</b></div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">Attempts<br /><b>{assignment.attempts.length}/{assignment.version.attemptsAllowed}</b></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignment.version.sections.map((section) => <span key={section.id} className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{section.skill}</span>)}
        </div>
        {latest?.status === "IN_PROGRESS" ? (
          <Button asChild><a href={`/${locale}/student/attempts/${latest.id}`}>Continue</a></Button>
        ) : (
          <form action={startAttemptAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Button type="submit">Start exam</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
