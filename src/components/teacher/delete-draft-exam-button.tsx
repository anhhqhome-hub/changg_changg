"use client";

import { Trash2 } from "lucide-react";
import { deleteDraftExamAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";

export function DeleteDraftExamButton({ locale, examId, label, confirmMessage }: { locale: string; examId: string; label: string; confirmMessage: string }) {
  return (
    <form action={deleteDraftExamAction} onSubmit={(event) => {
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
