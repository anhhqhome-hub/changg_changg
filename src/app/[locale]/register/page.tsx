import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { getOrCreateCurrentAcademicYear } from "@/lib/academic-year";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const currentAcademicYear = await getOrCreateCurrentAcademicYear();

  const schools = await prisma.school.findMany({
    where: {
      active: true,
      classes: {
        some: {
          archivedAt: null,
          academicYearId: currentAcademicYear.id
        }
      }
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      classes: {
        where: {
          archivedAt: null,
          academicYearId: currentAcademicYear.id
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          teacher: { select: { name: true } }
        }
      }
    }
  });

  return (
    <AuthCard
      title={isEn ? "Create student account" : "Tạo tài khoản học sinh"}
      description={
        isEn
          ? `Create an account with a username, then choose your school and class for the current academic year ${currentAcademicYear.name}. No email is required.`
          : `Tự tạo tài khoản bằng username, chọn trường và lớp. Năm học hiện tại ${currentAcademicYear.name} được hệ thống tự xác định. Không cần email.`
      }
      footerHref={`/${locale}/login`}
      footerLabel={isEn ? "Already have an account? Sign in" : "Đã có tài khoản? Đăng nhập"}
    >
      <RegisterForm locale={locale} schools={schools} currentAcademicYearName={currentAcademicYear.name} />
    </AuthCard>
  );
}
