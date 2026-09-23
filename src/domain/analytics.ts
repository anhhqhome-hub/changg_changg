import { toPercent } from "@/domain/scoring";

export type AnalyticsAttempt = {
  id: string;
  finalScore: number;
  totalPoints: number;
  submittedAt: Date | null;
  startedAt: Date;
  status: string;
  timeSpentSec?: number | null;
  skillScores: { skill: string; score: number; total: number }[];
  questionTypeScores: { questionType: string; score: number; total: number; tags: string[] }[];
};

export function calculateStudentOverview(attempts: AnalyticsAttempt[], assignedCount: number) {
  const completed = attempts.filter((attempt) => ["SUBMITTED", "GRADING", "GRADED", "AUTO_SUBMITTED"].includes(attempt.status));
  const graded = attempts.filter((attempt) => attempt.totalPoints > 0 && ["GRADED", "SUBMITTED"].includes(attempt.status));
  const averageScore =
    graded.length === 0
      ? 0
      : graded.reduce((sum, attempt) => sum + toPercent(attempt.finalScore, attempt.totalPoints), 0) / graded.length;
  const durations = completed.map((attempt) => attempt.timeSpentSec ?? 0).filter(Boolean);
  return {
    assignedCount,
    completedCount: completed.length,
    overdueCount: Math.max(0, assignedCount - completed.length),
    completionRate: assignedCount === 0 ? 0 : Number(((completed.length / assignedCount) * 100).toFixed(1)),
    averageScore: Number(averageScore.toFixed(1)),
    averageDurationSec: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
  };
}

export function calculateSkillPerformance(attempts: AnalyticsAttempt[]) {
  const totals = new Map<string, { score: number; total: number }>();
  for (const attempt of attempts) {
    for (const row of attempt.skillScores) {
      const current = totals.get(row.skill) ?? { score: 0, total: 0 };
      current.score += row.score;
      current.total += row.total;
      totals.set(row.skill, current);
    }
  }
  return ["LISTENING", "SPEAKING", "READING", "WRITING"].map((skill) => {
    const value = totals.get(skill) ?? { score: 0, total: 0 };
    return { skill, percent: toPercent(value.score, value.total), score: value.score, total: value.total };
  });
}

export function calculateScoreTrend(attempts: AnalyticsAttempt[]) {
  return attempts
    .filter((attempt) => attempt.submittedAt && attempt.totalPoints > 0)
    .sort((a, b) => Number(a.submittedAt) - Number(b.submittedAt))
    .map((attempt) => ({
      date: attempt.submittedAt!.toISOString().slice(0, 10),
      score: toPercent(attempt.finalScore, attempt.totalPoints)
    }));
}

export function calculateQuestionTypePerformance(attempts: AnalyticsAttempt[]) {
  const totals = new Map<string, { score: number; total: number }>();
  for (const attempt of attempts) {
    for (const row of attempt.questionTypeScores) {
      const current = totals.get(row.questionType) ?? { score: 0, total: 0 };
      current.score += row.score;
      current.total += row.total;
      totals.set(row.questionType, current);
    }
  }
  return [...totals.entries()].map(([questionType, value]) => ({
    questionType,
    percent: toPercent(value.score, value.total),
    score: value.score,
    total: value.total
  }));
}

export function calculateCommonMissedTags(attempts: AnalyticsAttempt[], minItems = 2) {
  const totals = new Map<string, { missed: number; total: number }>();
  for (const attempt of attempts) {
    for (const row of attempt.questionTypeScores) {
      for (const tag of row.tags) {
        const current = totals.get(tag) ?? { missed: 0, total: 0 };
        current.total += 1;
        if (row.total > 0 && row.score / row.total < 0.6) current.missed += 1;
        totals.set(tag, current);
      }
    }
  }
  return [...totals.entries()]
    .filter(([, value]) => value.total >= minItems)
    .map(([tag, value]) => ({ tag, missedRate: toPercent(value.missed, value.total), total: value.total }))
    .sort((a, b) => b.missedRate - a.missedRate);
}
