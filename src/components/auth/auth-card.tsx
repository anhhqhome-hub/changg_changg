import Link from "next/link";
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
  footerHref: string;
  footerLabel: string;
  beforeCard?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <BrandLogo className="mb-6 justify-center" />
        {beforeCard}
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            <Link href={footerHref} className="mt-5 block text-center text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              {footerLabel}
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
