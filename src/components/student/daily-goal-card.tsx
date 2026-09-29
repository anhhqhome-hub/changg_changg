"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const storageKey = "student-daily-goal";

export function DailyGoalCard({ completedToday, weekCompleted, previousWeekCompleted }: { completedToday: number; weekCompleted: number; previousWeekCompleted: number }) {
  const [target, setTarget] = useState(1);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(storageKey));
    if (Number.isInteger(saved) && saved >= 1 && saved <= 3) setTarget(saved);
  }, []);

  const progress = Math.min(100, Math.round((completedToday / target) * 100));
  const difference = weekCompleted - previousWeekCompleted;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Mục tiêu hôm nay</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Một bài giáo viên giao hoặc một lượt ôn đều được tính.</p>
        </div>
        <Target className="h-5 w-5 text-indigo-600" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-slate-950">{completedToday}/{target}</p>
            <p className="text-sm font-semibold text-slate-500">hoạt động hoàn thành</p>
          </div>
          <div className="flex gap-1" aria-label="Mục tiêu mỗi ngày">
            {[1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTarget(value);
                  window.localStorage.setItem(storageKey, String(value));
                }}
                className={`h-9 min-w-9 rounded-md border px-3 text-sm font-black ${target === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                aria-pressed={target === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${progress}% hoàn thành`}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          {difference >= 0 ? `Tuần này nhiều hơn tuần trước ${difference} lượt.` : `Tuần này còn thiếu ${Math.abs(difference)} lượt so với tuần trước.`}
        </div>
      </CardContent>
    </Card>
  );
}
