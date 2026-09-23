export function calculateAttemptExpiresAt({
  startedAt,
  timeLimitMinutes,
  deadline
}: {
  startedAt: Date;
  timeLimitMinutes?: number | null;
  deadline?: Date | null;
}) {
  const candidates: Date[] = [];
  if (timeLimitMinutes && timeLimitMinutes > 0) {
    candidates.push(new Date(startedAt.getTime() + timeLimitMinutes * 60_000));
  }
  if (deadline) candidates.push(deadline);
  if (candidates.length === 0) return null;
  return candidates.reduce((earliest, current) => (current < earliest ? current : earliest));
}

export function isAttemptExpired(expiresAt: Date | null | undefined, now = new Date()) {
  return Boolean(expiresAt && now >= expiresAt);
}

export function deriveSubmittedStatus({
  hasManualQuestions,
  expired
}: {
  hasManualQuestions: boolean;
  expired: boolean;
}) {
  if (expired) return "AUTO_SUBMITTED" as const;
  return hasManualQuestions ? ("GRADING" as const) : ("GRADED" as const);
}
