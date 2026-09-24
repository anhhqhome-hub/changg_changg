import Link from "next/link";
import { Archive, ArchiveRestore, GraduationCap, Users } from "lucide-react";
import { toggleClassArchivedAction } from "@/actions/teacher-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateClassModal } from "@/components/teacher/create-class-modal";
import { prisma } from "@/lib/db";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { requireRole } from "@/lib/permissions";

export default async function TeacherClassesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ archived?: string }>;
}) {
  const { locale } = await params;
  const { archived } = await searchParams;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const showArchived = archived === "1";
  const currentAcademicYear = await getOrCreateCurrentAcademicYear();
  const [classes, archivedCount, teacherProfile] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id, archivedAt: showArchived ? { not: null } : null },
      include: { school: true, academicYear: true, _count: { select: { memberships: true, assignments: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.class.count({ where: { teacherId: teacher.id, archivedAt: { not: null } } }),
    prisma.teacherProfile.findUnique({ where: { userId: teacher.id }, include: { school: true } })
  ]);
  const totalStudents = classes.reduce((sum, item) => sum + item._count.memberships, 0);

  const text = isEn
    ? {
        eyebrow: "Class management",
        title: "Classes",
        subtitle: "Group students together so you can assign exams and follow their progress as a class.",
        classes: "classes",
        students: "students enrolled",
        assignments: "exams assigned",
        viewArchived: "View archived",
        viewActive: "Back to active classes",
        archived: "archived",
        studentsSuffix: "students",
        empty: showArchived ? "No archived classes." : "No classes yet. Create your first class to start assigning exams.",
        archive: "Archive",
        restore: "Restore",
        archivedBadge: "Archived"
      }
    : {
        eyebrow: "Quản lý lớp",
        title: "Lớp học",
        subtitle: "Nhóm học viên lại để giao đề và theo dõi tiến độ theo từng lớp dễ dàng hơn.",
        classes: "lớp",
        students: "học viên đang học",
        assignments: "lượt giao đề",
        viewArchived: "Xem lớp đã lưu trữ",
        viewActive: "Quay lại lớp đang hoạt động",
        archived: "đã lưu trữ",
        studentsSuffix: "học viên",
        empty: showArchived ? "Chưa có lớp nào được lưu trữ." : "Chưa có lớp nào. Tạo lớp đầu tiên để bắt đầu giao đề.",
        archive: "Lưu trữ",
        restore: "Khôi phục",
        archivedBadge: "Đã lưu trữ"
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{text.eyebrow}</p>
            <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CreateClassModal locale={locale} schoolName={teacherProfile?.school?.name} currentAcademicYearName={currentAcademicYear.name} />
            <Button asChild variant="outline">
              <Link href={`/${locale}/teacher/classes${showArchived ? "" : "?archived=1"}`}>
                {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                {showArchived ? text.viewActive : `${text.viewArchived}${archivedCount ? ` (${archivedCount})` : ""}`}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {!showArchived ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={GraduationCap} value={classes.length} label={text.classes} />
          <Metric icon={Users} value={totalStudents} label={text.students} />
        </div>
      ) : null}

      {classes.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((item) => (
            <div key={item.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300">
              <Link href={`/${locale}/teacher/classes/${item.id}`} className="block">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  {item.archivedAt ? <Badge tone="slate">{text.archivedBadge}</Badge> : null}
                </div>
                <h2 className="font-black text-slate-950">{item.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description || (isEn ? "No description" : "Chưa có mô tả")}</p>
                <p className="mt-2 text-xs font-bold text-indigo-700">{item.school?.name ?? "—"} · {item.academicYear?.name ?? (isEn ? "No academic year" : "Chưa có năm học")}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <span>{item._count.memberships} {text.studentsSuffix}</span>
                  <span>{item._count.assignments} {text.assignments}</span>
                </div>
              </Link>
              <form action={toggleClassArchivedAction} className="mt-3 border-t border-slate-100 pt-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="classId" value={item.id} />
                <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-700">
                  {item.archivedAt ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  {item.archivedAt ? text.restore : text.archive}
                </button>
              </form>
            </div>
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

