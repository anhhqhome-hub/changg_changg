import { registerStudentAction } from "@/actions/auth-actions";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n/get-dictionary";
import { prisma } from "@/lib/db";
import type { Locale } from "@/i18n/config";

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale);
  const schools = await prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const text =
    locale === "vi"
      ? {
          description: "Tạo tài khoản học viên. Admin sẽ duyệt trước khi bạn vào lớp.",
          school: "Trường học",
          grade: "Khối/lớp",
          chooseSchool: "Chọn trường",
          noSchools: "Chưa có trường đang hoạt động. Vui lòng nhờ admin thêm trường trước."
        }
      : {
          description: "Create a student account. An admin will approve access before you enter classes.",
          school: "School",
          grade: "Grade",
          chooseSchool: "Choose school",
          noSchools: "No active schools yet. Please ask an admin to add a school first."
        };
  return (
    <AuthCard title={t.register} description={text.description} footerHref={`/${locale}/login`} footerLabel={t.login}>
      <form action={registerStudentAction} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-1 text-sm font-medium">
          {t.name}
          <Input name="name" required autoComplete="name" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.email}
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.password}
          <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            {text.school}
            <select name="schoolId" required className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="">{text.chooseSchool}</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {text.grade}
            <Input name="gradeLevel" />
          </label>
        </div>
        {schools.length === 0 ? <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">{text.noSchools}</p> : null}
        <Button type="submit">{t.register}</Button>
      </form>
    </AuthCard>
  );
}
