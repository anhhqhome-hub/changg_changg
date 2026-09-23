import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import type { FounderInfo } from "@/lib/site-settings";

export function FounderCard({ founder }: { founder: FounderInfo }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-5 shadow-md shadow-indigo-100/60 backdrop-blur">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-white shadow-lg shadow-indigo-200/50">
          <Image
            src={founder.photoUrl}
            alt={founder.name ?? founder.title}
            fill
            sizes="80px"
            className="object-cover"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {founder.name ? (
              <p className="truncate text-base font-black text-slate-950">{founder.name}</p>
            ) : (
              <p className="truncate text-base font-black text-slate-950">{founder.title}</p>
            )}
            <BadgeCheck className="h-4 w-4 shrink-0 text-indigo-600" aria-label="Đã xác thực" />
          </div>
          {founder.name ? (
            <p className="truncate text-xs font-bold uppercase tracking-wide text-indigo-700">{founder.title}</p>
          ) : null}
          {founder.quote ? (
            <p className="mt-1.5 line-clamp-2 text-xs italic leading-snug text-slate-600">
              &ldquo;{founder.quote}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
