import { BrandLogo } from "@/components/brand/brand-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

export default async function SuspendedPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale);
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg">
        <CardHeader>
          <BrandLogo />
          <CardTitle>{t.suspendedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Access is paused. Please contact an administrator.</p>
        </CardContent>
      </Card>
    </main>
  );
}
