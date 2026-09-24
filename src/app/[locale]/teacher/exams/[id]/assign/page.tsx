import { assignExamAction, publishExamAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublishBeforeAssignModal } from "@/components/teacher/publish-before-assign-modal";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function AssignExamPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const [exam, classes] = await Promise.all([
    prisma.exam.findFirstOrThrow({ where: { id, createdById: teacher.id }, include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } } }),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archivedAt: null },
      include: { academicYear: true, memberships: { include: { student: { select: { id: true, name: true, username: true } } } } },
      orderBy: { createdAt: "desc" }
    })
  ]);
  const students = Array.from(
    new Map(classes.flatMap((klass) => klass.memberships.map((membership) => [membership.student.id, membership.student] as const))).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const version = exam.versions[0];
  const isEn = locale === "en";
  const modeLabel = version?.mode === "PRACTICE" ? (isEn ? "Practice" : "Luyện tập") : (isEn ? "Test" : "Kiểm tra");

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>{isEn ? "Assign" : "Giao"} {exam.title} · {modeLabel}</CardTitle></CardHeader>
        <CardContent>
        {!version || version.status !== "PUBLISHED" ? (
          <p className="text-sm text-slate-600">
            {isEn ? "Publish this exam to start assigning it." : "Xuất bản đề để bắt đầu giao cho học sinh."}
          </p>
        ) : (
          <form action={assignExamAction} className="grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="examId" value={exam.id} />
            <input type="hidden" name="versionId" value={version.id} />
            <label className="grid gap-1 text-sm font-medium">
              {isEn ? "Class" : "Lớp"}
              <select name="classId" className="h-11 rounded-md border border-slate-300 bg-white px-3">
                <option value="">{isEn ? "Selected student only" : "Chỉ một học sinh"}</option>
                {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name} · {klass.academicYear?.name ?? "—"}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              {isEn ? "Student" : "Học sinh"}
              <select name="studentId" className="h-11 rounded-md border border-slate-300 bg-white px-3">
                <option value="">{isEn ? "Whole class only" : "Chỉ cả lớp"}</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.name} · @{student.username ?? "—"}</option>)}
              </select>
            </label>
            <Button type="submit">{isEn ? "Assign" : "Giao đề"}</Button>
          </form>
        )}
        </CardContent>
      </Card>
      {!version || version.status !== "PUBLISHED" ? (
        <PublishBeforeAssignModal
          action={publishExamAction}
          locale={locale}
          examId={exam.id}
          examTitle={exam.title}
          title={isEn ? "Publish before assigning" : "Xuất bản trước khi giao đề"}
          description={isEn ? "This exam is still a draft. Publish it now to assign it to a class or student:" : "Đề này vẫn đang là bản nháp. Xuất bản ngay để giao cho lớp hoặc học sinh:"}
          publish={isEn ? "Publish exam now" : "Xuất bản đề ngay"}
          publishing={isEn ? "Publishing..." : "Đang xuất bản..."}
          cancel={isEn ? "Back to builder" : "Quay lại trình soạn đề"}
        />
      ) : null}
    </>
  );
}
