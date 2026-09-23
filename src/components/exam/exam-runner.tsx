"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExamTimer } from "@/components/exam/exam-timer";
import { QuestionNavigator } from "@/components/exam/question-navigator";
import { QuestionRenderer, type RunnerAnswer, type RunnerQuestion } from "@/components/exam/question-renderer";
import { SaveIndicator } from "@/components/exam/save-indicator";
import { Button } from "@/components/ui/button";

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
  sections,
  initialAnswers
}: {
  locale: string;
  attemptId: string;
  expiresAt: string | null;
  title: string;
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

  const answered = new Set(questions.map((question, index) => (hasAnswer(answers[question.id]) ? index : -1)).filter((index) => index >= 0));
  const flagged = new Set(questions.map((question, index) => (answers[question.id]?.isFlagged ? index : -1)).filter((index) => index >= 0));
  const group = sections.flatMap((section) => section.groups).find((candidate) => candidate.questions.some((question) => question.id === currentQuestion.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-700">changg changg exam</p>
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
              <h2 className="text-lg font-bold">{group.readingPassage.title}</h2>
              {group.readingPassage.instructions ? <p className="mt-1 text-sm text-slate-600">{group.readingPassage.instructions}</p> : null}
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-800">{group.readingPassage.body}</p>
            </article>
          ) : null}
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-indigo-700">Question {current + 1} of {questions.length}</p>
                <h2 className="text-xl font-bold text-slate-950">{currentQuestion.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-800">{currentQuestion.prompt}</p>
                {currentQuestion.instructions ? <p className="mt-2 text-sm text-slate-600">{currentQuestion.instructions}</p> : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => update({ ...(answers[currentQuestion.id] ?? {}), isFlagged: !answers[currentQuestion.id]?.isFlagged })}>
                <Flag className="h-4 w-4" /> Flag
              </Button>
            </div>
            <QuestionRenderer question={currentQuestion} answer={answers[currentQuestion.id] ?? {}} onChange={update} />
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
