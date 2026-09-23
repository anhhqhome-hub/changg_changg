import { createExamAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function CreateExamModal({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const text = isEn
    ? {
        trigger: "New exam",
        title: "Create exam draft",
        description: "Name the exam first. You will add questions in the builder right after this.",
        titlePlaceholder: "Reading and Writing - School Life",
        descriptionPlaceholder: "Short note for this exam",
        submit: "Create draft"
      }
    : {
        trigger: "Tạo đề",
        title: "Tạo bản nháp đề",
        description: "Đặt tên đề trước. Sau đó bạn sẽ vào builder để thêm câu hỏi ngay.",
        titlePlaceholder: "Reading and Writing - School Life",
        descriptionPlaceholder: "Ghi chú ngắn cho đề này",
        submit: "Tạo bản nháp"
      };

  return (
    <Modal title={text.title} description={text.description} triggerLabel={text.trigger} triggerIcon="plus">
      <form action={createExamAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Exam title" : "Tên đề"}
          <Input name="title" placeholder={text.titlePlaceholder} required autoFocus />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Description" : "Mô tả"}
          <Textarea name="description" placeholder={text.descriptionPlaceholder} className="min-h-24" />
        </label>
        <Button type="submit">{text.submit}</Button>
      </form>
    </Modal>
  );
}
