"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Send, X } from "lucide-react";
import type { AssignExamActionState } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";

type Target = { id: string; name: string };

export function AssignExamModal({
  action,
  locale,
  examId,
  versionId,
  examTitle,
  classes,
  students,
  defaultTimeLimitMinutes,
  defaultDeadlineLocalValue,
  text
}: {
  action: (state: AssignExamActionState, formData: FormData) => AssignExamActionState | Promise<AssignExamActionState>;
  locale: string;
  examId: string;
  versionId: string;
  examTitle: string;
  classes: Target[];
  students: Target[];
  defaultTimeLimitMinutes?: number | null;
  defaultDeadlineLocalValue?: string;
  text: {
    open: string;
    title: string;
    description: string;
    targetLabel: string;
    targetClass: string;
    targetStudent: string;
    classLabel: string;
    studentLabel: string;
    classPlaceholder: string;
    studentPlaceholder: string;
    chooseTarget: string;
    timeLimit: string;
    deadline: string;
    timingHint: string;
    errorClassEmpty: string;
    errorStudentUnavailable: string;
    errorNoQuestions: string;
    errorNotAssignable: string;
    success: string;
    submit: string;
    submitting: string;
    cancel: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<"class" | "student">("class");
  const [targetError, setTargetError] = useState("");
  const [state, formAction] = useActionState<AssignExamActionState, FormData>(action, {});
  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> {text.open}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="assign-exam-title">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="assign-exam-title" className="text-xl font-black text-slate-950">{text.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{text.description} <strong>{examTitle}</strong></p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={text.cancel}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          action={formAction}
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            const form = event.currentTarget;
            const selected = form.elements.namedItem(target === "class" ? "classId" : "studentId");
            if (!(selected instanceof HTMLSelectElement) || !selected.value) {
              event.preventDefault();
              setTargetError(text.chooseTarget);
            }
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="examId" value={examId} />
          <input type="hidden" name="versionId" value={versionId} />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">{text.targetLabel}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${target === "class" ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200"}`}>
                <input type="radio" name="targetType" value="class" checked={target === "class"} onChange={() => { setTarget("class"); setTargetError(""); }} className="mr-2 accent-indigo-600" />
                {text.targetClass}
              </label>
              <label className={`cursor-pointer rounded-xl border p-3 text-sm font-bold ${target === "student" ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200"}`}>
                <input type="radio" name="targetType" value="student" checked={target === "student"} onChange={() => { setTarget("student"); setTargetError(""); }} className="mr-2 accent-indigo-600" />
                {text.targetStudent}
              </label>
            </div>
          </fieldset>
          {target === "class" ? (
            <label className="grid gap-1 text-sm font-bold">
              {text.classLabel}
              <select name="classId" defaultValue="" required className="h-11 rounded-md border border-slate-300 bg-white px-3">
                <option value="">{text.classPlaceholder}</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : (
            <label className="grid gap-1 text-sm font-bold">
              {text.studentLabel}
              <select name="studentId" defaultValue="" required className="h-11 rounded-md border border-slate-300 bg-white px-3">
                <option value="">{text.studentPlaceholder}</option>
                {students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">
              {text.timeLimit}
              <input
                name="timeLimitMinutes"
                type="number"
                min="1"
                max="1440"
                defaultValue={defaultTimeLimitMinutes ?? ""}
                placeholder="45"
                className="h-11 rounded-md border border-slate-300 bg-white px-3"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              {text.deadline}
              <input
                name="deadline"
                type="datetime-local"
                defaultValue={defaultDeadlineLocalValue ?? ""}
                className="h-11 rounded-md border border-slate-300 bg-white px-3"
              />
            </label>
            <p className="text-[11px] leading-4 text-slate-500 sm:col-span-2">{text.timingHint}</p>
          </div>
          {targetError ? <p className="text-sm font-bold text-red-700" role="alert">{targetError}</p> : null}
          {state.error ? (
            <p className="text-sm font-bold text-red-700" role="alert">
              {state.error === "CLASS_HAS_NO_STUDENTS" ? text.errorClassEmpty : state.error === "STUDENT_NOT_AVAILABLE" ? text.errorStudentUnavailable : state.error === "EXAM_NEEDS_QUESTIONS" ? text.errorNoQuestions : state.error === "EXAM_NOT_ASSIGNABLE" ? text.errorNotAssignable : text.chooseTarget}
            </p>
          ) : null}
          {state.success ? <p className="text-sm font-bold text-emerald-700" role="status">{text.success}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{text.cancel}</Button>
            <SubmitButton label={text.submit} pendingLabel={text.submitting} />
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? pendingLabel : label}</Button>;
}
