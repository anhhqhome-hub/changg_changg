"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublishBeforeAssignModal({
  locale,
  examId,
  examTitle,
  action,
  title,
  description,
  cancel,
  publish,
  publishing
}: {
  locale: string;
  examId: string;
  examTitle: string;
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description: string;
  cancel: string;
  publish: string;
  publishing: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-before-assign-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <a href={`/${locale}/teacher/exams/${examId}/builder`} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={cancel}>
            <X className="h-5 w-5" />
          </a>
        </div>
        <h2 id="publish-before-assign-title" className="mt-4 text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description} <span className="font-bold text-slate-800">{examTitle}</span>
        </p>
        <form action={action} className="mt-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="examId" value={examId} />
          <PublishButton label={publish} pendingLabel={publishing} />
        </form>
        <a href={`/${locale}/teacher/exams/${examId}/builder`} className="mt-3 block text-center text-sm font-bold text-slate-500 hover:text-slate-800">
          {cancel}
        </a>
      </div>
    </div>
  );
}

function PublishButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
