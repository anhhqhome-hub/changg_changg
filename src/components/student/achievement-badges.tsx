import { Award, BookOpenCheck, Flame, LockKeyhole, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Badge = { title: string; description: string; unlocked: boolean; icon: typeof Award; tone: string };

export function AchievementBadges({ submittedCount, completedDays }: { submittedCount: number; completedDays: number }) {
  const badges: Badge[] = [
    { title: "Bước đầu tiên", description: "Hoàn thành lượt học đầu tiên", unlocked: submittedCount >= 1, icon: BookOpenCheck, tone: "bg-indigo-100 text-indigo-700" },
    { title: "Giữ nhịp", description: "Hoàn thành mục tiêu trong 3 ngày", unlocked: completedDays >= 3, icon: Flame, tone: "bg-rose-100 text-rose-700" },
    { title: "Đều đặn", description: "Hoàn thành hoạt động trong 7 ngày", unlocked: completedDays >= 7, icon: Trophy, tone: "bg-amber-100 text-amber-700" },
    { title: "Người bền bỉ", description: "Hoàn thành 10 lượt học", unlocked: submittedCount >= 10, icon: Award, tone: "bg-emerald-100 text-emerald-700" }
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Huy hiệu của bạn</CardTitle></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {badges.map(({ title, description, unlocked, icon: Icon, tone }) => (
          <div key={title} className={`flex items-center gap-3 rounded-md border p-3 ${unlocked ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50 opacity-60"}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${unlocked ? tone : "bg-slate-200 text-slate-500"}`}>
              {unlocked ? <Icon className="h-5 w-5" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            </span>
            <span className="min-w-0"><strong className="block text-sm text-slate-900">{title}</strong><span className="block text-xs text-slate-500">{description}</span></span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
