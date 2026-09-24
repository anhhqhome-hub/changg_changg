"use client";

import { useActionState, useMemo, useState } from "react";
import { registerStudentAction, type RegisterActionState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RegisterActionState = {};

type RegistrationClass = {
  id: string;
  name: string;
  teacher: { name: string };
};

type RegistrationSchool = {
  id: string;
  name: string;
  classes: RegistrationClass[];
};

export function RegisterForm({
  locale,
  schools,
  currentAcademicYearName
}: {
  locale: "vi" | "en";
  schools: RegistrationSchool[];
  currentAcademicYearName: string;
}) {
  const [state, formAction, pending] = useActionState(registerStudentAction, initialState);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const isEn = locale === "en";

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === schoolId) ?? null,
    [schoolId, schools]
  );

  const availableClasses = selectedSchool?.classes ?? [];
  const hasAvailableClasses = schools.some((school) => school.classes.length > 0);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
          {state.error}
        </div>
      ) : null}

      <label className="grid gap-1 text-sm font-medium">
        {isEn ? "Full name" : "Họ và tên"}
        <Input name="name" required minLength={2} maxLength={120} autoComplete="name" />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Username
        <Input name="username" required minLength={3} maxLength={30} autoComplete="username" placeholder="minhanh" />
        <span className="text-xs text-slate-500">{isEn ? "Letters, numbers, underscore and dot only." : "Chỉ dùng chữ, số, dấu gạch dưới và dấu chấm."}</span>
      </label>

      <div className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
        <div>
          <p className="text-sm font-black text-indigo-950">{isEn ? "Choose your school and class" : "Chọn trường và lớp của em"}</p>
          <p className="mt-1 text-xs font-semibold text-indigo-700">
            {isEn ? "Current academic year" : "Năm học hiện tại"}: {currentAcademicYearName}
          </p>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          {isEn ? "School" : "Trường học"}
          <select
            name="schoolId"
            value={schoolId}
            onChange={(event) => {
              setSchoolId(event.target.value);
              setClassId("");
            }}
            required
            disabled={!hasAvailableClasses}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">{isEn ? "Select school" : "Chọn trường"}</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          {isEn ? "Class" : "Lớp học"}
          <select
            name="classId"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            required
            disabled={!schoolId}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"
          >
            <option value="">{isEn ? "Select class" : "Chọn lớp"}</option>
            {availableClasses.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name} · {isEn ? "Teacher" : "GV"} {klass.teacher.name}
              </option>
            ))}
          </select>
        </label>

        {!hasAvailableClasses ? (
          <p className="text-xs font-semibold text-amber-700">
            {isEn
              ? "No classes are available for the current academic year yet. Please contact the school administrator."
              : "Hiện chưa có lớp thuộc năm học hiện tại để đăng ký. Vui lòng liên hệ nhà trường hoặc quản trị viên."}
          </p>
        ) : null}
      </div>

      <label className="grid gap-1 text-sm font-medium">
        {isEn ? "Password" : "Mật khẩu"}
        <Input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        {isEn ? "Confirm password" : "Nhập lại mật khẩu"}
        <Input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </label>
      <Button type="submit" disabled={pending || !hasAvailableClasses || !classId}>
        {pending ? (isEn ? "Creating account..." : "Đang tạo tài khoản...") : (isEn ? "Create student account" : "Tạo tài khoản học sinh")}
      </Button>
      <p className="text-center text-xs leading-5 text-slate-500">
        {isEn
          ? "Your account will be added to the selected class immediately. The server validates that the class belongs to the current academic year."
          : "Tài khoản sẽ được thêm ngay vào lớp đã chọn. Hệ thống tự kiểm tra lớp thuộc đúng năm học hiện tại trước khi tạo tài khoản."}
      </p>
    </form>
  );
}
