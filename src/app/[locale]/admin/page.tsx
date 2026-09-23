import Link from "next/link";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { approveStudentAction, rejectStudentAction } from "@/actions/admin-actions";
import { ScoreCard } from "@/components/app/score-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVietnamDate } from "@/lib/date";
import { prisma } from "@/lib/db";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const [pending, approvedStudents, teachers, schools, suspended, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT", status: "PENDING" },
      include: { studentProfile: { include: { school: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.count({ where: { role: "STUDENT", status: "APPROVED" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.school.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { actor: true } })
  ]);
  const text = isEn
    ? {
        title: "Admin overview",
        subtitle: "Approve students, manage schools, and watch recent system changes.",
        pending: "Pending accounts",
        students: "Approved students",
        teachers: "Teachers",
        schools: "Schools",
        suspended: "Suspended",
        approvals: "Student approvals",
        noPending: "No pending students",
        student: "Student",
        registered: "Registered",
        school: "School / grade",
        actions: "Actions",
        approve: "Approve",
        reject: "Reject",
        manageSchools: "Manage schools",
        recent: "Recent admin actions",
        allLogs: "View all logs"
      }
    : {
        title: "Tổng quan admin",
        subtitle: "Duyệt học viên, quản lý trường học và theo dõi thay đổi hệ thống.",
        pending: "Chờ duyệt",
        students: "Học viên đã duyệt",
        teachers: "Giáo viên",
        schools: "Trường học",
        suspended: "Tạm khóa",
        approvals: "Duyệt học viên",
        noPending: "Không có học viên chờ duyệt",
        student: "Học viên",
        registered: "Đăng ký",
        school: "Trường / khối",
        actions: "Thao tác",
        approve: "Duyệt",
        reject: "Từ chối",
        manageSchools: "Quản lý trường",
        recent: "Thao tác gần đây",
        allLogs: "Xem nhật ký"
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
          <Button asChild>
            <Link href={`/${locale}/admin/schools`}>
              <Building2 className="h-4 w-4" /> {text.manageSchools}
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ScoreCard label={text.pending} value={pending.length} />
        <ScoreCard label={text.students} value={approvedStudents} />
        <ScoreCard label={text.teachers} value={teachers} />
        <ScoreCard label={text.schools} value={schools} />
        <ScoreCard label={text.suspended} value={suspended} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{text.approvals}</CardTitle>
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState title={text.noPending} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">{text.student}</th>
                      <th>Email</th>
                      <th>{text.registered}</th>
                      <th>{text.school}</th>
                      <th className="text-right">{text.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((student) => (
                      <tr key={student.id} className="border-t border-slate-100">
                        <td className="py-3 font-bold">{student.name}</td>
                        <td>{student.email}</td>
                        <td>{formatVietnamDate(student.createdAt)}</td>
                        <td>
                          {student.studentProfile?.school?.name ?? student.studentProfile?.schoolName ?? "-"} {student.studentProfile?.gradeLevel ?? ""}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <form action={approveStudentAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="userId" value={student.id} />
                              <Button size="sm" type="submit">{text.approve}</Button>
                            </form>
                            <form action={rejectStudentAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="userId" value={student.id} />
                              <Button size="sm" variant="outline" type="submit">{text.reject}</Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{text.recent}</CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
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
    </div>
  );
}
