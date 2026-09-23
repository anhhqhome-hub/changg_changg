import { AppShell } from "@/components/app/app-shell";
import { TeacherAgentChat } from "@/components/teacher/teacher-agent-chat";
import { requireRole } from "@/lib/permissions";

export default async function TeacherLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireRole("TEACHER", locale);
  return (
    <AppShell user={user} locale={locale}>
      {children}
      <TeacherAgentChat locale={locale} />
    </AppShell>
  );
}
