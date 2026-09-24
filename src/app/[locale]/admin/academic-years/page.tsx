import { CalendarDays, Power } from "lucide-react";
import { toggleAcademicYearAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { prisma } from "@/lib/db";

export default async function AdminAcademicYearsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const currentAcademicYear = await getOrCreateCurrentAcademicYear();
  const years = await prisma.academicYear.findMany({
    include: { _count: { select: { classes: true } } },
    orderBy: { name: "desc" }
  });
  const text = isEn
    ? {
        title: "Academic years",
        subtitle: `The current academic year (${currentAcademicYear.name}) is managed automatically. Previous years are retained for historical reports.`,
        active: "Active",
        inactive: "Closed",
        current: "Current year",
        automatic: "Automatic",
        classes: "classes",
        disable: "Close",
        enable: "Reopen",
        empty: "No academic years yet."
      }
    : {
        title: "Năm học",
        subtitle: `Năm học hiện tại (${currentAcademicYear.name}) được hệ thống quản lý tự động. Các năm cũ được giữ lại để xem báo cáo lịch sử.`,
        active: "Đang hoạt động",
        inactive: "Đã đóng",
        current: "Năm hiện tại",
        automatic: "Tự động",
        classes: "lớp",
        disable: "Đóng năm học",
        enable: "Mở lại",
        empty: "Chưa có năm học nào."
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase text-indigo-700">Admin</p>
        <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">{text.subtitle}</p>
      </section>

      <Card>
        <CardHeader><CardTitle>{text.title}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {years.length ? years.map((year) => {
            const isCurrent = year.id === currentAcademicYear.id;
            return (
              <div key={year.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {isCurrent ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{text.current}</span> : null}
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${year.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {year.active ? text.active : text.inactive}
                    </span>
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-black text-slate-950">{year.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {year.startDate ? year.startDate.toLocaleDateString("vi-VN") : "—"} → {year.endDate ? year.endDate.toLocaleDateString("vi-VN") : "—"}
                </p>
                <p className="mt-3 text-sm font-bold text-slate-700">{year._count.classes} {text.classes}</p>
                {isCurrent ? (
                  <p className="mt-4 text-xs font-bold text-indigo-700">{text.automatic}</p>
                ) : (
                  <form action={toggleAcademicYearAction} className="mt-4">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="academicYearId" value={year.id} />
                    <Button type="submit" variant="outline" size="sm">
                      <Power className="h-4 w-4" /> {year.active ? text.disable : text.enable}
                    </Button>
                  </form>
                )}
              </div>
            );
          }) : <p className="text-sm text-slate-500">{text.empty}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
