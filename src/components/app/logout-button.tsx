"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";

export function LogoutButton({ locale }: { locale: string }) {
  const label = locale === "vi" ? "Đăng xuất" : "Sign out";

  return (
    <form action={() => signOutAction(locale)}>
      <button
        type="submit"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        title={label}
        aria-label={label}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}
