import { useEffect, useState } from "react";

const STORAGE_KEY = "app-theme";

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(STORAGE_KEY) || "default";
  });

  useEffect(() => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setThemeState((t) => (t === "default" ? "github-dark" : "default"));
  }

  return { theme, toggleTheme };
}
