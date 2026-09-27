import Link from "next/link";
import { BookOpenText, Lightbulb, PenLine, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footerHref,
  footerLabel,
  beforeCard
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footerHref?: string;
  footerLabel?: string;
  beforeCard?: React.ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-screen w-full min-w-0 items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="auth-stationery auth-stationery-book"><BookOpenText /></div>
        <div className="auth-stationery auth-stationery-pen"><PenLine /></div>
        <div className="auth-stationery auth-stationery-light"><Lightbulb /></div>
        <div className="auth-stationery auth-stationery-spark"><Sparkles /></div>
      </div>
      <div className="w-full min-w-0 max-w-md">
        <BrandLogo className="mb-6 justify-center" />
        {beforeCard}
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            {footerHref && footerLabel ? (
              <Link href={footerHref} className="mt-5 block text-center text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                {footerLabel}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
