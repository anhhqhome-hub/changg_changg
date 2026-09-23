import Link from "next/link";
import { BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, FileUp, FolderOpen, Library, Sparkles, Users } from "lucide-react";
import { createTeacherTaskAction, toggleTeacherTaskAction } from "@/actions/teacher-actions";
import { SkillBadge } from "@/components/app/skill-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { AiExamModal } from "@/components/teacher/ai-generation-modals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { CreateExamModal } from "@/components/teacher/create-exam-modal";
import { formatVietnamDate, formatVietnamDateTime } from "@/lib/date";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";

const copy = {
  vi: {
    eyebrow: "Không gian làm việc",
    title: "Hôm nay cần làm gì?",
    subtitle: "Tập trung vào việc quan trọng, tạo đề nhanh và theo dõi lớp học trong một màn hình gọn.",
    tasks: "Việc hôm nay",
    tasksDesc: "Thêm việc, đặt hạn và đánh dấu xong ngay trong popup.",
    createExam: "Tạo đề",
    importExam: "Import Word/Excel",
    addQuestion: "Thêm câu hỏi",
    openTasks: "việc mở",
    exams: "đề",
    questions: "câu hỏi",
    students: "học viên",
    grading: "cần chấm",
    focus: "Cần chú ý",
    resources: "Kho làm việc",
    recentExams: "Đề gần đây",
    activity: "Bài nộp mới",
    deadlines: "Deadline",
    noTasks: "Chưa có việc nào. Thêm một việc nhỏ để bắt đầu ngày dạy học gọn hơn.",
    noActivity: "Chưa có bài nộp mới.",
    noDeadlines: "Chưa có deadline gần.",
    taskPlaceholder: "Ví dụ: Soạn 5 câu Reading chủ đề Environment",
    notePlaceholder: "Ghi chú ngắn, tài liệu cần chuẩn bị...",
    addTask: "Thêm việc",
    normal: "Bình thường",
    high: "Ưu tiên cao",
    low: "Nhẹ",
    done: "Đánh dấu hoàn thành",
    reopen: "Mở lại việc",
    due: "Hạn"
  },
  en: {
    eyebrow: "Teacher workspace",
    title: "What needs attention today?",
    subtitle: "Keep the important work close, create exams quickly, and scan your classes from one clean screen.",
    tasks: "Today tasks",
    tasksDesc: "Add tasks, set due times, and mark work done in one popup.",
    createExam: "Create exam",
    importExam: "Import Word/Excel",
    addQuestion: "Add question",
    openTasks: "open tasks",
    exams: "exams",
    questions: "questions",
    students: "students",
    grading: "to grade",
    focus: "Needs attention",
    resources: "Workspace",
    recentExams: "Recent exams",
    activity: "New submissions",
    deadlines: "Deadlines",
    noTasks: "No tasks yet. Add one small item to start the teaching day cleanly.",
    noActivity: "No new submissions.",
    noDeadlines: "No upcoming deadlines.",
    taskPlaceholder: "Example: Prepare 5 reading questions about Environment",
    notePlaceholder: "Short note, materials to prepare...",
    addTask: "Add task",
    normal: "Normal",
    high: "High priority",
    low: "Light",
    done: "Mark complete",
    reopen: "Reopen task",
    due: "Due"
  }
};

