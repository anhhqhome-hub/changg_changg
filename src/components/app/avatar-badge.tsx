import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const palette = [
  "bg-indigo-100 text-indigo-800",
  "bg-amber-100 text-amber-900",
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800"
];

function paletteIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % palette.length;
}

export function AvatarBadge({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black",
        palette[paletteIndex(name)],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
