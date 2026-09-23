import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { FounderCard } from "@/components/brand/founder-card";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { getFounderInfo } from "@/lib/site-settings";

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale);
  const founder = await getFounderInfo(locale);
  const description =
    locale === "vi"
      ? "Chào mừng bạn quay lại không gian dạy và học tiếng Anh."
      : "Welcome back to your English learning workspace.";
  return (
    <AuthCard
      title={t.login}
      description={description}
      footerHref={`/${locale}/register`}
      footerLabel={t.register}
      beforeCard={<FounderCard founder={founder} />}
    >
      <LoginForm
        emailLabel={t.email}
        passwordLabel={t.password}
        submitLabel={t.login}
        pendingLabel={locale === "vi" ? "Đang đăng nhập..." : "Signing in..."}
      />
    </AuthCard>
  );
}
