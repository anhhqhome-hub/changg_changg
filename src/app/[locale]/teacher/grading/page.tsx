import Link from "next/link";
import { finalizeGradeAction } from "@/actions/teacher-actions";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

type FilterValue = "all" | "not_started" | "in_progress" | "submitted" | "graded";

export default async function GradingPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; exam?: string; school?: string; classId?: string; status?: string }> }) {
  const { locale } = await params;
  const filters = await searchParams;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const selectedStatus: FilterValue = ["not_started", "in_progress", "submitted", "graded"].includes(filters.status ?? "") ? filters.status as FilterValue : "all";
  const query = (filters.q ?? "").trim().toLocaleLowerCase();
  const [assignments, attempts, students] = await Promise.all([
    prisma.examAssignment.findMany({
      where: { createdById: teacher.id },
      include: {
        exam: { select: { id: true, title: true } },
        version: { select: { id: true, title: true } },
        class: { include: { school: true, memberships: { include: { student: { include: { studentProfile: { include: { school: true } } } } } } } },
        attempts: { orderBy: { attemptNumber: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.examAttempt.findMany({
      where: { assignment: { exam: { createdById: teacher.id } }, status: { in: ["GRADING", "SUBMITTED", "AUTO_SUBMITTED"] } },
      include: { student: true, version: true, answers: { include: { question: true, audioAsset: true } } },
      orderBy: { submittedAt: "desc" }
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", status: "APPROVED", memberships: { some: { class: { teacherId: teacher.id } } } },
      include: { studentProfile: { include: { school: true } } }
    })
  ]);
  const studentById = new Map(students.map((student) => [student.id, student]));

  const rows = assignments.flatMap((assignment) => {
    const targets = assignment.class
      ? assignment.class.memberships.map((membership) => ({ student: membership.student, className: assignment.class?.name ?? "", schoolName: assignment.class?.school?.name ?? membership.student.studentProfile?.school?.name ?? membership.student.studentProfile?.schoolName ?? "" }))
      : assignment.studentId
        ? (() => {
            const student = studentById.get(assignment.studentId);
            return student ? [{ student, className: isEn ? "Individual" : "Cá nhân", schoolName: student.studentProfile?.school?.name ?? student.studentProfile?.schoolName ?? "" }] : [];
          })()
        : [];
    return targets.map(({ student, className, schoolName }) => {
      const studentAttempts = assignment.attempts.filter((attempt) => attempt.studentId === student.id).sort((a, b) => b.attemptNumber - a.attemptNumber);
      const latest = studentAttempts[0];
      return { id: `${assignment.id}:${student.id}`, assignment, student, className, schoolName, attempts: studentAttempts, latest, status: getRowStatus(latest?.status) };
    });
  });
  const filteredRows = rows.filter((row) => {
    const searchable = `${row.student.name} ${row.student.username ?? ""} ${row.student.studentProfile?.studentCode ?? ""}`.toLocaleLowerCase();
    return (!query || searchable.includes(query)) && (!filters.exam || row.assignment.exam.id === filters.exam) && (!filters.school || row.schoolName === filters.school) && (!filters.classId || row.assignment.class?.id === filters.classId) && (selectedStatus === "all" || row.status === selectedStatus);
  });
  const pendingAttemptIds = new Set(filteredRows.map((row) => row.latest?.id).filter((id): id is string => Boolean(id)));
  const gradingAttempts = attempts.filter((attempt) => pendingAttemptIds.has(attempt.id));
  const exams = uniqueBy(rows, (row) => row.assignment.exam.id).map((row) => ({ id: row.assignment.exam.id, title: row.assignment.exam.title }));
  const schools = [...new Set(rows.map((row) => row.schoolName).filter(Boolean))].sort();
  const classes = uniqueBy(rows.filter((row) => row.assignment.class), (row) => row.assignment.class?.id ?? "").map((row) => ({ id: row.assignment.class?.id ?? "", title: row.className }));
  const completed = filteredRows.filter((row) => row.latest).length;
  const graded = filteredRows.filter((row) => row.status === "graded").length;
  const text = isEn ? {
    title: "Grading queue", subtitle: "Track every assigned student by school, class, attempts and score.", search: "Search student, username or code", exam: "Exam", school: "School", classLabel: "Class", status: "Status", all: "All", notStarted: "Not started", inProgress: "In progress", submitted: "Submitted", graded: "Graded", reset: "Reset", student: "Student", assignedExam: "Exam", attempts: "Attempts", scale: "Score scale", latest: "Latest result", noRows: "No students match these filters.", assigned: "assigned", completed: "started", gradedCount: "graded", details: "Needs grading", autoScore: "Auto score", manualScore: "Manual score", feedback: "Teacher feedback", finalize: "Finalize", openRecording: "Open recording"
  } : {
    title: "Hàng chờ chấm", subtitle: "Theo dõi học sinh theo trường, lớp, số lần làm và thang điểm.", search: "Tìm học sinh, tài khoản hoặc mã số", exam: "Đề thi", school: "Trường", classLabel: "Lớp", status: "Trạng thái", all: "Tất cả", notStarted: "Chưa làm", inProgress: "Đang làm", submitted: "Đã nộp", graded: "Đã chấm", reset: "Xóa lọc", student: "Học sinh", assignedExam: "Đề", attempts: "Số lần làm", scale: "Thang điểm", latest: "Kết quả gần nhất", noRows: "Không có học sinh phù hợp bộ lọc.", assigned: "được giao", completed: "đã bắt đầu", gradedCount: "đã chấm", details: "Cần chấm", autoScore: "Điểm tự động", manualScore: "Điểm thủ công", feedback: "Nhận xét giáo viên", finalize: "Chốt điểm", openRecording: "Mở bản ghi"
  };

  return <div className="space-y-4">
    <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-indigo-700">Teacher workspace</p><h1 className="text-2xl font-black text-slate-950">{text.title}</h1><p className="mt-1 text-sm font-medium text-slate-600">{text.subtitle}</p></section>
    <Card><CardContent className="p-4"><form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"><Input name="q" defaultValue={filters.q} placeholder={text.search} className="xl:col-span-2" /><FilterSelect name="exam" value={filters.exam} label={text.exam} options={exams} /><FilterSelect name="school" value={filters.school} label={text.school} options={schools.map((school) => ({ id: school, title: school }))} /><FilterSelect name="classId" value={filters.classId} label={text.classLabel} options={classes} /><FilterSelect name="status" value={selectedStatus} label={text.status} options={[{ id: "all", title: text.all }, { id: "not_started", title: text.notStarted }, { id: "in_progress", title: text.inProgress }, { id: "submitted", title: text.submitted }, { id: "graded", title: text.graded }]} /><div className="flex gap-2 md:col-span-2 xl:col-span-6"><Button type="submit">{isEn ? "Apply filters" : "Lọc dữ liệu"}</Button><Button asChild type="button" variant="outline"><Link href={`/${locale}/teacher/grading`}>{text.reset}</Link></Button></div></form></CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-3"><Metric value={filteredRows.length} label={text.assigned} /><Metric value={completed} label={text.completed} /><Metric value={graded} label={text.gradedCount} /></div>
    <Card><CardHeader><CardTitle>{text.title}</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0">{filteredRows.length ? <table className="w-full min-w-[980px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">{text.student}</th><th className="px-4 py-3">{text.school}</th><th className="px-4 py-3">{text.classLabel}</th><th className="px-4 py-3">{text.assignedExam}</th><th className="px-4 py-3">{text.status}</th><th className="px-4 py-3">{text.attempts}</th><th className="px-4 py-3">{text.scale}</th><th className="px-4 py-3">{text.latest}</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.map((row) => <tr key={row.id} className="align-top hover:bg-slate-50"><td className="px-4 py-3"><p className="font-black text-slate-950">{row.student.name}</p><p className="text-xs text-slate-500">{row.student.studentProfile?.studentCode ?? row.student.username ?? "—"}</p></td><td className="px-4 py-3 text-slate-600">{row.schoolName || "—"}</td><td className="px-4 py-3 text-slate-600">{row.className}</td><td className="max-w-[220px] px-4 py-3 font-semibold text-slate-700">{row.assignment.exam.title}</td><td className="px-4 py-3"><StatusBadge status={displayStatus(row.status, isEn)} /></td><td className="px-4 py-3 font-black text-slate-800">{row.attempts.length}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{row.latest ? `${formatScore(row.latest.finalScore, row.latest.totalPoints)} · ${percent(row.latest.finalScore, row.latest.totalPoints)}%` : "—"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.latest ? `${formatDate(row.latest.submittedAt ?? row.latest.updatedAt)} · #${row.latest.attemptNumber}` : "—"}</td></tr>)}</tbody></table> : <p className="p-8 text-center text-sm font-medium text-slate-500">{text.noRows}</p>}</CardContent></Card>
    {gradingAttempts.length ? <section className="space-y-3"><h2 className="text-xl font-black text-slate-950">{text.details}</h2>{gradingAttempts.map((attempt) => <Card key={attempt.id}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{attempt.student.name} · {attempt.version.title}</CardTitle><StatusBadge status={attempt.status} /></div></CardHeader><CardContent className="space-y-4"><div className="rounded-md bg-slate-50 p-3 text-sm">{text.autoScore}: {attempt.autoScore} / {attempt.totalPoints}</div>{attempt.answers.map((answer) => <div key={answer.id} className="rounded-md border border-slate-200 p-3"><p className="font-semibold">{answer.question.title}</p>{answer.textAnswer ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{answer.textAnswer}</p> : null}{answer.audioAsset ? <Link className="text-sm font-semibold text-indigo-700" href={`/api/media/${answer.audioAsset.id}`}>{text.openRecording}</Link> : null}</div>)}<form action={finalizeGradeAction} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="attemptId" value={attempt.id} /><Input name="manualScore" type="number" step="0.5" placeholder={text.manualScore} /><Textarea name="comments" placeholder={text.feedback} className="min-h-11" /><Button type="submit">{text.finalize}</Button></form></CardContent></Card>)}</section> : null}
  </div>;
}

function FilterSelect({ name, value, label, options }: { name: string; value?: string; label: string; options: { id: string; title: string }[] }) { return <label className="grid gap-1 text-xs font-black uppercase text-slate-500"><span>{label}</span><select name={name} defaultValue={value ?? ""} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-900"><option value="">{label}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>; }
function uniqueBy<T>(items: T[], key: (item: T) => string) { const seen = new Set<string>(); return items.filter((item) => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; }); }
function getRowStatus(status?: string): FilterValue { if (!status) return "not_started"; if (status === "GRADED") return "graded"; if (["SUBMITTED", "AUTO_SUBMITTED", "GRADING"].includes(status)) return "submitted"; return "in_progress"; }
function displayStatus(status: FilterValue, isEn: boolean) { if (status === "not_started") return isEn ? "NOT STARTED" : "CHƯA LÀM"; if (status === "in_progress") return isEn ? "IN PROGRESS" : "ĐANG LÀM"; if (status === "submitted") return isEn ? "SUBMITTED" : "ĐÃ NỘP"; return isEn ? "GRADED" : "ĐÃ CHẤM"; }
function formatScore(score: number, total: number) { return `${Number(score.toFixed(2))} / ${Number(total.toFixed(2))}`; }
function percent(score: number, total: number) { return total > 0 ? Math.round((score / total) * 100) : 0; }
function formatDate(value: Date) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(value); }
function Metric({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm"><p className="text-3xl font-black text-slate-950">{value}</p><p className="text-xs font-black uppercase text-slate-500">{label}</p></div>; }
