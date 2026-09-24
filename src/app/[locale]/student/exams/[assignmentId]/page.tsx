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
  const isPractice = assignment.version.mode === "PRACTICE";
  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>{assignment.version.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-700">{assignment.version.description}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-slate-50 p-3 text-sm">Deadline<br /><b>{formatVietnamDateTime(assignment.version.deadline)}</b></div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">Time limit<br /><b>{assignment.version.timeLimitMinutes ?? "No limit"} min</b></div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">{locale === "vi" ? "Chế độ" : "Mode"}<br /><b>{isPractice ? (locale === "vi" ? "Luyện tập" : "Practice") : (locale === "vi" ? "Kiểm tra" : "Test")}</b></div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">{locale === "vi" ? "Số lượt" : "Attempts"}<br /><b>{isPractice ? `${assignment.attempts.length} · ${locale === "vi" ? "không giới hạn" : "unlimited"}` : `${assignment.attempts.length}/${assignment.version.attemptsAllowed}`}</b></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignment.version.sections.map((section) => <span key={section.id} className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">{section.skill}</span>)}
        </div>
        {isPractice && assignment.attempts.length ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="mb-2 text-sm font-black text-indigo-950">{locale === "vi" ? "Quá trình luyện tập" : "Practice history"}</p>
            <div className="flex flex-wrap gap-2">
              {assignment.attempts.filter((item) => item.status !== "IN_PROGRESS").map((item) => {
                const pct = item.totalPoints > 0 ? Math.round((item.finalScore / item.totalPoints) * 100) : 0;
                return <span key={item.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-800">#{item.attemptNumber}: {pct}%</span>;
              })}
            </div>
          </div>
        ) : null}
        {latest?.status === "IN_PROGRESS" ? (
          <Button asChild><a href={`/${locale}/student/attempts/${latest.id}`}>Continue</a></Button>
        ) : (
          <form action={startAttemptAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Button type="submit">{isPractice ? (locale === "vi" ? "Luyện tập lần tiếp theo" : "Start practice") : (locale === "vi" ? "Bắt đầu kiểm tra" : "Start test")}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
