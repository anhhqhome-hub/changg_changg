import type { GradeableQuestion } from "@/domain/grading";

export function calculateTotalPoints(questions: Pick<GradeableQuestion, "points">[]) {
  return questions.reduce((sum, question) => sum + question.points, 0);
}

export function calculateFinalScore({
  autoScore,
  manualScore
}: {
  autoScore: number;
  manualScore: number;
}) {
  return Number((autoScore + manualScore).toFixed(2));
}

export function toPercent(score: number, total: number) {
  if (total <= 0) return 0;
  return Number(((score / total) * 100).toFixed(1));
}
