"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/theme-toggle";
import { SUPPORTED_LANGS } from "@/i18n";
import { cn } from "@/lib/utils";

const LANG_LABELS: Record<string, string> = { en: "EN", bn: "বাং" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const switchLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-fuchsia-600 via-indigo-600 to-cyan-500 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xl font-semibold">{t("common.appName")}</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            {t("login.brandTagline")}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            {t("login.subtitle")}
          </p>
        </div>

        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} {t("common.appName")}. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex w-full lg:w-1/2 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-12">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold">{t("common.appName")}</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex items-center rounded-lg border bg-muted p-0.5 text-xs font-medium">
              {SUPPORTED_LANGS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => switchLang(lang)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-colors",
                    currentLang === lang
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {LANG_LABELS[lang] ?? lang.toUpperCase()}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-16">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
