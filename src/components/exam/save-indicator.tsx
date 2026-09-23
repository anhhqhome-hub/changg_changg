"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";

export function SaveIndicator({ state }: { state: "saved" | "saving" | "offline" | "error" }) {
  const label = state === "saved" ? "Đã lưu" : state === "saving" ? "Đang lưu..." : state === "offline" ? "Mất kết nối" : "Chưa lưu được";
  const Icon = state === "saving" ? Loader2 : state === "offline" || state === "error" ? CloudOff : Cloud;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      <Icon className={`h-4 w-4 ${state === "saving" ? "animate-spin" : ""}`} aria-hidden />
      {label}
    </span>
  );
}
