"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-slate-600">The app could not complete that action. Please try again.</p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-slate-500">Error ID: {error.digest}</p>
        ) : null}
        <Button className="mt-4" onClick={reset}>Retry</Button>
      </div>
    </main>
  );
}
