"use client";

import { Trash2 } from "lucide-react";
import { deleteExamAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";

export function DeleteExamButton({ locale, examId, label, confirmMessage }: { locale: string; examId: string; label: string; confirmMessage: string }) {
  return (
    <form action={deleteExamAction} onSubmit={(event) => {
      if (!window.confirm(confirmMessage)) event.preventDefault();
    }}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="examId" value={examId} />
      <Button type="submit" variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50">
        <Trash2 className="h-4 w-4" /> {label}
      </Button>
    </form>
  );
}

export const DeleteDraftExamButton = DeleteExamButton;
