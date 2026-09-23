"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function ExamTimer({ expiresAt, onExpire }: { expiresAt: string | null; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));
  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = getRemaining(expiresAt);
      setRemaining(next);
      if (next <= 0 && expiresAt) onExpire();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, onExpire]);
  if (!expiresAt) return null;
  const minutes = Math.floor(Math.max(0, remaining) / 60);
  const seconds = Math.max(0, remaining) % 60;
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold text-white">
      <Clock className="h-4 w-4" aria-hidden />
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}

function getRemaining(expiresAt: string | null) {
  if (!expiresAt) return 0;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
}
