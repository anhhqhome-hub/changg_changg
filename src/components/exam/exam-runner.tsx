"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionNavigator } from "@/components/exam/question-navigator";
import { QuestionRenderer, type RunnerAnswer, type RunnerQuestion } from "@/components/exam/question-renderer";
import { SaveIndicator } from "@/components/exam/save-indicator";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/ui/rich-text";
import { normalizeFillBlank } from "@/domain/answers";

export type RunnerSection = {
  id: string;
  title: string;
  skill: string;
  groups: {
    id: string;
    title: string | null;
    instructions: string | null;
    mediaAssetId: string | null;
    readingPassage: { title: string; body: string; instructions: string | null } | null;
    questions: RunnerQuestion[];
  }[];
};

export function ExamRunner({
  locale,
  attemptId,
  expiresAt,
  title,
  isPractice,
  sections,
  initialAnswers
}: {
  locale: string;
  attemptId: string;
  expiresAt: string | null;
  title: string;
  isPractice: boolean;
  sections: RunnerSection[];
  initialAnswers: Record<string, RunnerAnswer>;
}) {
  const router = useRouter();
  const questions = useMemo(() => sections.flatMap((section) => section.groups.flatMap((group) => group.questions)), [sections]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline" | "error">("saved");
  const pending = useRef<Map<string, RunnerAnswer>>(new Map());
  const currentQuestion = questions[current];

  const save = useCallback(
    async (questionId: string, answer: RunnerAnswer) => {
      setSaveState(navigator.onLine ? "saving" : "offline");
      pending.current.set(questionId, answer);
      try {
        const response = await fetch(`/api/attempts/${attemptId}/answers`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ questionId, ...answer, clientUpdatedAt: new Date().toISOString() })
        });
        if (!response.ok) throw new Error("save failed");
        pending.current.delete(questionId);
        setSaveState("saved");
      } catch {
        setSaveState(navigator.onLine ? "error" : "offline");
      }
    },
    [attemptId]
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      for (const [questionId, answer] of pending.current) void save(questionId, answer);
    }, 4000);
    const online = () => setSaveState("saved");
    const offline = () => setSaveState("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [save]);

  function update(answer: RunnerAnswer) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    window.clearTimeout((update as unknown as { timer?: number }).timer);
    (update as unknown as { timer?: number }).timer = window.setTimeout(() => void save(currentQuestion.id, answer), 600);
  }

  async function submit() {
    if (!window.confirm("Nộp bài ngay bây giờ?")) return;
    setSaveState("saving");
    await Promise.all([...pending.current].map(([questionId, answer]) => save(questionId, answer)));
    const response = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    if (response.ok) router.push(`/${locale}/student/results/${attemptId}`);
    else setSaveState("error");
  }

  if (!currentQuestion) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-5"><div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950"><h1 className="text-xl font-black">{locale === "vi" ? "Đề chưa có câu hỏi" : "This exam has no questions"}</h1><p className="mt-2 text-sm">{locale === "vi" ? "Hãy quay lại và báo cho giáo viên để bổ sung đề bài." : "Return and ask your teacher to add questions."}</p></div></div>;
  }

  const answered = new Set(questions.map((question, index) => (hasAnswer(answers[question.id]) ? index : -1)).filter((index) => index >= 0));
  const flagged = new Set(questions.map((question, index) => (answers[question.id]?.isFlagged ? index : -1)).filter((index) => index >= 0));
  const group = sections.flatMap((section) => section.groups).find((candidate) => candidate.questions.some((question) => question.id === currentQuestion.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-700">The Folio exam</p>
            <h1 className="text-lg font-bold text-slate-950">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator state={saveState} />
            <ExamTimer expiresAt={expiresAt} onExpire={() => void submit()} />
            <Button type="button" onClick={submit}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[1fr_260px]">
        <section className="space-y-5">
          {group?.mediaAssetId ? (
            <audio src={`/api/media/${group.mediaAssetId}`} controls className="w-full" aria-label="Listening audio" />
          ) : null}
          {group?.readingPassage ? (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <RichText value={group.readingPassage.title} className="block text-lg font-bold" />
              {group.readingPassage.instructions ? <RichText value={group.readingPassage.instructions} className="mt-1 block text-sm text-slate-600" /> : null}
              <RichText value={group.readingPassage.body} className="mt-4 block leading-7 text-slate-800" />
            </article>
          ) : null}
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-700">Question {current + 1} of {questions.length}</p>
                <RichText value={currentQuestion.title} className="block text-xl font-bold text-slate-950" />
                <RichText value={currentQuestion.prompt} className="mt-2 block text-slate-800" />
                {currentQuestion.instructions ? <RichText value={currentQuestion.instructions} className="mt-2 block text-sm text-slate-600" /> : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => update({ ...(answers[currentQuestion.id] ?? {}), isFlagged: !answers[currentQuestion.id]?.isFlagged })}>
                <Flag className="h-4 w-4" /> Flag
              </Button>
            </div>
            <QuestionRenderer question={currentQuestion} answer={answers[currentQuestion.id] ?? {}} onChange={update} />
            {isPractice && hasAnswer(answers[currentQuestion.id]) ? <PracticeFeedback question={currentQuestion} answer={answers[currentQuestion.id] ?? {}} locale={locale} /> : null}
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
                <ArrowLeft className="h-4 w-4" /> {locale === "vi" ? "Câu trước" : "Previous"}
              </Button>
              <Button type="button" variant="secondary" disabled={current === questions.length - 1} onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>
                {locale === "vi" ? "Câu tiếp" : "Next"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </article>
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <QuestionNavigator current={current} total={questions.length} answered={answered} flagged={flagged} onSelect={setCurrent} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={current === 0} onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
              Previous
            </Button>
            <Button type="button" variant="secondary" disabled={current === questions.length - 1} onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>
              Next
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function hasAnswer(answer: RunnerAnswer | undefined) {
  return Boolean(
    answer?.textAnswer ||
      answer?.audioAssetId ||
      answer?.selectedOptionIds?.length ||
      answer?.blankAnswers?.some(Boolean) ||
      answer?.orderingAnswers?.length ||
      Object.keys(answer?.matchingAnswers ?? {}).length
  );
}

function PracticeFeedback({ question, answer, locale }: { question: RunnerQuestion; answer: RunnerAnswer; locale: string }) {
  const correctOptions = question.options.filter((option) => option.isCorrect);
  const selected = new Set(answer.selectedOptionIds ?? []);
  const result = practiceResult(question, answer, selected);
  if (result === "manual") return <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-black text-slate-700">{locale === "vi" ? "Câu này chờ giáo viên chấm" : "This question will be graded by the teacher"}</div>;
  return <div className={`mt-4 rounded-lg border p-3 text-sm font-black ${result ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{result ? (locale === "vi" ? "ĐÚNG" : "CORRECT") : (locale === "vi" ? "SAI" : "INCORRECT")}</div>;
}

function practiceResult(question: RunnerQuestion, answer: RunnerAnswer, selected: Set<string>): boolean | "manual" {
  if (["ESSAY", "SHORT_ANSWER", "SPEAKING_RECORDING"].includes(question.questionType)) return "manual";
  if (question.options.some((option) => option.isCorrect)) {
    const correct = question.options.filter((option) => option.isCorrect);
    return selected.size === correct.length && correct.every((option) => selected.has(option.id));
  }
  if (!question.correctAnswersJson) return false;
  try {
    const expected: unknown = JSON.parse(question.correctAnswersJson);
    if (question.questionType.includes("FILL_BLANK")) {
      const answers = answer.blankAnswers ?? [];
      if (!Array.isArray(expected) || answers.length < expected.length) return false;
      return expected.every((acceptedForBlank, index) => {
        const accepted = Array.isArray(acceptedForBlank) ? acceptedForBlank : [acceptedForBlank];
        const actual = normalizeFillBlank(answers[index] ?? "");
        return accepted.some((item) => normalizeFillBlank(String(item)) === actual);
      });
    }
    if (question.questionType === "ORDERING") return JSON.stringify(answer.orderingAnswers ?? []) === JSON.stringify(expected);
    if (question.questionType === "MATCHING") return JSON.stringify(answer.matchingAnswers ?? {}) === JSON.stringify(expected);
  } catch {
    return false;
  }
  return false;
}
