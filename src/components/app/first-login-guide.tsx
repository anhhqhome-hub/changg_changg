"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardList, GraduationCap, Library, Sparkles, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

type GuideRole = "teacher" | "student" | "admin";

const copy = {
  vi: {
    teacher: {
      eyebrow: "Bắt đầu trong 3 phút",
      title: "Chào mừng bạn đến với không gian dạy học",
      intro: "Làm theo bốn bước dưới đây để biến The Folio thành bảng điều khiển quen thuộc mỗi ngày.",
      steps: [
        ["Kiểm tra lớp", "Mở Lớp học để tạo lớp, thêm học viên và xem tiến độ.", Users, "/classes"],
        ["Tạo nội dung", "Dùng Ngân hàng câu hỏi để viết câu mới hoặc gom câu theo kỹ năng.", Library, "/question-bank"],
        ["Tạo và giao đề", "Tạo đề trống, import Word/Excel hoặc nhờ AI gợi ý rồi giao cho lớp.", ClipboardList, "/exams"],
        ["Theo dõi tiến bộ", "Mở Chấm bài và Báo cáo để biết ai cần hỗ trợ tiếp theo.", GraduationCap, "/reports"]
      ],
      close: "Đã hiểu, bắt đầu làm việc"
    },
    student: {
      eyebrow: "Bắt đầu trong 3 phút",
      title: "Chào mừng bạn đến với không gian học tập",
      intro: "Bạn có thể bắt đầu thật nhẹ nhàng: xem lớp, mở bài được giao và theo dõi kỹ năng của mình.",
      steps: [
        ["Xem lớp học", "Mở Lớp để xem lớp, giáo viên và các hoạt động đang diễn ra.", Users, "/classes"],
        ["Chọn bài phù hợp", "Vào Bài kiểm tra để bắt đầu bài mới hoặc tiếp tục lượt đang làm.", BookOpenCheck, "/exams"],
        ["Làm bài tập trung", "Đọc kỹ hướng dẫn, lưu câu trả lời và nộp bài khi đã kiểm tra lại.", CheckCircle2, "/exams"],
        ["Xem tiến bộ", "Mở lại kết quả để nhìn điểm mạnh và chọn kỹ năng cần luyện tiếp.", Sparkles, "#skills"]
      ],
      close: "Đã hiểu, bắt đầu học"
    },
    admin: {
      eyebrow: "Bắt đầu trong 3 phút",
      title: "Chào mừng bạn đến khu vực quản trị",
      intro: "Bốn điểm chính giúp bạn thiết lập hệ thống gọn gàng ngay từ lần đầu.",
      steps: [
        ["Thiết lập trường", "Kiểm tra trường và năm học đang hoạt động.", GraduationCap, "/schools"],
        ["Quản lý tài khoản", "Duyệt, tạo hoặc cập nhật tài khoản giáo viên và học sinh.", Users, "/users"],
        ["Kiểm tra dữ liệu", "Mở Dữ liệu để xem các bản ghi nghiệp vụ trong hệ thống.", Library, "/data"],
        ["Theo dõi nhật ký", "Dùng Nhật ký để kiểm tra các hoạt động quan trọng.", ClipboardList, "/audit-logs"]
      ],
      close: "Đã hiểu, mở bảng điều khiển"
    }
  },
  en: {
    teacher: {
      eyebrow: "Start in 3 minutes",
      title: "Welcome to your teaching workspace",
      intro: "Follow these four steps and The Folio will feel familiar from the first teaching day.",
      steps: [["Check classes", "Create classes, add learners, and scan progress.", Users, "/classes"], ["Build content", "Write questions or organise them by skill.", Library, "/question-bank"], ["Create and assign", "Build blank, imported, or AI-assisted exams and assign them.", ClipboardList, "/exams"], ["Follow progress", "Use Grading and Reports to decide who needs help next.", GraduationCap, "/reports"]],
      close: "Got it, start working"
    },
    student: {
      eyebrow: "Start in 3 minutes",
      title: "Welcome to your learning space",
      intro: "Start gently: check your class, open assigned work, and keep an eye on your skills.",
      steps: [["See your classes", "Open Classes to see teachers and current activity.", Users, "/classes"], ["Choose your work", "Open Exams to start something new or continue an attempt.", BookOpenCheck, "/exams"], ["Stay focused", "Read instructions, save answers, and review before submitting.", CheckCircle2, "/exams"], ["See progress", "Review results and choose the next skill to practise.", Sparkles, "#skills"]],
      close: "Got it, start learning"
    },
    admin: {
      eyebrow: "Start in 3 minutes",
      title: "Welcome to the admin workspace",
      intro: "These four areas help you set up a clean system from the first day.",
      steps: [["Set up schools", "Check schools and the active academic year.", GraduationCap, "/schools"], ["Manage accounts", "Approve, create, or update teacher and student accounts.", Users, "/users"], ["Check data", "Open Data to review application records.", Library, "/data"], ["Follow the audit", "Use Audit to inspect important activity.", ClipboardList, "/audit-logs"]],
      close: "Got it, open dashboard"
    }
  }
} as const;

export function FirstLoginGuide({ locale, role }: { locale: string; role: GuideRole }) {
  const language = locale === "en" ? "en" : "vi";
  const content = copy[language][role];
  const storageKey = `the-folio-welcome-${role}`;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.sessionStorage.getItem(storageKey) === "seen") setVisible(false);
  }, [storageKey]);

  if (!visible) return null;

  function dismiss() {
    window.sessionStorage.setItem(storageKey, "seen");
    setVisible(false);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm" aria-labelledby="first-login-guide-title">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />
      <div className="relative p-5 sm:p-6">
        <button type="button" onClick={dismiss} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={content.close} title={content.close}><X className="h-4 w-4" /></button>
        <p className="pr-10 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{content.eyebrow}</p>
        <h2 id="first-login-guide-title" className="mt-2 pr-8 text-xl font-black text-slate-950">{content.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{content.intro}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {content.steps.map(([title, description, Icon, href], index) => (
            <Link key={title} href={`/${locale}/${role}${href}`} onClick={dismiss} className="group flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/60">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-black text-slate-950"><span className="text-xs text-indigo-600">0{index + 1}</span>{title}<ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" aria-hidden="true" /></span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
            </Link>
          ))}
        </div>
        <button type="button" onClick={dismiss} className="mt-4 text-sm font-black text-indigo-700 hover:text-indigo-900">{content.close}</button>
      </div>
    </section>
  );
}
