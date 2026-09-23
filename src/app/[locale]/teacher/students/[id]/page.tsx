import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StudentPerformanceChart } from "@/components/analytics/student-performance-chart";
import { AvatarBadge } from "@/components/app/avatar-badge";
import { ScoreCard } from "@/components/app/score-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { calculateCommonMissedTags, calculateQuestionTypePerformance, calculateScoreTrend, calculateSkillPerformance, calculateStudentOverview, type AnalyticsAttempt } from "@/domain/analytics";
import { formatVietnamDate } from "@/lib/date";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { parseJson } from "@/lib/utils";

export default async function StudentAnalyticsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const teacher = await requireRole("TEACHER", locale);
  const isEn = locale === "en";
  const student = await prisma.user.findFirstOrThrow({
    where: { id, memberships: { some: { class: { teacherId: teacher.id } } } },
    include: {
      studentProfile: true,
      memberships: { where: { class: { teacherId: teacher.id } }, include: { class: true } }
    }
  });
  const assignedCount = await prisma.examAssignment.count({
    where: { OR: [{ studentId: id }, { class: { memberships: { some: { studentId: id } } } }], exam: { createdById: teacher.id } }
  });
  const attempts = await prisma.examAttempt.findMany({
    where: { studentId: id, assignment: { exam: { createdById: teacher.id } } },
    include: {
      answers: { include: { question: true } }
    },
    orderBy: { startedAt: "asc" }
  });
  const analyticsAttempts: AnalyticsAttempt[] = attempts.map((attempt) => {
    const skillScores = new Map<string, { score: number; total: number }>();
    const typeScores = attempt.answers.map((answer) => {
      const score = answer.score ?? 0;
      const total = answer.question.points;
      const skill = skillScores.get(answer.question.skill) ?? { score: 0, total: 0 };
      skill.score += score;
      skill.total += total;
      skillScores.set(answer.question.skill, skill);
      return { questionType: answer.question.questionType, score, total, tags: parseJson<string[]>(answer.question.tagsJson, []) };
    });
    return {
      id: attempt.id,
      finalScore: attempt.finalScore,
      totalPoints: attempt.totalPoints,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      status: attempt.status,
      timeSpentSec: attempt.timeSpentSec,
      skillScores: [...skillScores.entries()].map(([skill, value]) => ({ skill, ...value })),
      questionTypeScores: typeScores
    };
  });
  const overview = calculateStudentOverview(analyticsAttempts, assignedCount);
  const skills = calculateSkillPerformance(analyticsAttempts);
  const trend = calculateScoreTrend(analyticsAttempts);
  const types = calculateQuestionTypePerformance(analyticsAttempts);
  const missed = calculateCommonMissedTags(analyticsAttempts);

  const text = isEn
    ? {
        back: "All students",
        noSchool: "Student",
        averageScore: "Average score",
        completionRate: "Completion rate",
        assignedExams: "Assigned exams",
        completed: "Completed",
        emptyTitle: "No attempts yet",
        emptyBody: "Analytics will appear after the student submits work.",
        recentResults: "Recent results",
        missedTags: "Commonly missed tags",
        notEnoughData: "Not enough data yet."
      }
    : {
        back: "Tất cả học viên",
        noSchool: "Học viên",
        averageScore: "Điểm trung bình",
        completionRate: "Tỉ lệ hoàn thành",
        assignedExams: "Đề đã giao",
        completed: "Đã hoàn thành",
        emptyTitle: "Chưa có lượt làm bài",
        emptyBody: "Số liệu sẽ hiện ra sau khi học viên nộp bài.",
        recentResults: "Kết quả gần đây",
        missedTags: "Chủ đề hay sai nhất",
        notEnoughData: "Chưa đủ dữ liệu."
      };

  return (
    <div className="space-y-5">
      <Link href={`/${locale}/teacher/students`} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-700">
        <ArrowLeft className="h-4 w-4" /> {text.back}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <AvatarBadge name={student.name} className="h-14 w-14 text-lg" />
          <div>
            <h1 className="text-2xl font-black text-slate-950">{student.name}</h1>
            <p className="text-sm font-medium text-slate-600">{student.studentProfile?.schoolName ?? text.noSchool} · {student.email}</p>
          </div>
        </div>
        {student.memberships.length ? (
          <div className="flex flex-wrap gap-1.5">
            {student.memberships.map((membership) => (
              <Badge key={membership.id} tone="indigo">{membership.class.name}</Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label={text.averageScore} value={`${overview.averageScore}%`} />
        <ScoreCard label={text.completionRate} value={`${overview.completionRate}%`} />
        <ScoreCard label={text.assignedExams} value={overview.assignedCount} />
        <ScoreCard label={text.completed} value={overview.completedCount} />
      </div>
      {attempts.length === 0 ? (
        <EmptyState title={text.emptyTitle} body={text.emptyBody} />
      ) : (
        <StudentPerformanceChart skillData={skills} trendData={trend} typeData={types} />
      )}
      <Card>
        <CardHeader><CardTitle>{text.recentResults}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {attempts.slice(-6).reverse().map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
              <span>{formatVietnamDate(attempt.submittedAt ?? attempt.startedAt)}</span>
              <span className="font-semibold">{attempt.finalScore} / {attempt.totalPoints}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{text.missedTags}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {missed.length ? missed.map((tag) => <span key={tag.tag} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{tag.tag} · {tag.missedRate}%</span>) : <span className="text-sm text-slate-500">{text.notEnoughData}</span>}
        </CardContent>
      </Card>
    </div>
  );
}
