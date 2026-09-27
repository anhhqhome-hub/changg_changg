import Link from "next/link";
import { CalendarDays, Clock3, Flame, Goal, Sparkles } from "lucide-react";
import { startAttemptAction } from "@/actions/student-actions";
import { LearningTools } from "@/components/app/learning-tools";
import { FirstLoginGuide } from "@/components/app/first-login-guide";
import { ScoreCard } from "@/components/app/score-card";
import { SkillBadge } from "@/components/app/skill-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/lib/date";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentDashboard({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { locale } = await params;
  const { welcome } = await searchParams;
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
      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
        <div className="grid gap-5 bg-[linear-gradient(120deg,#fffdf5_0%,#f1f5ff_48%,#ecfdf5_100%)] p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-indigo-700"><Sparkles className="h-4 w-4" aria-hidden="true" /> Không gian học tập</div>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">Xin chào, {student.name}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">Mỗi ngày một bước nhỏ. Chọn bài phù hợp, luyện đúng kỹ năng và để tiến bộ được tích lũy tự nhiên.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[330px]">
            <MiniStat icon={Flame} value={assignments.length ? "01" : "00"} label="ngày giữ nhịp" tone="text-rose-600 bg-rose-50" />
            <MiniStat icon={Clock3} value={`${assignments.length}`} label="bài đang chờ" tone="text-indigo-600 bg-indigo-50" />
            <MiniStat icon={Goal} value={`${results.length}`} label="kết quả mới" tone="text-emerald-600 bg-emerald-50" />
          </div>
        </div>
      </section>

      {welcome === "1" ? <FirstLoginGuide locale={locale} role="student" /> : null}

      <LearningTools locale={locale} role="student" />

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Lớp đang học" value={memberships.length} />
        <ScoreCard label="Bài được giao" value={assignments.length} />
        <ScoreCard label="Kết quả đã có" value={results.length} />
      </div>
      <Card id="weekly-plan">
        <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle>Bài kiểm tra sắp tới</CardTitle><p className="mt-1 text-sm text-slate-500">Giữ nhịp bằng một phiên học ngắn và tập trung.</p></div><CalendarDays className="h-5 w-5 text-indigo-600" aria-hidden="true" /></CardHeader>
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
                  <p className="text-sm text-slate-600">Hạn {formatVietnamDateTime(assignment.version.deadline)} · {latest?.status ?? "Chưa bắt đầu"}</p>
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
        <Card id="skills">
          <CardHeader><CardTitle>Lớp học</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {memberships.map((membership) => <div key={membership.id} className="rounded-md bg-slate-50 p-3 font-semibold">{membership.class.name}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Kết quả gần đây</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {results.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                <span>{attempt.version.title}</span>
                <span className="font-semibold">{attempt.finalScore}/{attempt.totalPoints}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2" aria-label="Kỹ năng học tập">
              {["LISTENING", "SPEAKING", "READING", "WRITING"].map((skill) => <SkillBadge key={skill} skill={skill} />)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label, tone }: { icon: typeof Flame; value: string; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}
