import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { FounderCard } from "@/components/brand/founder-card";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { getFounderInfo } from "@/lib/site-settings";

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getDictionary(locale);
  const founder = await getFounderInfo(locale);
  const isEn = locale === "en";
  return (
    <AuthCard
      title={t.login}
      description={isEn ? "Sign in with your username and password." : "Đăng nhập bằng username và mật khẩu."}
      footerHref={`/${locale}/register`}
      footerLabel={isEn ? "Student? Create your own account" : "Học sinh? Tự tạo tài khoản"}
      beforeCard={
        <div className="space-y-3">
          <FounderCard founder={founder} />
          {query.registered === "1" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {isEn ? "Account created successfully. You can sign in now." : "Tạo tài khoản thành công. Em có thể đăng nhập ngay."}
            </div>
          ) : null}
        </div>
      }
    >
      <LoginForm
        usernameLabel={isEn ? "Username" : "Tên đăng nhập"}
        passwordLabel={t.password}
        submitLabel={t.login}
        pendingLabel={isEn ? "Signing in..." : "Đang đăng nhập..."}
      />
    </AuthCard>
  );
}
