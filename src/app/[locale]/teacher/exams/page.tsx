import Link from "next/link";
import { BookOpen, FileUp, Library } from "lucide-react";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateExamModal } from "@/components/teacher/create-exam-modal";
import { AiExamModal } from "@/components/teacher/ai-generation-modals";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function TeacherExamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const [exams, questionCount] = await Promise.all([
    prisma.exam.findMany({
      where: { createdById: teacher.id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { sections: { include: { groups: { include: { _count: { select: { questions: true } } } } } } }
        },
        _count: { select: { assignments: true } }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.questionBankItem.count({ where: { createdById: teacher.id } })
  ]);
  const draftCount = exams.filter((exam) => exam.versions[0]?.status === "DRAFT").length;
  const publishedCount = exams.filter((exam) => exam.versions[0]?.status === "PUBLISHED").length;
  const text = isEn
    ? {
        title: "Exam workspace",
        subtitle: "Build an exam from your question bank, imported files, or a clean blank draft.",
        create: "New exam",
        import: "Import Word/Excel",
        bank: "Question bank",
        drafts: "drafts",
        published: "published",
        questions: "bank questions",
        assignments: "assignments",
        noExams: "No exams yet. Start with a blank draft or import from Word/Excel."
      }
    : {
        title: "Kho đề",
        subtitle: "Soạn đề từ ngân hàng câu hỏi, import file Word/Excel, hoặc tạo bản nháp mới.",
        create: "Tạo đề",
        import: "Import Word/Excel",
        bank: "Ngân hàng câu hỏi",
        drafts: "bản nháp",
        published: "đã xuất bản",
        questions: "câu trong kho",
        assignments: "lượt giao",
        noExams: "Chưa có đề nào. Bắt đầu bằng bản nháp mới hoặc import từ Word/Excel."
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{isEn ? "Exam builder" : "Soạn đề"}</p>
            <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiExamModal locale={locale} />
            <CreateExamModal locale={locale} />
            <Button asChild variant="secondary">
              <Link href={`/${locale}/teacher/exams/import`}>
                <FileUp className="h-4 w-4" /> {text.import}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/teacher/question-bank`}>
                <Library className="h-4 w-4" /> {text.bank}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric value={draftCount} label={text.drafts} />
        <Metric value={publishedCount} label={text.published} />
        <Metric value={questionCount} label={text.questions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {exams.map((exam) => {
                const version = exam.versions[0];
                const questions = version?.sections.reduce(
                  (sum, section) => sum + section.groups.reduce((groupSum, group) => groupSum + group._count.questions, 0),
                  0
                ) ?? 0;
                return (
                  <Link key={exam.id} href={`/${locale}/teacher/exams/${exam.id}/builder`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {version ? <StatusBadge status={version.status} /> : null}
                        {version ? <Badge tone={version.mode === "PRACTICE" ? "indigo" : "slate"}>{version.mode === "PRACTICE" ? (isEn ? "Practice" : "Luyện tập") : (isEn ? "Test" : "Kiểm tra")}</Badge> : null}
                      </div>
                    </div>
                    <h2 className="font-black text-slate-950">{exam.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{exam.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                      <span>{questions} {isEn ? "questions" : "câu"}</span>
                      <span>{exam._count.assignments} {text.assignments}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">{text.noExams}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}
