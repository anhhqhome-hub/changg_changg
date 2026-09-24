import Link from "next/link";
import { ArrowRight, CheckCircle2, Library, Plus } from "lucide-react";
import { addQuestionToExamAction, assignExamActionWithState, publishExamAction, updateExamModeAction } from "@/actions/teacher-actions";
import { SkillBadge } from "@/components/app/skill-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignExamModal } from "@/components/teacher/assign-exam-modal";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { env } from "@/lib/env";
import { databaseWriteReadiness } from "@/lib/runtime-database";
import type { Skill } from "@/generated/prisma/enums";

export default async function ExamBuilderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const exam = await prisma.exam.findFirst({
    where: { id, createdById: teacher.id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          sections: {
            include: { groups: { include: { questions: { include: { options: true } } } } },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });

  if (!exam) {
    const databaseStatus = databaseWriteReadiness(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-xl font-black">{isEn ? "Exam not found in the current database" : "Không tìm thấy đề trong database hiện tại"}</h1>
        <p className="mt-2 text-sm font-semibold leading-6">
          {databaseStatus.ephemeral
            ? isEn
              ? "This deployment is using Vercel temporary SQLite storage. A previous request may have created the exam in another function instance. Configure a persistent libSQL/Turso database and import again."
              : "Deployment đang dùng SQLite tạm của Vercel. Request trước có thể đã tạo đề ở một function instance khác. Hãy cấu hình database persistent libSQL/Turso rồi import lại."
            : isEn
              ? "The exam may have been deleted or you do not have access to it."
              : "Đề có thể đã bị xóa hoặc tài khoản hiện tại không có quyền truy cập."}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/teacher/exams/import`}>{isEn ? "Back to import" : "Quay lại import"}</Link>
        </Button>
      </div>
    );
  }

  const [bank, classes, students] = await Promise.all([
    prisma.questionBankItem.findMany({ where: { createdById: teacher.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { examQuestions: true } } } }),
    prisma.class.findMany({
      where: { teacherId: teacher.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, academicYear: { select: { name: true } } }
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", status: "APPROVED", memberships: { some: { class: { teacherId: teacher.id } } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);
  const version = exam.versions[0];
  if (!version) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-black">{isEn ? "Exam version is missing" : "Đề chưa có phiên bản"}</h1>
        <p className="mt-2 text-sm font-semibold">{isEn ? "Delete this incomplete draft and import the source file again." : "Hãy xóa bản nháp chưa hoàn chỉnh này và import lại file nguồn."}</p>
      </div>
    );
  }
  const questions = version.sections.flatMap((section) => section.groups.flatMap((group) => group.questions));
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const bankBySkill = bank.reduce<Record<Skill, typeof bank>>(
    (acc, item) => {
      acc[item.skill].push(item);
      return acc;
    },
    { LISTENING: [], SPEAKING: [], READING: [], WRITING: [] }
  );
  const text = isEn
    ? {
        builder: "Exam builder",
        subtitle: "Add questions from the bank by skill. Keep the draft clean, then publish and assign.",
        publish: "Publish",
        assign: "Assign exam",
        backBank: "Question bank",
        questions: "questions",
        points: "points",
        version: "Version",
        attempts: "Attempts",
        mode: "Mode",
        release: "Release",
        addFromBank: "Add from bank",
        noQuestions: "No questions in this section yet.",
        noBank: "No matching bank questions for this skill.",
        createMore: "Create more questions",
        added: "In this exam",
        bankUses: "uses",
        assignOpen: "Assign exam", assignTitle: "Assign exam", assignDescription: "Set the schedule and choose who should receive", targetLabel: "Assign to", targetClass: "A whole class", targetStudent: "One student", classLabel: "Class", studentLabel: "Student", classPlaceholder: "Choose a class", studentPlaceholder: "Choose a student", chooseTarget: "Choose a class or a student before assigning.", errorClassEmpty: "This class has no students yet.", errorStudentUnavailable: "This student is not available for assignment.", errorNoQuestions: "Add at least one question before assigning.", errorNotAssignable: "This exam cannot be assigned yet.", success: "Exam assigned successfully.", assignSubmit: "Assign now", assigning: "Assigning...", cancel: "Cancel"
        ,timeLimit: "Time limit (minutes)", deadline: "Submission deadline", timingHint: "Leave the deadline empty to keep the exam open. Leave the time limit empty for unlimited time."
      }
    : {
        builder: "Soạn đề",
        subtitle: "Thêm câu hỏi từ ngân hàng theo đúng kỹ năng. Xong bản nháp thì xuất bản và giao bài.",
        publish: "Xuất bản",
        assign: "Giao đề",
        backBank: "Ngân hàng câu hỏi",
        questions: "câu",
        points: "điểm",
        version: "Phiên bản",
        attempts: "Số lượt làm",
        mode: "Chế độ",
        release: "Trả kết quả",
        addFromBank: "Thêm từ ngân hàng",
        noQuestions: "Section này chưa có câu hỏi.",
        noBank: "Chưa có câu hỏi phù hợp kỹ năng này trong ngân hàng.",
        createMore: "Tạo thêm câu hỏi",
        added: "Trong đề này",
        bankUses: "lần dùng",
        assignOpen: "Giao đề", assignTitle: "Giao đề", assignDescription: "Đặt lịch làm bài và chọn đối tượng nhận đề", targetLabel: "Giao cho", targetClass: "Cả lớp", targetStudent: "Một học sinh", classLabel: "Lớp", studentLabel: "Học sinh", classPlaceholder: "Chọn lớp", studentPlaceholder: "Chọn học sinh", chooseTarget: "Hãy chọn lớp hoặc học sinh trước khi giao đề.", errorClassEmpty: "Lớp này chưa có học sinh.", errorStudentUnavailable: "Học sinh này không thể nhận đề.", errorNoQuestions: "Hãy thêm ít nhất một câu hỏi trước khi giao đề.", errorNotAssignable: "Đề này chưa thể giao.", success: "Đã giao đề thành công.", assignSubmit: "Giao ngay", assigning: "Đang giao...", cancel: "Hủy"
        ,timeLimit: "Thời gian làm bài (phút)", deadline: "Hạn nộp bài", timingHint: "Để trống hạn nộp nếu muốn mở đề không giới hạn thời gian. Để trống thời gian làm bài nếu không giới hạn."
      };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-indigo-700">{text.builder}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-950">{exam.title}</h1>
              <StatusBadge status={version.status} />
            </div>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">{exam.description || text.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/teacher/question-bank`}>
                <Library className="h-4 w-4" /> {text.backBank}
              </Link>
            </Button>
            <form action={publishExamAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="examId" value={exam.id} />
              <Button type="submit" disabled={version.status !== "DRAFT"}>
                <CheckCircle2 className="h-4 w-4" /> {text.publish}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {version.sections.map((section) => {
            const sectionQuestions = section.groups.flatMap((group) => group.questions);
            const available = bankBySkill[section.skill];
            return (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <div className="mt-2 flex items-center gap-2">
                      <SkillBadge skill={section.skill} />
                      <span className="text-xs font-bold text-slate-500">
                        {sectionQuestions.length} {text.questions}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_300px]">
                  <div className="space-y-2">
                    {sectionQuestions.length ? (
                      sectionQuestions.map((question, index) => (
                        <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase text-slate-400">#{index + 1}</p>
                              <h2 className="font-black text-slate-950">{question.title}</h2>
                              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{question.prompt}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">{question.points} pts</span>
                          </div>
                          <p className="mt-3 text-xs font-bold text-slate-500">{question.questionType}</p>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-medium text-slate-500">{text.noQuestions}</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{text.addFromBank}</p>
                      <span className="text-xs font-bold text-slate-500">{available.length}</span>
                    </div>
                    {available.length ? (
                      <form action={addQuestionToExamAction} className="grid gap-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="examId" value={exam.id} />
                        <input type="hidden" name="sectionId" value={section.id} />
                        <select name="bankItemId" className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                          {available.map((question) => (
                            <option key={question.id} value={question.id}>
                              {question.title} · {question.points} pts
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary" disabled={version.status !== "DRAFT"}>
                          <Plus className="h-4 w-4" /> {text.addFromBank}
                        </Button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-500">{text.noBank}</p>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/${locale}/teacher/question-bank`}>
                            {text.createMore} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{isEn ? "Exam summary" : "Tóm tắt đề"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <SummaryRow label={text.questions} value={questions.length} />
              <SummaryRow label={text.points} value={totalPoints} />
              <SummaryRow label={text.version} value={version.versionNumber} />
              <SummaryRow label={text.mode} value={version.mode === "PRACTICE" ? (isEn ? "Practice" : "Luyện tập") : (isEn ? "Test" : "Kiểm tra")} />
              <SummaryRow label={text.attempts} value={version.mode === "PRACTICE" ? (isEn ? "Unlimited" : "Không giới hạn") : version.attemptsAllowed} />
              <SummaryRow label={text.release} value={version.resultsReleaseMode} />
              <form action={updateExamModeAction} className="grid gap-2 rounded-xl border border-slate-200 p-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="examId" value={exam.id} />
                <input type="hidden" name="versionId" value={version.id} />
                <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                  {isEn ? "Assessment mode" : "Chế độ bài"}
                  <select name="mode" defaultValue={version.mode} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-900">
                    <option value="TEST">{isEn ? "Test" : "Kiểm tra"}</option>
                    <option value="PRACTICE">{isEn ? "Practice - unlimited retries" : "Luyện tập - không giới hạn lượt"}</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                  {isEn ? "Test attempt limit" : "Số lượt tối đa khi kiểm tra"}
                  <input name="attemptsAllowed" type="number" min="1" max="20" defaultValue={version.attemptsAllowed} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-900" />
                </label>
                <Button type="submit" variant="outline" size="sm">{isEn ? "Save mode" : "Lưu chế độ"}</Button>
              </form>
              <AssignExamModal
                action={assignExamActionWithState}
                locale={locale}
                examId={exam.id}
                versionId={version.id}
                examTitle={exam.title}
                classes={classes.map((item) => ({ id: item.id, name: `${item.name}${item.academicYear?.name ? ` · ${item.academicYear.name}` : ""}` }))}
                students={students}
                defaultTimeLimitMinutes={version.timeLimitMinutes}
                defaultDeadlineLocalValue={version.deadline ? toDateTimeLocalValue(version.deadline) : ""}
                text={{ open: text.assignOpen, title: text.assignTitle, description: text.assignDescription, targetLabel: text.targetLabel, targetClass: text.targetClass, targetStudent: text.targetStudent, classLabel: text.classLabel, studentLabel: text.studentLabel, classPlaceholder: text.classPlaceholder, studentPlaceholder: text.studentPlaceholder, chooseTarget: text.chooseTarget, timeLimit: text.timeLimit, deadline: text.deadline, timingHint: text.timingHint, errorClassEmpty: text.errorClassEmpty, errorStudentUnavailable: text.errorStudentUnavailable, errorNoQuestions: text.errorNoQuestions, errorNotAssignable: text.errorNotAssignable, success: text.success, submit: text.assignSubmit, submitting: text.assigning, cancel: text.cancel }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text.backBank}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["LISTENING", "SPEAKING", "READING", "WRITING"] as Skill[]).map((skill) => (
                <div key={skill} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <SkillBadge skill={skill} />
                  <span className="text-sm font-black text-slate-700">{bankBySkill[skill].length}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function toDateTimeLocalValue(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}
