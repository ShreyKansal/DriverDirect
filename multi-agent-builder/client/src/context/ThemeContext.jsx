"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme(event) {
    const next = theme === "light" ? "dark" : "light";

    const apply = () => {
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
      setTheme(next);
    };

    if (!document.startViewTransition) {
      apply();
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(apply);

    transition.ready.then(() => {
      const expanding = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        { clipPath: next === "dark" ? expanding : [...expanding].reverse() },
        {
          duration: 400,
          easing: "ease-in",
          pseudoElement: next === "dark"
            ? "::view-transition-new(root)"
            : "::view-transition-old(root)",
        }
      );
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
