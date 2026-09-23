"use client";

import { Languages } from "lucide-react";
import { updateLocaleAction } from "@/actions/auth-actions";

export function LocaleSwitcher({ locale }: { locale: string }) {
  const nextLocale = locale === "vi" ? "en" : "vi";
  const label = locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt";

  return (
    <form action={() => updateLocaleAction(nextLocale)}>
      <button
        type="submit"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        title={label}
        aria-label={label}
      >
        <Languages className="h-4 w-4" />
      </button>
    </form>
  );
}
