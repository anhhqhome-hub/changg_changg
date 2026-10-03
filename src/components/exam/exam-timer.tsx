"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

export function ExamTimer({ expiresAt, onExpire }: { expiresAt: string | null; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;

    const syncRemaining = () => {
      const next = getRemaining(expiresAt);
      setRemaining(next);
      if (next <= 0 && expiresAt && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    syncRemaining();
    const interval = window.setInterval(syncRemaining, 1000);
    window.addEventListener("focus", syncRemaining);
    window.addEventListener("pageshow", syncRemaining);
    document.addEventListener("visibilitychange", syncRemaining);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncRemaining);
      window.removeEventListener("pageshow", syncRemaining);
      document.removeEventListener("visibilitychange", syncRemaining);
    };
  }, [expiresAt]);
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
