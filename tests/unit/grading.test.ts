import { describe, expect, it } from "vitest";
import { normalizeFillBlank } from "@/domain/answers";
import { gradeObjectiveAnswer } from "@/domain/grading";

describe("automatic grading", () => {
  it("grades single choice", () => {
    const score = gradeObjectiveAnswer(
      { id: "q1", questionType: "SINGLE_CHOICE", points: 2, options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: false }] },
      { selectedOptionIds: ["a"] }
    );
    expect(score).toBe(2);
  });

  it("requires exact set for multiple choice", () => {
    const question = {
      id: "q1",
      questionType: "MULTIPLE_CHOICE",
      points: 3,
      options: [
        { id: "a", isCorrect: true },
        { id: "b", isCorrect: true },
        { id: "c", isCorrect: false }
      ]
    };
    expect(gradeObjectiveAnswer(question, { selectedOptionIds: ["a", "b"] })).toBe(3);
    expect(gradeObjectiveAnswer(question, { selectedOptionIds: ["a"] })).toBe(0);
  });

  it("normalizes fill blank answers", () => {
    expect(normalizeFillBlank("  Watch   videos ")).toBe("watch videos");
    expect(
      gradeObjectiveAnswer(
        {
          id: "q1",
          questionType: "FILL_BLANK",
          points: 1,
          correctAnswersJson: JSON.stringify([["watch", "view"]]),
          settingsJson: JSON.stringify({ caseSensitive: false, trimWhitespace: true })
        },
        { blankAnswers: [" Watch "] }
      )
    ).toBe(1);
  });
});
