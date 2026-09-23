import { Building2, Power } from "lucide-react";
import { createSchoolAction, toggleSchoolAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { prisma } from "@/lib/db";

export default async function AdminSchoolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const schools = await prisma.school.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });
  const text = isEn
    ? {
        title: "Schools",
        subtitle: "Manage the official school list used by student registration.",
        add: "Add school",
        name: "School name",
        code: "Code",
        address: "Address",
        contact: "Contact",
        save: "Save school",
        active: "Active",
        inactive: "Hidden",
        students: "students",
        disable: "Hide",
        enable: "Enable",
        empty: "No schools yet."
      }
    : {
        title: "Trường học",
        subtitle: "Quản lý danh sách trường chính thức dùng trong form đăng ký học viên.",
        add: "Thêm trường",
        name: "Tên trường",
        code: "Mã trường",
        address: "Địa chỉ",
        contact: "Liên hệ",
        save: "Lưu trường",
        active: "Đang dùng",
        inactive: "Đã ẩn",
        students: "học viên",
        disable: "Ẩn",
        enable: "Bật lại",
        empty: "Chưa có trường nào."
      };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase text-indigo-700">Admin</p>
          <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">{text.subtitle}</p>
        </div>
        <Modal
          title={text.add}
          triggerLabel={text.add}
          triggerIcon="plus"
        >
          <form action={createSchoolAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <label className="grid gap-1 text-sm font-bold">
              {text.name}
              <Input name="name" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                {text.code}
                <Input name="code" />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                {text.contact}
                <Input name="contact" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              {text.address}
              <Input name="address" />
            </label>
            <Button type="submit">{text.save}</Button>
          </form>
        </Modal>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {schools.length ? (
            schools.map((school) => (
              <div key={school.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${school.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {school.active ? text.active : text.inactive}
                  </span>
                </div>
                <h2 className="mt-4 text-base font-black text-slate-950">{school.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{school.code || school.address || text.code}</p>
                <p className="mt-3 text-sm font-bold text-slate-700">
                  {school._count.students} {text.students}
                </p>
                <form action={toggleSchoolAction} className="mt-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="schoolId" value={school.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <Power className="h-4 w-4" /> {school.active ? text.disable : text.enable}
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">{text.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
