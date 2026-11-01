import type { SupportedLocale } from "../lib/slug";
import { DEFAULT_LOCALE, LOCALES, UI_STRINGS } from "./ui";

export function useTranslations(lang: SupportedLocale = DEFAULT_LOCALE) {
  return function t(key: string): string {
    return UI_STRINGS[lang]?.[key] ?? UI_STRINGS[DEFAULT_LOCALE]?.[key] ?? key;
  };
}

export function getLocaleFromUrl(url: URL | string): SupportedLocale {
  const pathname = typeof url === "string" ? url : url.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && first in LOCALES) {
    return first as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

export function hasMultilingualAlternates(path: string): boolean {
  const currentLocale = getLocaleFromUrl(path);
  let cleanPath = path;
  if (currentLocale !== DEFAULT_LOCALE) {
    cleanPath = path.replace(new RegExp(`^/${currentLocale}`), "");
    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  }
  return cleanPath === "/" || cleanPath === "/bulk-slug-generator";
}

export function getLocalizedPath(path: string, targetLocale: SupportedLocale): string {
  const currentLocale = getLocaleFromUrl(path);
  let cleanPath = path;
  if (currentLocale !== DEFAULT_LOCALE) {
    cleanPath = path.replace(new RegExp(`^/${currentLocale}`), "");
    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  }

  // Multilingual tool pages map directly to each locale equivalent
  if (cleanPath === "/" || cleanPath === "/bulk-slug-generator") {
    if (targetLocale === DEFAULT_LOCALE) {
      return cleanPath;
    }
    return cleanPath === "/" ? `/${targetLocale}` : `/${targetLocale}${cleanPath}`;
  }

  // English-only pages (guides, about, contact, privacy, 404):
  // When switching to another locale, send user to that locale's main tool
  if (targetLocale === DEFAULT_LOCALE) {
    return cleanPath;
  }
  return `/${targetLocale}`;
}
