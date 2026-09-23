import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-slate-600">The page may have moved or you may not have access.</p>
        <Button asChild className="mt-4"><Link href="/vi">Home</Link></Button>
      </div>
    </main>
  );
}
