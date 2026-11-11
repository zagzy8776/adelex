"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  localeLabels,
  locales,
  translate,
  type Locale,
  type MessageKey,
} from "@/app/lib/i18n/dictionaries";

const STORAGE_KEY = "adexec-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  locales: Locale[];
  labels: Record<Locale, string>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && (locales as string[]).includes(saved)) return saved as Locale;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  return defaultLocale;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  useEffect(() => {
    const detected = detectLocale();
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      locales,
      labels: localeLabels,
    }),
    [locale, setLocale, t],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}
