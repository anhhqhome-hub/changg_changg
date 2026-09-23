import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/permissions";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireRole("ADMIN", locale);
  return <AppShell user={user} locale={locale}>{children}</AppShell>;
}
