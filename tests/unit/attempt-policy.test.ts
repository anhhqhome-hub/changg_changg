import { describe, expect, it } from "vitest";
import { canStartAttempt } from "../../src/domain/attempt-policy";

describe("attempt policy", () => {
  it("allows unlimited practice attempts", () => {
    expect(canStartAttempt({ mode: "PRACTICE", attemptCount: 0, attemptsAllowed: 1 })).toBe(true);
    expect(canStartAttempt({ mode: "PRACTICE", attemptCount: 1000, attemptsAllowed: 1 })).toBe(true);
  });

  it("enforces the configured test attempt limit", () => {
    expect(canStartAttempt({ mode: "TEST", attemptCount: 0, attemptsAllowed: 1 })).toBe(true);
    expect(canStartAttempt({ mode: "TEST", attemptCount: 1, attemptsAllowed: 1 })).toBe(false);
    expect(canStartAttempt({ mode: "TEST", attemptCount: 2, attemptsAllowed: 3 })).toBe(true);
    expect(canStartAttempt({ mode: "TEST", attemptCount: 3, attemptsAllowed: 3 })).toBe(false);
  });
});
