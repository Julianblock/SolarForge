"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("solarforge.theme");
    const next = stored === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("solarforge.theme", next);
    setTheme(next);
  }

  return (
    <button className="btn btn-ghost" type="button" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
