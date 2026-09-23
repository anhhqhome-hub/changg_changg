import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("h-9 w-9 shrink-0 drop-shadow-sm", className)}>
      <defs>
        <linearGradient id="brand-mark-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#brand-mark-gradient)" />
      <path
        d="M32 24c-4-5.5-11-7.5-17-6.5v24c6-1 13 1 17 6.5"
        fill="none"
        stroke="#fff"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 24c4-5.5 11-7.5 17-6.5v24c-6-1-13 1-17 6.5"
        fill="none"
        stroke="#fff"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 24v24" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <circle cx={47} cy={16} r={3.2} fill="#FBBF24" />
    </svg>
  );
}

export function BrandLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      {showText ? <span className="text-lg font-bold tracking-normal text-slate-950">changg changg</span> : null}
    </div>
  );
}
