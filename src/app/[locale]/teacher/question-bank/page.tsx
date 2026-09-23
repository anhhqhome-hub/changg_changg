import Link from "next/link";
import { BookOpen, FileUp, Search, Sparkles } from "lucide-react";
import { createQuestionAction } from "@/actions/teacher-actions";
import { SkillBadge } from "@/components/app/skill-badge";
import { AiQuestionModal } from "@/components/teacher/ai-generation-modals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

export default async function QuestionBankPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const questions = await prisma.questionBankItem.findMany({
    where: { createdById: teacher.id },
    include: { _count: { select: { examQuestions: true } } },
    orderBy: { createdAt: "desc" },
    take: 80
  });
  const stats = questions.reduce<Record<string, number>>((acc, item) => {
    acc[item.skill] = (acc[item.skill] ?? 0) + 1;
    return acc;
  }, {});
  const text = isEn
    ? {
        title: "Question bank",
        subtitle: "Store reusable questions first, then pull the right ones into each exam.",
        newQuestion: "New question",
        import: "Import Word/Excel",
        exams: "Open exams",
        total: "questions",
        used: "used in exams",
        unused: "ready to use",
        prompt: "Question prompt",
        empty: "No questions yet. Add one question or import a file to start building exams faster.",
        formTitle: "Create reusable question",
        formDesc: "Keep the question clean here. In the exam builder, you can choose it by skill.",
        create: "Create question",
        options: "Options, one per line",
        answers: "Correct answer JSON or text"
      }
    : {
        title: "Ngân hàng câu hỏi",
        subtitle: "Tạo câu hỏi dùng lại trước, sau đó kéo đúng câu hỏi vào từng đề.",
        newQuestion: "Thêm câu hỏi",
        import: "Import Word/Excel",
        exams: "Mở kho đề",
        total: "câu hỏi",
        used: "đã dùng trong đề",
        unused: "sẵn sàng dùng",
        prompt: "Nội dung câu hỏi",
        empty: "Chưa có câu hỏi. Thêm một câu hoặc import file để tạo đề nhanh hơn.",
        formTitle: "Tạo câu hỏi dùng lại",
        formDesc: "Giữ câu hỏi sạch ở đây. Khi soạn đề, bạn chọn câu theo đúng kỹ năng.",
        create: "Tạo câu hỏi",
        options: "Lựa chọn, mỗi dòng một đáp án",
        answers: "Đáp án đúng dạng JSON hoặc text"
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{isEn ? "Library" : "Thư viện"}</p>
            <h1 className="text-2xl font-black text-slate-950">{text.title}</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">{text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiQuestionModal locale={locale} />
            <QuestionFormModal locale={locale} text={text} />
            <Button asChild variant="secondary">
              <Link href={`/${locale}/teacher/exams/import`}>
                <FileUp className="h-4 w-4" /> {text.import}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/teacher/exams`}>
                <BookOpen className="h-4 w-4" /> {text.exams}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric value={questions.length} label={text.total} />
        <Metric value={questions.filter((item) => item._count.examQuestions > 0).length} label={text.used} />
        <Metric value={questions.filter((item) => item._count.examQuestions === 0).length} label={text.unused} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{text.title}</CardTitle>
          <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 sm:flex">
            <Search className="h-4 w-4" />
            {isEn ? "Grouped by skill" : "Nhóm theo kỹ năng"}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(stats).map(([skill, count]) => (
              <span key={skill} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                <SkillBadge skill={skill} /> {count}
              </span>
            ))}
          </div>
          {questions.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {questions.map((question) => (
                <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <SkillBadge skill={question.skill} />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">{question.questionType}</span>
                  </div>
                  <h2 className="font-black text-slate-950">{question.title}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{question.prompt}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                    <span>{question.points} pts</span>
                    <span>{question._count.examQuestions} {isEn ? "exam uses" : "lần dùng"}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">{text.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionFormModal({ locale, text }: { locale: string; text: Record<string, string> }) {
  return (
    <Modal title={text.formTitle} description={text.formDesc} triggerLabel={text.newQuestion} triggerIcon="plus">
      <form action={createQuestionAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <Input name="title" placeholder={locale === "en" ? "Question title" : "Tiêu đề câu hỏi"} required />
        <Textarea name="prompt" placeholder={text.prompt} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="skill" className="h-11 rounded-md border border-slate-300 bg-white px-3">
            {["LISTENING", "SPEAKING", "READING", "WRITING"].map((skill) => <option key={skill}>{skill}</option>)}
          </select>
          <select name="questionType" className="h-11 rounded-md border border-slate-300 bg-white px-3">
            {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "SHORT_ANSWER", "ESSAY", "ORDERING", "MATCHING", "SPEAKING_RECORDING", "READING_SINGLE_CHOICE", "READING_MULTIPLE_CHOICE", "LISTENING_CHOICE", "LISTENING_FILL_BLANK"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        <Input name="points" type="number" step="0.5" defaultValue="1" />
        <Textarea name="options" placeholder={`${text.options}\nA. Example\nB. Another`} />
        <Textarea name="correctAnswers" placeholder={text.answers} />
        <Button type="submit">
          <Sparkles className="h-4 w-4" /> {text.create}
        </Button>
      </form>
    </Modal>
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
