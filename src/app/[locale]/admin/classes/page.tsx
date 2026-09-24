import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function AdminClassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const classes = await prisma.class.findMany({
    include: { teacher: true, school: true, academicYear: true, _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" }
  });
  return (
    <Card>
      <CardHeader><CardTitle>{locale === "vi" ? "Lớp học" : "Classes"}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {classes.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.school?.name ?? "—"} · {item.academicYear?.name ?? "—"}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item._count.memberships} {locale === "vi" ? "học sinh" : "students"}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{locale === "vi" ? "Giáo viên" : "Teacher"}: {item.teacher.name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