export default async function TeacherDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const t = copy[locale === "en" ? "en" : "vi"];
  const [classes, students, activeExams, grading, recentAttempts, tasks, exams, questionStats, upcomingAssignments] =
    await Promise.all([
      prisma.class.count({ where: { teacherId: teacher.id, archivedAt: null } }),
      prisma.classMembership.count({ where: { class: { teacherId: teacher.id } } }),
      prisma.examVersion.count({ where: { status: "PUBLISHED", exam: { createdById: teacher.id } } }),
      prisma.examAttempt.count({ where: { status: "GRADING", assignment: { exam: { createdById: teacher.id } } } }),
      prisma.examAttempt.findMany({
        where: { assignment: { exam: { createdById: teacher.id } }, submittedAt: { not: null } },
        include: { student: true, version: true },
        orderBy: { submittedAt: "desc" },
        take: 3
      }),
      prisma.teacherTask.findMany({
        where: { teacherId: teacher.id },
        orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        take: 10
      }),
      prisma.exam.findMany({
        where: { createdById: teacher.id },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
          _count: { select: { assignments: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 4
      }),
      prisma.questionBankItem.groupBy({
        by: ["skill"],
        where: { createdById: teacher.id },
        _count: { _all: true }
      }),
      prisma.examAssignment.findMany({
        where: { exam: { createdById: teacher.id }, version: { deadline: { not: null } } },
        include: { version: true, class: true },
        orderBy: { version: { deadline: "asc" } },
        take: 3
      })
    ]);
  const openTasks = tasks.filter((task) => !task.completedAt).length;
  const totalQuestions = questionStats.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm">
        <div className="grid gap-4 bg-[linear-gradient(135deg,#fff7ed_0%,#eef2ff_46%,#ecfeff_100%)] p-4 sm:p-5 xl:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-700">{t.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 sm:text-base">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <TaskModal locale={locale} t={t} tasks={tasks} openTasks={openTasks} />
            <AiExamModal locale={locale} />
            <CreateExamModal locale={locale} />
            <Button asChild variant="secondary">
              <Link href={`/${locale}/teacher/exams/import`}>
                <FileUp className="h-4 w-4" /> {t.importExam}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-5">
          <Metric label={t.openTasks} value={openTasks} />
          <Metric label={t.exams} value={activeExams} />
          <Metric label={t.questions} value={totalQuestions} />
          <Metric label={t.students} value={students} />
          <Metric label={t.grading} value={grading} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{t.focus}</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/${locale}/teacher/question-bank`}>
                <Sparkles className="h-4 w-4" /> {t.addQuestion}
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <FocusTile href={`/${locale}/teacher/grading`} icon={ClipboardCheck} title={t.grading} value={grading} tone="rose" />
            <FocusTile href={`/${locale}/teacher/exams`} icon={FolderOpen} title={t.exams} value={exams.length} tone="indigo" />
            <FocusTile href={`/${locale}/teacher/classes`} icon={Users} title={t.students} value={students} tone="emerald" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.resources}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href={`/${locale}/teacher/exams`} icon={BookOpen} label={t.exams} />
              <QuickLink href={`/${locale}/teacher/question-bank`} icon={Library} label={t.questions} />
              <QuickLink href={`/${locale}/teacher/classes`} icon={Users} label={`${classes} ${locale === "en" ? "classes" : "lớp"}`} />
              <QuickLink href={`/${locale}/teacher/exams/import`} icon={FileUp} label={t.importExam} />
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">
              {questionStats.length ? (
                questionStats.map((row) => (
                  <span key={row.skill} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                    <SkillBadge skill={row.skill} />
                    {row._count._all}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">{locale === "en" ? "No questions yet." : "Chưa có câu hỏi."}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.activity}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.length ? (
              recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{attempt.student.name}</p>
                    <p className="truncate text-xs text-slate-500">{attempt.version.title}</p>
                  </div>
                  <StatusBadge status={attempt.status} />
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">{t.noActivity}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.deadlines}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssignments.length ? (
              upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{assignment.version.title}</p>
                    <p className="text-xs text-slate-500">{assignment.class?.name ?? t.students} · {formatVietnamDateTime(assignment.version.deadline)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">{t.noDeadlines}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.recentExams}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.map((exam) => {
              const version = exam.versions[0];
              return (
                <Link key={exam.id} href={`/${locale}/teacher/exams/${exam.id}/builder`} className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{exam.title}</p>
                    {version ? <StatusBadge status={version.status} /> : null}
                  </div>
                  <p className="text-xs text-slate-500">{exam._count.assignments} {locale === "en" ? "assignments" : "lượt giao"} · {formatVietnamDate(exam.updatedAt)}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskModal({
  locale,
  t,
  tasks,
  openTasks
}: {
  locale: string;
  t: (typeof copy)["vi"];
  tasks: Awaited<ReturnType<typeof prisma.teacherTask.findMany>>;
  openTasks: number;
}) {
  return (
    <Modal
      title={t.tasks}
      description={t.tasksDesc}
      triggerLabel={t.tasks}
      triggerIcon="bell"
      triggerBadge={openTasks}
      triggerVariant="outline"
    >
      <div className="space-y-4">
        <form action={createTeacherTaskAction} className="grid gap-3 rounded-xl bg-slate-50 p-3">
          <input type="hidden" name="locale" value={locale} />
          <Input name="title" placeholder={t.taskPlaceholder} required />
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select name="priority" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium">
              <option value="MEDIUM">{t.normal}</option>
              <option value="HIGH">{t.high}</option>
              <option value="LOW">{t.low}</option>
            </select>
            <Input name="dueAt" type="datetime-local" aria-label={t.due} />
            <Button type="submit">{t.addTask}</Button>
          </div>
          <Textarea name="description" placeholder={t.notePlaceholder} className="min-h-16" />
        </form>

        <div className="space-y-2">
          {tasks.length ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <form action={toggleTeacherTaskAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <button
                    type="submit"
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border ${
                      task.completedAt ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-400"
                    }`}
                    aria-label={task.completedAt ? t.reopen : t.done}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-bold ${task.completedAt ? "text-slate-400 line-through" : "text-slate-950"}`}>{task.title}</p>
                    <PriorityBadge priority={task.priority} t={t} />
                  </div>
                  {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
                  {task.dueAt ? <p className="mt-2 text-xs font-bold text-slate-500">{t.due}: {formatVietnamDateTime(task.dueAt)}</p> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">{t.noTasks}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function FocusTile({
  href,
  icon: Icon,
  title,
  value,
  tone
}: {
  href: string;
  icon: typeof ClipboardCheck;
  title: string;
  value: number;
  tone: "rose" | "indigo" | "emerald";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-700",
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700"
  };
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof BookOpen; label: string }) {
  return (
    <Link href={href} className="flex min-h-20 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold hover:border-indigo-300 hover:bg-indigo-50">
      <Icon className="h-5 w-5 text-indigo-600" />
      <span>{label}</span>
    </Link>
  );
}

function PriorityBadge({ priority, t }: { priority: string; t: (typeof copy)["vi"] }) {
  const label = priority === "HIGH" ? t.high : priority === "LOW" ? t.low : t.normal;
  const className =
    priority === "HIGH"
      ? "bg-rose-100 text-rose-800"
      : priority === "LOW"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-900";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{label}</span>;
}
