import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.status === "PENDING") redirect(`/${locale}/pending`);
  if (user.status === "REJECTED") redirect(`/${locale}/rejected`);
  if (user.status === "SUSPENDED") redirect(`/${locale}/suspended`);
  redirect(`/${locale}/${user.role.toLocaleLowerCase()}`);
}
