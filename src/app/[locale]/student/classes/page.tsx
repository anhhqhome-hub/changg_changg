import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentClassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const student = await requireRole("STUDENT", locale);
  const memberships = await prisma.classMembership.findMany({
    where: { studentId: student.id },
    include: { class: { include: { teacher: true, school: true, academicYear: true } } },
    orderBy: { class: { createdAt: "desc" } }
  });
  return (
    <Card>
      <CardHeader><CardTitle>{locale === "vi" ? "Lớp của em" : "My classes"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {memberships.map((membership) => (
          <div key={membership.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-black text-slate-950">{membership.class.name}</p>
            <p className="mt-1 text-sm text-slate-600">{membership.class.school?.name ?? "—"} · {membership.class.academicYear?.name ?? "—"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{locale === "vi" ? "Giáo viên" : "Teacher"}: {membership.class.teacher.name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
