import { Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" aria-hidden />
      <p className="font-semibold text-slate-900">{title}</p>
      {body ? <p className="mt-1 max-w-md text-sm text-slate-600">{body}</p> : null}
    </div>
  );
}
