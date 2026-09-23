import { describe, expect, it } from "vitest";
import { calculateQuestionTypePerformance, calculateSkillPerformance, calculateStudentOverview } from "@/domain/analytics";

const attempts = [
  {
    id: "a1",
    finalScore: 8,
    totalPoints: 10,
    submittedAt: new Date(),
    startedAt: new Date(),
    status: "GRADED",
    timeSpentSec: 600,
    skillScores: [{ skill: "READING", score: 4, total: 5 }],
    questionTypeScores: [{ questionType: "SINGLE_CHOICE", score: 4, total: 5, tags: ["school"] }]
  },
  {
    id: "a2",
    finalScore: 0,
    totalPoints: 0,
    submittedAt: null,
    startedAt: new Date(),
    status: "IN_PROGRESS",
    skillScores: [],
    questionTypeScores: []
  }
];

describe("analytics calculations", () => {
  it("handles assigned and completed counts", () => {
    expect(calculateStudentOverview(attempts, 4)).toMatchObject({ completedCount: 1, completionRate: 25, averageScore: 80 });
  });

  it("calculates skill performance without division by zero", () => {
    const skill = calculateSkillPerformance(attempts).find((row) => row.skill === "SPEAKING");
    expect(skill?.percent).toBe(0);
  });

  it("aggregates question type performance", () => {
    expect(calculateQuestionTypePerformance(attempts)[0]).toMatchObject({ questionType: "SINGLE_CHOICE", percent: 80 });
  });
});
