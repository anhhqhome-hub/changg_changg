export type AttemptMode = "TEST" | "PRACTICE";

export function canStartAttempt(input: {
  mode: AttemptMode;
  attemptCount: number;
  attemptsAllowed: number;
}) {
  if (input.mode === "PRACTICE") return true;
  return input.attemptCount < Math.max(1, input.attemptsAllowed);
}
