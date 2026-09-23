"use client";

import { useState } from "react";
import { Pencil, UserPlus, UserX } from "lucide-react";
import { addStudentToClassAction, removeStudentFromClassAction, updateClassAction } from "@/actions/teacher-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

type Target = { id: string; name: string; email?: string };

export function EditClassModal({
  locale,
  classId,
  name,
  description
}: {
  locale: string;
  classId: string;
  name: string;
  description: string;
}) {
  const isEn = locale === "en";
  const text = isEn
    ? { trigger: "Edit", title: "Edit class", description: "Update the class name or description.", submit: "Save changes" }
    : { trigger: "Sửa", title: "Sửa lớp học", description: "Cập nhật tên hoặc mô tả của lớp.", submit: "Lưu thay đổi" };

  return (
    <Modal title={text.title} description={text.description} triggerLabel={text.trigger} triggerVariant="outline">
      <form action={updateClassAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="classId" value={classId} />
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Class name" : "Tên lớp"}
          <Input name="name" defaultValue={name} required autoFocus />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {isEn ? "Description" : "Mô tả"}
          <Textarea name="description" defaultValue={description} className="min-h-24" />
        </label>
        <Button type="submit">
          <Pencil className="h-4 w-4" /> {text.submit}
        </Button>
      </form>
    </Modal>
  );
}

export function AddStudentModal({ locale, classId, students }: { locale: string; classId: string; students: Target[] }) {
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const filtered = students.filter((student) => {
    const haystack = `${student.name} ${student.email ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const text = isEn
    ? {
        trigger: "Add student",
        title: "Add student to class",
        description: "Only approved students not yet in this class are shown.",
        search: "Search by name or email",
        empty: "No matching students.",
        submit: "Add to class"
      }
    : {
        trigger: "Thêm học viên",
        title: "Thêm học viên vào lớp",
        description: "Chỉ hiển thị học viên đã duyệt và chưa có trong lớp này.",
        search: "Tìm theo tên hoặc email",
        empty: "Không tìm thấy học viên phù hợp.",
        submit: "Thêm vào lớp"
      };

  return (
    <Modal title={text.title} description={text.description} triggerLabel={text.trigger} triggerIcon="plus">
      <form action={addStudentToClassAction} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="classId" value={classId} />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.search}
          aria-label={text.search}
        />
        {filtered.length ? (
          <select name="studentId" size={Math.min(8, Math.max(4, filtered.length))} required className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            {filtered.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
                {student.email ? ` · ${student.email}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">{text.empty}</p>
        )}
        <Button type="submit" disabled={!filtered.length}>
          <UserPlus className="h-4 w-4" /> {text.submit}
        </Button>
      </form>
    </Modal>
  );
}

export function RemoveStudentButton({
  locale,
  classId,
  studentId,
  studentName
}: {
  locale: string;
  classId: string;
  studentId: string;
  studentName: string;
}) {
  const isEn = locale === "en";
  const confirmMessage = isEn
    ? `Remove ${studentName} from this class?`
    : `Xóa ${studentName} khỏi lớp này?`;

  return (
    <form
      action={removeStudentFromClassAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="studentId" value={studentId} />
      <Button type="submit" variant="ghost" size="icon" aria-label={isEn ? "Remove student" : "Xóa học viên"}>
        <UserX className="h-4 w-4 text-slate-400 hover:text-red-600" />
      </Button>
    </form>
  );
}
