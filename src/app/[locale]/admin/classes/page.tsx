import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function AdminClassesPage() {
  const classes = await prisma.class.findMany({ include: { teacher: true, _count: { select: { memberships: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <Card>
      <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {classes.map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-slate-600">{item.teacher.name} · {item._count.memberships} students</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
