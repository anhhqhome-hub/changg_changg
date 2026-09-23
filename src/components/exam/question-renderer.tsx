"use client";

import { AudioRecorder } from "@/components/exam/audio-recorder";
import { Textarea } from "@/components/ui/textarea";

export type RunnerQuestion = {
  id: string;
  title: string;
  prompt: string;
  instructions: string | null;
  questionType: string;
  points: number;
  options: { id: string; label: string; value: string }[];
};

export type RunnerAnswer = {
  selectedOptionIds?: string[];
  textAnswer?: string;
  blankAnswers?: string[];
  matchingAnswers?: Record<string, string>;
  orderingAnswers?: string[];
  audioAssetId?: string;
  isFlagged?: boolean;
};

export function QuestionRenderer({
  question,
  answer,
  onChange
}: {
  question: RunnerQuestion;
  answer: RunnerAnswer;
  onChange: (answer: RunnerAnswer) => void;
}) {
  const selected = answer.selectedOptionIds ?? [];
  const isMultiple = question.questionType.includes("MULTIPLE");

  if (question.questionType === "ESSAY" || question.questionType === "SHORT_ANSWER") {
    const words = (answer.textAnswer ?? "").trim().split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-3">
        <Textarea
          aria-label={question.title}
          value={answer.textAnswer ?? ""}
          onChange={(event) => onChange({ ...answer, textAnswer: event.target.value })}
          placeholder="Type your answer"
          className="min-h-56"
        />
        <p className="text-sm text-slate-600">{words} words</p>
      </div>
    );
  }

  if (question.questionType === "FILL_BLANK" || question.questionType === "LISTENING_FILL_BLANK") {
    const blanks = answer.blankAnswers ?? [""];
    return (
      <div className="grid gap-3">
        {blanks.map((blank, index) => (
          <input
            key={index}
            aria-label={`Blank ${index + 1}`}
            className="h-11 rounded-md border border-slate-300 px-3"
            value={blank}
            onChange={(event) => {
              const next = [...blanks];
              next[index] = event.target.value;
              onChange({ ...answer, blankAnswers: next });
            }}
          />
        ))}
        <button
          type="button"
          className="w-fit text-sm font-semibold text-indigo-700"
          onClick={() => onChange({ ...answer, blankAnswers: [...blanks, ""] })}
        >
          Add blank
        </button>
      </div>
    );
  }

  if (question.questionType === "SPEAKING_RECORDING") {
    return <AudioRecorder onUploaded={(audioAssetId) => onChange({ ...answer, audioAssetId })} />;
  }

  if (question.questionType === "ORDERING") {
    const order = answer.orderingAnswers ?? question.options.map((option) => option.id);
    return (
      <div className="space-y-2">
        {order.map((id, index) => {
          const option = question.options.find((item) => item.id === id);
          return (
            <div key={id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2">
              <span className="w-8 text-center font-bold">{index + 1}</span>
              <span className="flex-1">{option?.label ?? id}</span>
              <button type="button" className="px-2 text-sm font-semibold" onClick={() => move(order, index, -1, (next) => onChange({ ...answer, orderingAnswers: next }))}>
                Up
              </button>
              <button type="button" className="px-2 text-sm font-semibold" onClick={() => move(order, index, 1, (next) => onChange({ ...answer, orderingAnswers: next }))}>
                Down
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {question.options.map((option) => (
        <label key={option.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={question.id}
            checked={selected.includes(option.id)}
            onChange={(event) => {
              const next = isMultiple
                ? event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((id) => id !== option.id)
                : [option.id];
              onChange({ ...answer, selectedOptionIds: next });
            }}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function move(items: string[], index: number, delta: number, onMoved: (items: string[]) => void) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  onMoved(next);
}
