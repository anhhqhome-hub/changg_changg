import { describe, expect, it } from "vitest";
import { calculateAttemptExpiresAt, deriveSubmittedStatus, isAttemptExpired } from "@/domain/exam-timing";

describe("exam timing", () => {
  it("uses the earliest of time limit and deadline", () => {
    const startedAt = new Date("2026-01-01T08:00:00.000Z");
    const deadline = new Date("2026-01-01T08:30:00.000Z");
    expect(calculateAttemptExpiresAt({ startedAt, timeLimitMinutes: 60, deadline })?.toISOString()).toBe("2026-01-01T08:30:00.000Z");
  });

  it("detects expired attempts on server time", () => {
    expect(isAttemptExpired(new Date("2026-01-01T08:00:00.000Z"), new Date("2026-01-01T08:00:00.000Z"))).toBe(true);
  });

  it("routes manual submissions into grading", () => {
    expect(deriveSubmittedStatus({ hasManualQuestions: true, expired: false })).toBe("GRADING");
    expect(deriveSubmittedStatus({ hasManualQuestions: false, expired: false })).toBe("GRADED");
  });
});
