import { KnowledgeGames } from "@/components/student/knowledge-games";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function StudentGamesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const student = await requireRole("STUDENT", locale);
  const assignments = await prisma.examAssignment.findMany({
    where: { OR: [{ studentId: student.id }, { class: { memberships: { some: { studentId: student.id } } } }] },
    select: { version: { select: { sections: { select: { groups: { select: { questions: { select: { id: true, prompt: true, options: { select: { label: true, value: true, isCorrect: true }, orderBy: { sortOrder: "asc" } } } } } } } } } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const questions = assignments.flatMap((assignment) => assignment.version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions))).slice(0, 12);

  return <div className="space-y-5"><div><h1 className="text-2xl font-black text-slate-950">Trò chơi kiến thức</h1><p className="mt-1 text-sm text-slate-600">Luyện nhanh bằng câu hỏi trong các bài giáo viên đã giao.</p></div><KnowledgeGames questions={questions} /></div>;
}
