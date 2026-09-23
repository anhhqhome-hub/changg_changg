import { createClassAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function CreateClassModal({ locale }: { locale: string }) {
  const isEn = locale === "en";
  const text = isEn
    ? {
        trigger: "New class",
        title: "Create a class",
        description: "Group students so you can assign exams and track progress together.",
        namePlaceholder: "IELTS Foundation A1",
        descriptionPlaceholder: "Short note about this class",
        submit: "Create class"
      }
    : {
        trigger: "Tạo lớp",
        title: "Tạo lớp học",
        description: "Nhóm học viên lại để giao đề và theo dõi tiến độ dễ dàng hơn.",
        namePlaceholder: "IELTS Foundation A1",
        descriptionPlaceholder: "Ghi chú ngắn cho lớp này",
        submit: "Tạo lớp"
      };

  return (
    <Modal title={text.title} description={text.description} triggerLabel={text.trigger} triggerIcon="plus">
      <form action={createClassAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Class name" : "Tên lớp"}
          <Input name="name" placeholder={text.namePlaceholder} required autoFocus />
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
