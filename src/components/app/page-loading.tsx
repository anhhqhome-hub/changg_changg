import { BrandMark } from "@/components/brand/brand-logo";

export function PageLoading() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BrandMark className="h-11 w-11" />
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-indigo-700">The Folio</p>
            <p className="text-sm font-semibold text-slate-500">Dang tai du lieu...</p>
          </div>
        </div>

        <section className="grid gap-4 rounded-lg border border-white/70 bg-white/82 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="h-4 w-36 animate-pulse rounded-full bg-indigo-100" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="grid gap-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-11/12 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-8/12 animate-pulse rounded-full bg-slate-100" />
          </div>
        </section>
      </div>
    </main>
  );
}
