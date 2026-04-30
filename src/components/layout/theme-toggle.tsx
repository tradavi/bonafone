"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "bonafone-theme";
type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    setTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  // Avant hydration, on rend un bouton neutre pour éviter le mismatch.
  const isLight = mounted && theme === "light";
  const Icon = isLight ? Moon : Sun;
  const label = isLight ? "Passer en sombre" : "Passer en clair";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 hover:text-primary transition"
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:text-primary transition"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] hidden md:block">{isLight ? "Sombre" : "Clair"}</span>
    </button>
  );
}

/**
 * Script inline à injecter en <head> pour appliquer le thème AVANT le premier
 * paint. Évite le flash de couleur sombre quand l'utilisateur a choisi clair.
 */
export const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (_) {}
})();
`;
