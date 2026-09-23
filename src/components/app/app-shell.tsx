import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, LayoutDashboard, Library, School, Settings, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/app/locale-switcher";
import { LogoutButton } from "@/components/app/logout-button";
import { NotificationBell } from "@/components/app/notification-bell";
import { prisma } from "@/lib/db";
import type { AppUser } from "@/lib/permissions";
import type { LucideIcon } from "lucide-react";

type NavKey = "dashboard" | "workspace" | "approvals" | "users" | "schools" | "classes" | "audit" | "questions" | "exams" | "grading" | "students" | "settings";
type NavItem = [key: NavKey, href: string, icon: LucideIcon];

const nav: Record<AppUser["role"], NavItem[]> = {
  ADMIN: [
    ["dashboard", "", LayoutDashboard],
    ["approvals", "/approvals", ShieldCheck],
    ["schools", "/schools", School],
    ["users", "/users", Users],
    ["classes", "/classes", BookOpen],
    ["audit", "/audit-logs", ClipboardCheck],
    ["settings", "/settings", Settings]
  ],
  TEACHER: [
    ["workspace", "", LayoutDashboard],
    ["classes", "/classes", Users],
    ["questions", "/question-bank", Library],
    ["exams", "/exams", BookOpen],
    ["grading", "/grading", ClipboardCheck],
    ["students", "/students", GraduationCap]
  ],
  STUDENT: [
    ["dashboard", "", LayoutDashboard],
    ["classes", "/classes", Users],
    ["exams", "/exams", BookOpen]
  ]
};

const labels: Record<"vi" | "en", Record<NavKey, string>> = {
  vi: {
    dashboard: "Tổng quan",
    workspace: "Hôm nay",
    approvals: "Duyệt",
    users: "Tài khoản",
    schools: "Trường",
    classes: "Lớp",
    audit: "Nhật ký",
    questions: "Câu hỏi",
    exams: "Đề",
    grading: "Chấm",
    students: "Học viên",
    settings: "Cài đặt"
  },
  en: {
    dashboard: "Overview",
    workspace: "Today",
    approvals: "Approvals",
    users: "Users",
    schools: "Schools",
    classes: "Classes",
    audit: "Audit",
    questions: "Questions",
    exams: "Exams",
    grading: "Grading",
    students: "Students",
    settings: "Settings"
  }
};

export async function AppShell({
  user,
  locale,
  children
}: {
  user: AppUser;
  locale: string;
  children: React.ReactNode;
}) {
  const rolePath = user.role.toLocaleLowerCase();
  const items = nav[user.role];
  const t = labels[locale === "en" ? "en" : "vi"];
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true }
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/88 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <Link href={`/${locale}/${rolePath}`} aria-label="changg changg home">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell
              locale={locale}
              notifications={notifications.map((item) => ({
                ...item,
                createdAt: item.createdAt.toISOString(),
                readAt: item.readAt?.toISOString() ?? null
              }))}
            />
            <LocaleSwitcher locale={locale} />
            <LogoutButton locale={locale} />
          </div>
        </div>
      </header>

      <div className="grid w-full gap-4 px-3 py-4 pb-24 sm:px-5 lg:grid-cols-[260px_1fr] lg:pb-6">
        <aside className="hidden rounded-xl border border-white/70 bg-white/82 p-3 shadow-sm backdrop-blur lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)]">
          <div className="mb-4 rounded-lg bg-slate-50 p-3">
            <p className="truncate text-sm font-bold text-slate-950">{user.name}</p>
            <p className="text-xs font-semibold uppercase text-slate-500">{user.role}</p>
          </div>
          <nav className="grid gap-1">
            {items.map(([key, href, Icon]) => (
              <Link
                key={href}
                href={`/${locale}/${rolePath}${href}`}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t[key]}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white/94 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
        aria-label={locale === "en" ? "Mobile navigation" : "Điều hướng mobile"}
      >
        {items.map(([key, href, Icon]) => (
          <Link
            key={href}
            href={`/${locale}/${rolePath}${href}`}
            className="flex min-w-[76px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="truncate">{t[key]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
