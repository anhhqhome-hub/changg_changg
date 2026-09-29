import { joinPracticeLinkAction } from "@/actions/student-actions";

export const dynamic = "force-dynamic";

export default async function JoinPracticeLinkPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  await joinPracticeLinkAction(locale, token);
}
