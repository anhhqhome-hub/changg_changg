import { KeyRound, LogOut, Pencil, Trash2, UserPlus } from "lucide-react";
import { createAccountAction, deleteAccountAction, resetUserPasswordAction, revokeUserSessionsAction, updateAccountAction } from "@/actions/admin-actions";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { prisma } from "@/lib/db";

const roles = ["ADMIN", "TEACHER", "STUDENT"] as const;
const statuses = ["APPROVED", "SUSPENDED", "PENDING", "REJECTED"] as const;

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const [users, schools] = await Promise.all([
    prisma.user.findMany({
      include: { teacherProfile: { include: { school: true } }, studentProfile: { include: { school: true } }, _count: { select: { sessions: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }]
    }),
    prisma.school.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] })
  ]);

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase text-indigo-700">Admin</p>
          <h1 className="text-2xl font-black text-slate-950">{isEn ? "Account management" : "Quản lý tài khoản"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEn
              ? "Students may self-register. Administrators can create, edit, reset passwords, suspend, change roles, and delete every account."
              : "Học sinh có thể tự đăng ký. Admin có toàn quyền tạo, sửa, reset mật khẩu, khóa, đổi vai trò và xóa mọi tài khoản."}
          </p>
        </div>
        <Modal title={isEn ? "Create account" : "Tạo tài khoản"} triggerLabel={isEn ? "New account" : "Tạo tài khoản"} triggerIcon="plus">
          <form action={createAccountAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <label className="grid gap-1 text-sm font-bold">
              {isEn ? "Full name" : "Họ tên"}
              <Input name="name" required minLength={2} maxLength={120} />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Username
              <Input name="username" required minLength={3} maxLength={30} autoComplete="off" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              {isEn ? "Initial password" : "Mật khẩu ban đầu"}
              <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              {isEn ? "Role" : "Vai trò"}
              <select name="role" defaultValue="STUDENT" className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              {isEn ? "School (required for teachers)" : "Trường (bắt buộc với giáo viên)"}
              <select name="schoolId" defaultValue="" className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="">{isEn ? "No school / assign later" : "Chưa gán trường / gán sau"}</option>
                {schools.filter((school) => school.active).map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              {isEn ? "Grade (students only)" : "Khối (chỉ học sinh)"}
              <Input name="gradeLevel" placeholder={isEn ? "Grade 9" : "Khối 9"} />
            </label>
            <Button type="submit"><UserPlus className="h-4 w-4" />{isEn ? "Create account" : "Tạo tài khoản"}</Button>
          </form>
        </Modal>
      </section>

      <Card>
        <CardHeader><CardTitle>{isEn ? `Accounts (${users.length})` : `Danh sách tài khoản (${users.length})`}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2">{isEn ? "Name" : "Tên"}</th>
                <th>Username</th>
                <th>{isEn ? "School" : "Trường"}</th>
                <th>{isEn ? "Role" : "Vai trò"}</th>
                <th>{isEn ? "Status" : "Trạng thái"}</th>
                <th>{isEn ? "Created" : "Ngày tạo"}</th>
                <th className="text-right">{isEn ? "Actions" : "Thao tác"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const schoolId = user.teacherProfile?.schoolId ?? user.studentProfile?.schoolId ?? "";
                const schoolName = user.teacherProfile?.school?.name ?? user.studentProfile?.school?.name ?? "—";
                return (
                  <tr key={user.id} className="border-t border-slate-100 align-top">
                    <td className="py-3 font-semibold">{user.name}</td>
                    <td className="font-mono text-xs">@{user.username ?? "—"}</td>
                    <td>{schoolName}</td>
                    <td>{user.role}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className="whitespace-nowrap text-xs text-slate-500">{user.createdAt.toLocaleDateString(isEn ? "en-US" : "vi-VN")}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Modal title={isEn ? `Edit · ${user.name}` : `Sửa · ${user.name}`} triggerLabel={isEn ? "Edit" : "Sửa"} triggerVariant="outline">
                          <form action={updateAccountAction} className="grid gap-3 text-left">
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="userId" value={user.id} />
                            <label className="grid gap-1 text-sm font-bold">{isEn ? "Full name" : "Họ tên"}<Input name="name" defaultValue={user.name} required /></label>
                            <label className="grid gap-1 text-sm font-bold">Username<Input name="username" defaultValue={user.username ?? ""} required minLength={3} maxLength={30} /></label>
                            <label className="grid gap-1 text-sm font-bold">
                              {isEn ? "Role" : "Vai trò"}
                              <select name="role" defaultValue={user.role} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm font-bold">
                              {isEn ? "Status" : "Trạng thái"}
                              <select name="status" defaultValue={user.status} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm font-bold">
                              {isEn ? "School" : "Trường"}
                              <select name="schoolId" defaultValue={schoolId} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm">
                                <option value="">{isEn ? "No school" : "Chưa gán trường"}</option>
                                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm font-bold">{isEn ? "Grade" : "Khối"}<Input name="gradeLevel" defaultValue={user.studentProfile?.gradeLevel ?? ""} /></label>
                            <Button type="submit"><Pencil className="h-4 w-4" />{isEn ? "Save changes" : "Lưu thay đổi"}</Button>
                          </form>
                        </Modal>

                        <form action={revokeUserSessionsAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="userId" value={user.id} />
                          <Button type="submit" variant="outline" size="sm" title={isEn ? "Sign out this account from all devices" : "Đăng xuất tài khoản này khỏi mọi thiết bị"}>
                            <LogOut className="h-4 w-4" />{isEn ? `Sessions (${user._count.sessions})` : `Phiên (${user._count.sessions})`}
                          </Button>
                        </form>

                        <Modal title={isEn ? `Reset password · ${user.name}` : `Đặt lại mật khẩu · ${user.name}`} triggerLabel={isEn ? "Password" : "Mật khẩu"} triggerVariant="outline">
                          <form action={resetUserPasswordAction} className="grid gap-3 text-left">
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="userId" value={user.id} />
                            <p className="text-sm text-slate-600">@{user.username ?? "—"} · {user.role}</p>
                            <label className="grid gap-1 text-sm font-bold">
                              {isEn ? "New password" : "Mật khẩu mới"}
                              <Input name="password" type="password" minLength={8} required autoComplete="new-password" />
                            </label>
                            <Button type="submit"><KeyRound className="h-4 w-4" />{isEn ? "Reset password" : "Đặt lại mật khẩu"}</Button>
                          </form>
                        </Modal>

                        <Modal
                          title={isEn ? `Delete · ${user.name}` : `Xóa · ${user.name}`}
                          description={isEn ? "This permanently deletes the account and related data. This cannot be undone." : "Thao tác này xóa vĩnh viễn tài khoản và dữ liệu liên quan, không thể hoàn tác."}
                          triggerLabel={isEn ? "Delete" : "Xóa"}
                          triggerVariant="outline"
                        >
                          <form action={deleteAccountAction} className="grid gap-4 text-left">
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="userId" value={user.id} />
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                              <strong>{user.name}</strong> · @{user.username ?? "—"} · {user.role}
                            </div>
                            <Button type="submit" variant="destructive"><Trash2 className="h-4 w-4" />{isEn ? "Delete permanently" : "Xóa vĩnh viễn"}</Button>
                          </form>
                        </Modal>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
