import "server-only";
import type { Locale } from "@/i18n/config";

const dictionaries = {
  vi: () => import("./vi.json").then((module) => module.default),
  en: () => import("./en.json").then((module) => module.default)
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
