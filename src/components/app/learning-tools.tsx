import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Brain, CalendarDays, ChartNoAxesCombined, ClipboardList, Clock3, Library, Sparkles, Target, Users } from "lucide-react";

type LearningToolsProps = {
  locale: string;
  role: "teacher" | "student";
};

const copy = {
  vi: {
    student: {
      eyebrow: "Góc học tập",
      title: "Chọn một nhịp học phù hợp hôm nay",
      subtitle: "Các công cụ cần thiết luôn ở gần để bạn học đều, làm bài tập trung và nhìn thấy tiến bộ của mình.",
      tools: [
        { title: "Làm bài", description: "Mở bài được giao và tiếp tục lượt đang làm.", label: "Xem bài kiểm tra", icon: BookOpenCheck, href: "/exams", tone: "bg-indigo-50 text-indigo-700" },
        { title: "Lớp của tôi", description: "Theo dõi lớp học, giáo viên và hoạt động mới.", label: "Mở lớp học", icon: Users, href: "/classes", tone: "bg-emerald-50 text-emerald-700" },
        { title: "Mục tiêu tuần", description: "Đặt một mục tiêu nhỏ để giữ nhịp học ổn định.", label: "Xem khu vực mục tiêu", icon: Target, href: "#weekly-plan", tone: "bg-amber-50 text-amber-800" },
        { title: "Kỹ năng cần luyện", description: "Chọn Listening, Speaking, Reading hoặc Writing để bắt đầu.", label: "Xem kỹ năng", icon: Brain, href: "#skills", tone: "bg-sky-50 text-sky-700" }
      ]
    },
    teacher: {
      eyebrow: "Bộ công cụ học tập",
      title: "Soạn, giao và theo dõi bài học trong một nhịp",
      subtitle: "Những thao tác dùng nhiều nhất được đặt ngay trên trang đầu để bạn bắt tay vào việc nhanh hơn.",
      tools: [
        { title: "Ngân hàng câu hỏi", description: "Tạo câu hỏi mới và gom nội dung theo kỹ năng.", label: "Mở ngân hàng", icon: Library, href: "/question-bank", tone: "bg-indigo-50 text-indigo-700" },
        { title: "Tạo đề nhanh", description: "Tạo đề trống, dùng AI hoặc import Word/Excel.", label: "Bắt đầu tạo đề", icon: Sparkles, href: "/exams", tone: "bg-amber-50 text-amber-800" },
        { title: "Lớp học", description: "Quản lý học viên, lớp và các bài đã giao.", label: "Mở lớp học", icon: Users, href: "/classes", tone: "bg-emerald-50 text-emerald-700" },
        { title: "Báo cáo tiến bộ", description: "Nhìn nhanh kết quả để biết lớp cần hỗ trợ ở đâu.", label: "Xem báo cáo", icon: ChartNoAxesCombined, href: "/reports", tone: "bg-sky-50 text-sky-700" }
      ]
    }
  },
  en: {
    student: {
      eyebrow: "Learning corner",
      title: "Choose a rhythm that fits today",
      subtitle: "Keep the tools close, study with focus, and make progress you can actually see.",
      tools: [
        { title: "Take an exam", description: "Open assigned work or continue an attempt in progress.", label: "View exams", icon: BookOpenCheck, href: "/exams", tone: "bg-indigo-50 text-indigo-700" },
        { title: "My classes", description: "Keep up with classes, teachers, and new activity.", label: "Open classes", icon: Users, href: "/classes", tone: "bg-emerald-50 text-emerald-700" },
        { title: "Weekly goal", description: "Set one small goal to keep your learning rhythm steady.", label: "View goal area", icon: Target, href: "#weekly-plan", tone: "bg-amber-50 text-amber-800" },
        { title: "Skills to practise", description: "Pick Listening, Speaking, Reading, or Writing to begin.", label: "View skills", icon: Brain, href: "#skills", tone: "bg-sky-50 text-sky-700" }
      ]
    },
    teacher: {
      eyebrow: "Learning toolkit",
      title: "Build, assign, and follow up in one rhythm",
      subtitle: "The actions you use most are close at hand, so the teaching day starts with less friction.",
      tools: [
        { title: "Question bank", description: "Create questions and organise content by skill.", label: "Open question bank", icon: Library, href: "/question-bank", tone: "bg-indigo-50 text-indigo-700" },
        { title: "Build an exam", description: "Start blank, use AI, or import Word and Excel.", label: "Start building", icon: Sparkles, href: "/exams", tone: "bg-amber-50 text-amber-800" },
        { title: "Classes", description: "Manage learners, classes, and assigned work.", label: "Open classes", icon: Users, href: "/classes", tone: "bg-emerald-50 text-emerald-700" },
        { title: "Progress reports", description: "Spot where a class needs support and follow-up.", label: "View reports", icon: ChartNoAxesCombined, href: "/reports", tone: "bg-sky-50 text-sky-700" }
      ]
    }
  }
} as const;

export function LearningTools({ locale, role }: LearningToolsProps) {
  const language = locale === "en" ? "en" : "vi";
  const content = copy[language][role];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm" aria-labelledby="learning-tools-title">
      <div className="grid gap-3 bg-[linear-gradient(120deg,#fffdf5_0%,#f1f5ff_52%,#effcf8_100%)] px-4 py-5 sm:px-5 lg:grid-cols-[minmax(220px,0.8fr)_1.8fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {content.eyebrow}
          </div>
          <h2 id="learning-tools-title" className="mt-2 text-xl font-black text-slate-950">{content.title}</h2>
          <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">{content.subtitle}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {content.tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={`/${locale}/${role}${tool.href}`} className="group flex min-h-36 flex-col justify-between rounded-xl border border-white/90 bg-white/85 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.tone}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-600" aria-hidden="true" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-black text-slate-950">{tool.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{tool.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-indigo-700">{tool.label}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
