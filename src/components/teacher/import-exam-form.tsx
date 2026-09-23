"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Bot, CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".docx", ".xlsx", ".xls", ".csv"];

type ImportExamFormProps = {
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  text: {
    name: string;
    titlePlaceholder: string;
    choose: string;
    limit: string;
    aiReview: string;
    submit: string;
    submitting: string;
    noFile: string;
    invalidFile: string;
    fileTooLarge: string;
  };
};

export function ImportExamForm({ locale, action, text }: ImportExamFormProps) {
  const [fileMessage, setFileMessage] = useState("");
  const [fileName, setFileName] = useState("");

  function validateFile(file: File | undefined) {
    if (!file) {
      setFileName("");
      setFileMessage(text.noFile);
      return false;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileName("");
      setFileMessage(text.invalidFile);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileName("");
      setFileMessage(text.fileTooLarge);
      return false;
    }

    setFileName(file.name);
    setFileMessage("");
    return true;
  }

  return (
    <form
      action={action}
      className="grid gap-4"
      onSubmit={(event) => {
        const file = event.currentTarget.elements.namedItem("file");
        if (!(file instanceof HTMLInputElement) || !validateFile(file.files?.[0])) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-1 text-sm font-bold" htmlFor="exam-title">
        {text.name}
        <Input id="exam-title" name="title" placeholder={text.titlePlaceholder} maxLength={160} required />
      </label>
      <label className="grid gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 p-5 text-center" htmlFor="exam-file">
        <UploadCloud className="mx-auto h-9 w-9 text-indigo-600" aria-hidden="true" />
        <span className="font-black text-slate-900">{text.choose}</span>
        <span className="text-sm text-slate-600">{text.limit}</span>
        <Input
          id="exam-file"
          name="file"
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          required
          className="mt-3 cursor-pointer border-indigo-200 bg-white file:mr-3 file:rounded-md file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-indigo-700"
          onChange={(event) => validateFile(event.currentTarget.files?.[0])}
          aria-describedby={fileMessage ? "exam-file-message" : undefined}
        />
        {fileName ? <span className="truncate text-sm font-bold text-emerald-700">{fileName}</span> : null}
        {fileMessage ? (
          <span id="exam-file-message" className="text-sm font-bold text-red-700" role="alert">
            {fileMessage}
          </span>
        ) : null}
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-slate-800">
        <input name="aiReview" type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" defaultChecked />
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-600" aria-hidden="true" /> {text.aiReview}
          </span>
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton label={text.submit} pendingLabel={text.submitting} />
      </div>
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {pending ? pendingLabel : label}
    </Button>
  );
}
