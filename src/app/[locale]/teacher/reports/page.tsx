import Link from "next/link";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { requireRole } from "@/lib/permissions";
import { getTeacherReportData } from "@/lib/reporting";

export default async function TeacherReportsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ academicYearId?: string; classId?: string; studentId?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const currentAcademicYear = await getOrCreateCurrentAcademicYear();
  const [years, classes] = await Promise.all([
    prisma.academicYear.findMany({
      where: { classes: { some: { teacherId: teacher.id } } },
      orderBy: { name: "desc" }
    }),
    prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: { academicYear: true, memberships: { include: { student: { select: { id: true, name: true, username: true } } } } },
      orderBy: { createdAt: "desc" }
    })
  ]);
  const selectedYearId = filters.academicYearId || (years.some((year) => year.id === currentAcademicYear.id) ? currentAcademicYear.id : years[0]?.id);
  const availableClasses = selectedYearId ? classes.filter((item) => item.academicYearId === selectedYearId) : classes;
  const selectedClass = filters.classId ? availableClasses.find((item) => item.id === filters.classId) : undefined;
  const studentOptions = selectedClass
    ? selectedClass.memberships.map((membership) => membership.student)
    : Array.from(new Map(availableClasses.flatMap((item) => item.memberships.map((membership) => [membership.student.id, membership.student] as const))).values());
  const data = await getTeacherReportData({
    teacherId: teacher.id,
    academicYearId: selectedYearId,
    classId: filters.classId || undefined,
    studentId: filters.studentId || undefined
  });
  const query = new URLSearchParams();
  if (selectedYearId) query.set("academicYearId", selectedYearId);
  if (filters.classId) query.set("classId", filters.classId);
  if (filters.studentId) query.set("studentId", filters.studentId);

  const text = isEn
    ? {
        title: "Learning reports",
        subtitle: "Review yearly test results and every practice attempt to see real progress over time.",
        year: "Academic year",
        klass: "Class",
        student: "Student",
        allClasses: "All classes",
        allStudents: "All students",
        filter: "Apply",
        export: "Export Excel",
        name: "Student",
        tests: "Tests",
        avg: "Test average",
        practice: "Practice attempts",
        best: "Best practice",
        improvement: "Practice change",
        recent: "Attempt history",
        empty: "No completed attempts for this filter yet."
      }
    : {
        title: "Báo cáo học tập",
        subtitle: "Theo dõi điểm kiểm tra theo năm học và toàn bộ từng lượt luyện tập để thấy quá trình tiến bộ thực tế.",
        year: "Năm học",
        klass: "Lớp",
        student: "Học sinh",
        allClasses: "Tất cả lớp",
        allStudents: "Tất cả học sinh",
        filter: "Lọc",
        export: "Xuất Excel",
        name: "Học sinh",
        tests: "Bài kiểm tra",
        avg: "TB kiểm tra",
        practice: "Lượt luyện tập",
        best: "Luyện tập tốt nhất",
        improvement: "Mức tiến bộ",
        recent: "Lịch sử từng lượt làm",
        empty: "Chưa có lượt làm hoàn thành trong bộ lọc này."
      };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase text-indigo-700">{isEn ? "Analytics" : "Theo dõi tiến bộ"}</p>
          <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
          <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">{text.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/api/reports/teacher/export?${query.toString()}`}><Download className="h-4 w-4" />{text.export}</Link>
        </Button>
      </section>

      <form method="GET" className="grid gap-3 rounded-2xl border border-white/70 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="grid gap-1 text-sm font-bold">{text.year}
          <select name="academicYearId" defaultValue={selectedYearId ?? ""} className="h-11 rounded-md border border-slate-300 bg-white px-3">
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">{text.klass}
          <select name="classId" defaultValue={filters.classId ?? ""} className="h-11 rounded-md border border-slate-300 bg-white px-3">
            <option value="">{text.allClasses}</option>
            {availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">{text.student}
          <select name="studentId" defaultValue={filters.studentId ?? ""} className="h-11 rounded-md border border-slate-300 bg-white px-3">
            <option value="">{text.allStudents}</option>
            {studentOptions.map((student) => <option key={student.id} value={student.id}>{student.name} · @{student.username ?? "—"}</option>)}
          </select>
        </label>
        <div className="flex items-end"><Button type="submit" className="w-full">{text.filter}</Button></div>
      </form>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{text.title}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {data.summary.length ? (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">{text.name}</th><th>{text.tests}</th><th>{text.avg}</th><th>{text.practice}</th><th>{text.best}</th><th>{text.improvement}</th></tr></thead>
              <tbody>{data.summary.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-3"><div className="font-bold">{row.name}</div><div className="text-xs text-slate-500">@{row.username ?? "—"}</div></td>
                  <td>{row.testCount}</td>
                  <td>{row.averageTest === null ? "—" : `${row.averageTest}%`}</td>
                  <td>{row.practiceAttempts}</td>
                  <td>{row.bestPractice === null ? "—" : `${row.bestPractice}%`}</td>
                  <td>{row.practiceImprovement === null ? "—" : <span className={row.practiceImprovement >= 0 ? "font-bold text-emerald-700" : "font-bold text-amber-700"}><TrendingUp className="mr-1 inline h-4 w-4" />{row.practiceImprovement > 0 ? "+" : ""}{row.practiceImprovement}%</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="p-6 text-center text-sm text-slate-500">{text.empty}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{text.recent}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.attempts.slice().reverse().slice(0, 80).map((attempt) => {
            const pct = attempt.totalPoints > 0 ? Math.round((attempt.finalScore / attempt.totalPoints) * 1000) / 10 : 0;
            return (
              <div key={attempt.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.3fr_1fr_120px_120px] sm:items-center">
                <div><p className="font-bold text-slate-950">{attempt.student.name}</p><p className="text-xs text-slate-500">@{attempt.student.username ?? "—"}</p></div>
                <div><p className="font-semibold">{attempt.version.title}</p><p className="text-xs text-slate-500">{attempt.assignment.class?.name ?? "Cá nhân"} · {attempt.assignment.academicYear?.name ?? attempt.assignment.class?.academicYear?.name ?? "—"}</p></div>
                <Badge tone={attempt.version.mode === "PRACTICE" ? "indigo" : "slate"}>{attempt.version.mode === "PRACTICE" ? (isEn ? "Practice" : "Luyện tập") : (isEn ? "Test" : "Kiểm tra")}</Badge>
                <div className="text-right"><p className="font-black">{pct}%</p><p className="text-xs text-slate-500">#{attempt.attemptNumber}</p></div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
