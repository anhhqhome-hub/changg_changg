import Link from "next/link";
import { ArrowLeft, ClipboardList, GraduationCap, Users } from "lucide-react";
import { AvatarBadge } from "@/components/app/avatar-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddStudentModal, EditClassModal, RemoveStudentButton } from "@/components/teacher/manage-class-modals";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function ClassDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const klass = await prisma.class.findFirstOrThrow({
    where: { id, teacherId: teacher.id },
    include: {
      school: true,
      academicYear: true,
      memberships: { include: { student: true }, orderBy: { student: { name: "asc" } } },
      _count: { select: { assignments: true } }
    }
  });
  const availableStudents = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      status: "APPROVED",
      memberships: { none: { classId: id } },
      ...(klass.schoolId
        ? { OR: [{ studentProfile: { schoolId: klass.schoolId } }, { studentProfile: { schoolId: null } }] }
        : {})
    },
    orderBy: { name: "asc" }
  });

  const text = isEn
    ? {
        back: "All classes",
        students: "students",
        assignments: "exams assigned",
        studentsTitle: "Students",
        emptyStudents: "No students in this class yet. Add one to get started.",
        noDescription: "No description",
        archivedBadge: "Archived"
      }
    : {
        back: "Tất cả lớp",
        students: "học viên",
        assignments: "lượt giao đề",
        studentsTitle: "Học viên",
        emptyStudents: "Lớp này chưa có học viên nào. Thêm học viên để bắt đầu.",
        noDescription: "Chưa có mô tả",
        archivedBadge: "Đã lưu trữ"
      };

  return (
    <div className="space-y-4">
      <Link href={`/${locale}/teacher/classes`} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-700">
        <ArrowLeft className="h-4 w-4" /> {text.back}
      </Link>

      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-950">{klass.name}</h1>
                {klass.archivedAt ? <Badge tone="slate">{text.archivedBadge}</Badge> : null}
              </div>
              <p className="mt-1 max-w-xl text-sm font-medium text-slate-600">{klass.description || text.noDescription}</p>
              <p className="mt-2 text-xs font-black text-indigo-700">{klass.school?.name ?? "—"} · {klass.academicYear?.name ?? "—"}</p>
            </div>
          </div>
          <EditClassModal locale={locale} classId={klass.id} name={klass.name} description={klass.description ?? ""} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <Users className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xl font-black text-slate-950">{klass.memberships.length}</p>
              <p className="text-xs font-black uppercase text-slate-500">{text.students}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xl font-black text-slate-950">{klass._count.assignments}</p>
              <p className="text-xs font-black uppercase text-slate-500">{text.assignments}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">{text.studentsTitle}</h2>
          <div className="flex flex-wrap gap-2">
            <AddStudentModal
              locale={locale}
              classId={klass.id}
              students={availableStudents.map((student) => ({ id: student.id, name: student.name, username: student.username }))}
            />
          </div>
        </div>
        {klass.memberships.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {klass.memberships.map((membership) => (
              <div key={membership.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <Link href={`/${locale}/teacher/students/${membership.student.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                  <AvatarBadge name={membership.student.name} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{membership.student.name}</p>
                    <p className="truncate text-xs text-slate-500">@{membership.student.username ?? "—"}</p>
                  </div>
                </Link>
                <RemoveStudentButton locale={locale} classId={klass.id} studentId={membership.student.id} studentName={membership.student.name} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={text.emptyStudents} />
        )}
      </section>
    </div>
  );
}

