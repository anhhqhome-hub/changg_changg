import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { isLocale, type Locale } from "@/i18n/config";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "changg changg",
  description: "English teaching, examination, and analytics for Vietnamese classes.",
  icons: {
    icon: "/brand/logo-mark.svg"
  }
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale as Locale} suppressHydrationWarning>
      <body className={beVietnam.className}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
