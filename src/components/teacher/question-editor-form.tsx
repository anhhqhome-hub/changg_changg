import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EditorOption = { label: string; isCorrect: boolean };

type QuestionEditorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
  questionId: string;
  examId?: string;
  title: string;
  prompt: string;
  instructions?: string | null;
  points: number;
  skill: string;
  questionType: string;
  options: EditorOption[];
  correctAnswersJson?: string | null;
  isEn: boolean;
  disabled?: boolean;
};

export function QuestionEditorForm({
  action,
  locale,
  questionId,
  examId,
  title,
  prompt,
  instructions,
  points,
  skill,
  questionType,
  options,
  correctAnswersJson,
  isEn,
  disabled = false
}: QuestionEditorFormProps) {
  const correctAnswer = getCorrectAnswer(options, correctAnswersJson, questionType);
  const optionText = options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option.label}`).join("\n");
  const answerText = getEditorAnswer(options, correctAnswersJson, questionType);

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{isEn ? "Correct answer" : "Đáp án đúng"}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm font-black text-emerald-700">{correctAnswer}</p>
      </div>
      {disabled ? null : (
        <details className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-black text-indigo-800">
            {isEn ? "Edit this question" : "Sửa trực tiếp câu hỏi"}
          </summary>
          <form action={action} className="grid gap-3 border-t border-indigo-100 bg-white p-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="questionId" value={questionId} />
            {examId ? <input type="hidden" name="examId" value={examId} /> : null}
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
              {isEn ? "Title" : "Tiêu đề"}
              <Input name="title" defaultValue={title} required />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
              {isEn ? "Question" : "Nội dung câu hỏi"}
              <Textarea name="prompt" defaultValue={prompt} required />
            </label>
            {examId ? (
              <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                {isEn ? "Instructions" : "Hướng dẫn"}
                <Textarea name="instructions" defaultValue={instructions ?? ""} />
              </label>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                {isEn ? "Skill" : "Kỹ năng"}
                <Input value={skill} readOnly aria-readonly="true" />
                <input type="hidden" name="skill" value={skill} />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                {isEn ? "Question type" : "Loại câu hỏi"}
                <Input value={questionType} readOnly aria-readonly="true" />
                <input type="hidden" name="questionType" value={questionType} />
              </label>
            </div>
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500 sm:max-w-[180px]">
              {isEn ? "Points" : "Điểm"}
              <Input name="points" type="number" min="0.5" step="0.5" defaultValue={points} required />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
              {isEn ? "Options, one per line" : "Các lựa chọn, mỗi dòng một đáp án"}
              <Textarea name="options" defaultValue={optionText} />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
              {isEn ? "Correct answer" : "Đáp án đúng"}
              <Input name="correctAnswers" defaultValue={answerText} placeholder="A, B hoặc nhập nguyên văn đáp án" />
              <span className="normal-case font-medium text-slate-500">{isEn ? "Use letters for choices, or enter the exact answer for fill-in questions." : "Dùng A, B cho câu chọn đáp án; câu điền thì nhập nguyên văn đáp án."}</span>
            </label>
            <Button type="submit" className="w-fit">
              <Save className="h-4 w-4" /> {isEn ? "Save changes" : "Lưu thay đổi"}
            </Button>
          </form>
        </details>
      )}
    </div>
  );
}

function getCorrectAnswer(options: EditorOption[], correctAnswersJson: string | null | undefined, questionType: string) {
  const marked = options
    .map((option, index) => (option.isCorrect ? `${String.fromCharCode(65 + index)}. ${option.label}` : ""))
    .filter(Boolean);
  if (marked.length) return marked.join("; ");
  const parsed = parseAnswers(correctAnswersJson);
  if (parsed.length) return parsed.join(", ");
  if (questionType === "ESSAY" || questionType === "SPEAKING_RECORDING") return "Tự luận / giáo viên chấm";
  return "Chưa có đáp án";
}

function getEditorAnswer(options: EditorOption[], correctAnswersJson: string | null | undefined, questionType: string) {
  const letters = options.map((option, index) => (option.isCorrect ? String.fromCharCode(65 + index) : "")).filter(Boolean);
  if (letters.length) return letters.join(", ");
  const parsed = parseAnswers(correctAnswersJson);
  if (parsed.length) return parsed.join(", ");
  return questionType === "ESSAY" || questionType === "SPEAKING_RECORDING" ? "" : "";
}

function parseAnswers(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.flat(Infinity).map(String).filter(Boolean);
    if (parsed && typeof parsed === "object") return [JSON.stringify(parsed)];
  } catch {
    return [value];
  }
  return [];
}
