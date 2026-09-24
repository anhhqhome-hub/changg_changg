import Link from "next/link";
import { startAttemptAction } from "@/actions/student-actions";
import { ScoreCard } from "@/components/app/score-card";
import { SkillBadge } from "@/components/app/skill-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/lib/date";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const student = await requireRole("STUDENT", locale);
  const [memberships, assignments, results] = await Promise.all([
    prisma.classMembership.findMany({ where: { studentId: student.id }, include: { class: true } }),
    prisma.examAssignment.findMany({
      where: { OR: [{ studentId: student.id }, { class: { memberships: { some: { studentId: student.id } } } }] },
      include: { exam: true, version: true, attempts: { where: { studentId: student.id }, orderBy: { attemptNumber: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.examAttempt.findMany({ where: { studentId: student.id, releaseResults: true }, include: { version: true }, orderBy: { submittedAt: "desc" }, take: 5 })
  ]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Xin chào, {student.name}</h1>
        <p className="text-slate-600">Your exams, deadlines, classes, and recent feedback.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Current classes" value={memberships.length} />
        <ScoreCard label="Assigned exams" value={assignments.length} />
        <ScoreCard label="Released results" value={results.length} />
      </div>
      <Card>
        <CardHeader><CardTitle>Upcoming and in-progress exams</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {assignments.map((assignment) => {
            const latest = assignment.attempts[0];
            return (
              <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{assignment.version.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${assignment.version.mode === "PRACTICE" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"}`}>
                      {assignment.version.mode === "PRACTICE" ? "LUYỆN TẬP" : "KIỂM TRA"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Due {formatVietnamDateTime(assignment.version.deadline)} · {latest?.status ?? "NOT_STARTED"}</p>
                </div>
                {latest?.status === "IN_PROGRESS" ? (
                  <Button asChild><Link href={`/${locale}/student/attempts/${latest.id}`}>Continue</Link></Button>
                ) : latest && assignment.version.mode !== "PRACTICE" ? (
                  <Button asChild variant="outline"><Link href={`/${locale}/student/results/${latest.id}`}>Result</Link></Button>
                ) : (
                  <form action={startAttemptAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="assignmentId" value={assignment.id} />
                    <Button type="submit">{assignment.version.mode === "PRACTICE" ? "Luyện tiếp" : "Bắt đầu"}</Button>
                  </form>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {memberships.map((membership) => <div key={membership.id} className="rounded-md bg-slate-50 p-3 font-semibold">{membership.class.name}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent results</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {results.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                <span>{attempt.version.title}</span>
                <span className="font-semibold">{attempt.finalScore}/{attempt.totalPoints}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {["LISTENING", "SPEAKING", "READING", "WRITING"].map((skill) => <SkillBadge key={skill} skill={skill} />)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
