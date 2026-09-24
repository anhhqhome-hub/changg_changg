import { createClassAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

export function CreateClassModal({
  locale,
  schoolName,
  currentAcademicYearName
}: {
  locale: string;
  schoolName?: string | null;
  currentAcademicYearName: string;
}) {
  const isEn = locale === "en";
  const text = isEn
    ? {
        trigger: "New class",
        title: "Create a class",
        description: "The class is automatically assigned to the current academic year.",
        namePlaceholder: "Class 9A1",
        descriptionPlaceholder: "Short note about this class",
        submit: "Create class",
        academicYear: "Current academic year",
        school: "School",
        missing: "An admin must assign your school first."
      }
    : {
        trigger: "Tạo lớp",
        title: "Tạo lớp học",
        description: "Lớp được tự động gắn với năm học hiện tại, giáo viên không cần chọn năm thủ công.",
        namePlaceholder: "Lớp 9A1",
        descriptionPlaceholder: "Ghi chú ngắn cho lớp này",
        submit: "Tạo lớp",
        academicYear: "Năm học hiện tại",
        school: "Trường",
        missing: "Admin cần gán trường cho giáo viên trước."
      };
  const ready = Boolean(schoolName);

  return (
    <Modal title={text.title} description={text.description} triggerLabel={text.trigger} triggerIcon="plus">
      <form action={createClassAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-1 text-sm font-bold">
          {text.school}
          <Input value={schoolName ?? "—"} readOnly disabled />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {text.academicYear}
          <Input value={currentAcademicYearName} readOnly disabled />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Class name" : "Tên lớp"}
          <Input name="name" placeholder={text.namePlaceholder} required autoFocus />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Description" : "Mô tả"}
          <Textarea name="description" placeholder={text.descriptionPlaceholder} className="min-h-24" />
        </label>
        {!ready ? <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">{text.missing}</p> : null}
        <Button type="submit" disabled={!ready}>{text.submit}</Button>
      </form>
    </Modal>
  );
}
