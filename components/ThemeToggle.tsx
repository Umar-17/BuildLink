"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/** Light/dark switch with monochrome vector icons. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("lh-theme", next);
    } catch {}
    setDark(!dark);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-card text-mute transition-colors hover:border-line-hover hover:text-ink active:scale-[0.97]"
    >
      {dark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  );
}
