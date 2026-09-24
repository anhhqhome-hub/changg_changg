import Link from "next/link";
import { GraduationCap, School, Search, Users } from "lucide-react";
import { AvatarBadge } from "@/components/app/avatar-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function TeacherStudentsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { locale } = await params;
  const { q, classId } = await searchParams;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const query = (q ?? "").trim();

  const [students, classes] = await Promise.all([
    prisma.user.findMany({
      where: {
        memberships: { some: { class: { teacherId: teacher.id, ...(classId ? { id: classId } : {}) } } },
        ...(query ? { OR: [{ name: { contains: query } }, { username: { contains: query } }] } : {})
      },
      include: {
        studentProfile: true,
        memberships: { where: { class: { teacherId: teacher.id } }, include: { class: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.class.findMany({ where: { teacherId: teacher.id, archivedAt: null }, orderBy: { name: "asc" } })
  ]);

  const schoolCount = new Set(students.map((student) => student.studentProfile?.schoolName).filter(Boolean)).size;

  const text = isEn
    ? {
        eyebrow: "Roster",
        title: "Students",
        subtitle: "Every student enrolled in one of your classes, with quick access to their progress.",
        totalStudents: "students",
        totalClasses: "active classes",
        totalSchools: "schools",
        searchPlaceholder: "Search by name or username",
        allClasses: "All classes",
        noSchool: "No school on file",
        empty: query || classId ? "No students match this filter." : "No students yet. Add them from a class page.",
        classesLabel: "Classes"
      }
    : {
        eyebrow: "Danh sách",
        title: "Học viên",
        subtitle: "Tất cả học viên đang học trong các lớp của bạn, truy cập nhanh tiến độ từng em.",
        totalStudents: "học viên",
        totalClasses: "lớp đang hoạt động",
        totalSchools: "trường học",
        searchPlaceholder: "Tìm theo tên hoặc username",
        allClasses: "Tất cả lớp",
        noSchool: "Chưa có thông tin trường",
        empty: query || classId ? "Không có học viên phù hợp bộ lọc này." : "Chưa có học viên nào. Thêm từ trang lớp học.",
        classesLabel: "Lớp"
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase text-indigo-700">{text.eyebrow}</p>
        <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">{text.subtitle}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Users} value={students.length} label={text.totalStudents} />
        <Metric icon={GraduationCap} value={classes.length} label={text.totalClasses} />
        <Metric icon={School} value={schoolCount} label={text.totalSchools} />
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={query} placeholder={text.searchPlaceholder} className="pl-9" />
        </div>
        <select name="classId" defaultValue={classId ?? ""} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
          <option value="">{text.allClasses}</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>{klass.name}</option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-md bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700">
          {isEn ? "Filter" : "Lọc"}
        </button>
      </form>

      {students.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/${locale}/teacher/students/${student.id}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
            >
              <div className="flex items-center gap-3">
                <AvatarBadge name={student.name} />
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{student.name}</p>
                  <p className="truncate text-xs text-slate-500">@{student.username ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500">{student.studentProfile?.schoolName ?? text.noSchool}</p>
              {student.memberships.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.memberships.map((membership) => (
                    <Badge key={membership.id} tone="indigo">{membership.class.name}</Badge>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={text.empty} />
      )}
    </div>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/70 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-950">{value}</p>
        <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      </div>
    </div>
  );
}

