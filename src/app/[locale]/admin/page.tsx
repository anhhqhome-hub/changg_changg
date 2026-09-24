import Link from "next/link";
import { Building2, CalendarDays, Database, School, Users } from "lucide-react";
import { ScoreCard } from "@/components/app/score-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVietnamDate } from "@/lib/date";
import { prisma } from "@/lib/db";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const [students, teachers, schools, classes, activeYears, auditLogs] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", status: "APPROVED" } }),
    prisma.user.count({ where: { role: "TEACHER", status: "APPROVED" } }),
    prisma.school.count({ where: { active: true } }),
    prisma.class.count({ where: { archivedAt: null } }),
    prisma.academicYear.count({ where: { active: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } })
  ]);

  const text = isEn
    ? {
        title: "Admin overview",
        subtitle: "Manage schools, academic years, accounts, and all application data from one place.",
        students: "Students",
        teachers: "Teachers",
        schools: "Active schools",
        classes: "Active classes",
        years: "Academic years",
        manageSchools: "Manage schools",
        manageYears: "Academic years",
        manageUsers: "All accounts",
        recent: "Recent system activity",
        allLogs: "View all logs",
        manageData: "Manage all data"
      }
    : {
        title: "Tổng quan quản trị",
        subtitle: "Quản lý trường, năm học, toàn bộ tài khoản và mọi dữ liệu nghiệp vụ của hệ thống.",
        students: "Học sinh",
        teachers: "Giáo viên",
        schools: "Trường đang hoạt động",
        classes: "Lớp đang hoạt động",
        years: "Năm học đang mở",
        manageSchools: "Quản lý trường",
        manageYears: "Quản lý năm học",
        manageUsers: "Tất cả tài khoản",
        recent: "Hoạt động gần đây",
        allLogs: "Xem nhật ký",
        manageData: "Quản trị dữ liệu"
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">Admin</p>
            <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link href={`/${locale}/admin/users`}><Users className="h-4 w-4" />{text.manageUsers}</Link></Button>
            <Button variant="outline" asChild><Link href={`/${locale}/admin/data`}><Database className="h-4 w-4" />{text.manageData}</Link></Button>
            <Button variant="outline" asChild><Link href={`/${locale}/admin/academic-years`}><CalendarDays className="h-4 w-4" />{text.manageYears}</Link></Button>
            <Button asChild><Link href={`/${locale}/admin/schools`}><Building2 className="h-4 w-4" />{text.manageSchools}</Link></Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ScoreCard label={text.students} value={students} />
        <ScoreCard label={text.teachers} value={teachers} />
        <ScoreCard label={text.schools} value={schools} />
        <ScoreCard label={text.classes} value={classes} />
        <ScoreCard label={text.years} value={activeYears} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{text.recent}</CardTitle>
          <School className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{log.action}</p>
                <p className="text-sm text-slate-500">{log.actor?.name ?? "System"} · {log.entityType}</p>
              </div>
              <StatusBadge status={formatVietnamDate(log.createdAt)} />
            </div>
          ))}
          <Link className="inline-flex text-sm font-bold text-indigo-700" href={`/${locale}/admin/audit-logs`}>
            {text.allLogs}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
