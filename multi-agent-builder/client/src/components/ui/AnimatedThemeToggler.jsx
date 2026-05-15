"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export function AnimatedThemeToggler({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-hairlineStrong bg-panel text-body transition hover:bg-canvasSoft hover:text-ink ${className}`}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}
