import { prisma } from "@/lib/db";

export type FounderInfo = {
  name: string | null;
  title: string;
  quote: string | null;
  photoUrl: string;
};

const DEFAULT_FOUNDER_PHOTO = "/brand/founder.jpg";
const DEFAULT_FOUNDER_TITLE_VI = "Người sáng lập changg changg";
const DEFAULT_FOUNDER_TITLE_EN = "Founder of changg changg";

export async function getSiteSettings() {
  try {
    return await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  } catch (error) {
    // Founder information is decorative and must never take the login page down.
    console.error("[site-settings] Database read failed; using defaults.", error);
    return null;
  }
}

export async function getFounderInfo(locale: string): Promise<FounderInfo> {
  const settings = await getSiteSettings();
  const isEn = locale === "en";
  const name = settings?.founderName?.trim() || null;
  const title =
    (isEn ? settings?.founderTitleEn : settings?.founderTitle)?.trim() ||
    (isEn ? DEFAULT_FOUNDER_TITLE_EN : DEFAULT_FOUNDER_TITLE_VI);
  const quote = (isEn ? settings?.founderQuoteEn : settings?.founderQuote)?.trim() || null;
  const photoUrl = settings?.founderPhotoUrl?.trim() || DEFAULT_FOUNDER_PHOTO;
  return { name, title, quote, photoUrl };
}
