import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentClassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const student = await requireRole("STUDENT", locale);
  const memberships = await prisma.classMembership.findMany({ where: { studentId: student.id }, include: { class: { include: { teacher: true } } } });
  return (
    <Card>
      <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {memberships.map((membership) => (
          <div key={membership.id} className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold">{membership.class.name}</p>
            <p className="text-sm text-slate-600">{membership.class.teacher.name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
