import { normalizeFillBlank, type AnswerPayload } from "@/domain/answers";
import { parseJson } from "@/lib/utils";

export type GradeableQuestion = {
  id: string;
  questionType: string;
  points: number;
  correctAnswersJson?: string | null;
  settingsJson?: string | null;
  options?: { id: string; isCorrect: boolean }[];
};

export function isManualQuestion(questionType: string) {
  return questionType === "ESSAY" || questionType === "SPEAKING_RECORDING" || questionType === "SHORT_ANSWER";
}

export function gradeObjectiveAnswer(question: GradeableQuestion, answer: AnswerPayload) {
  if (isManualQuestion(question.questionType)) return null;

  if (
    question.questionType === "SINGLE_CHOICE" ||
    question.questionType === "TRUE_FALSE" ||
    question.questionType === "LISTENING_CHOICE" ||
    question.questionType === "READING_SINGLE_CHOICE"
  ) {
    const correct = question.options?.filter((option) => option.isCorrect).map((option) => option.id) ?? [];
    const selected = answer.selectedOptionIds ?? [];
    return selected.length === 1 && correct.length === 1 && selected[0] === correct[0] ? question.points : 0;
  }

  if (question.questionType === "MULTIPLE_CHOICE" || question.questionType === "READING_MULTIPLE_CHOICE") {
    const correct = new Set(question.options?.filter((option) => option.isCorrect).map((option) => option.id) ?? []);
    const selected = new Set(answer.selectedOptionIds ?? []);
    if (correct.size === 0 || selected.size !== correct.size) return 0;
    return [...correct].every((id) => selected.has(id)) ? question.points : 0;
  }

  if (question.questionType === "FILL_BLANK" || question.questionType === "LISTENING_FILL_BLANK") {
    const settings = parseJson<{ caseSensitive?: boolean; trimWhitespace?: boolean }>(question.settingsJson, {});
    const accepted = parseJson<string[][]>(question.correctAnswersJson, []);
    const blanks = answer.blankAnswers ?? [];
    if (!accepted.length || blanks.length < accepted.length) return 0;
    const perBlank = question.points / accepted.length;
    return accepted.reduce((score, acceptedForBlank, index) => {
      const actual = normalizeFillBlank(blanks[index] ?? "", settings.trimWhitespace ?? true, settings.caseSensitive ?? false);
      const matches = acceptedForBlank.some(
        (expected) =>
          normalizeFillBlank(expected, settings.trimWhitespace ?? true, settings.caseSensitive ?? false) === actual
      );
      return score + (matches ? perBlank : 0);
    }, 0);
  }

  if (question.questionType === "ORDERING") {
    const correct = parseJson<string[]>(question.correctAnswersJson, []);
    const actual = answer.orderingAnswers ?? [];
    return correct.length && correct.length === actual.length && correct.every((id, index) => actual[index] === id)
      ? question.points
      : 0;
  }

  if (question.questionType === "MATCHING") {
    const correct = parseJson<Record<string, string>>(question.correctAnswersJson, {});
    const actual = answer.matchingAnswers ?? {};
    const entries = Object.entries(correct);
    if (!entries.length) return 0;
    const perPair = question.points / entries.length;
    return entries.reduce((score, [left, right]) => score + (actual[left] === right ? perPair : 0), 0);
  }

  return null;
}
