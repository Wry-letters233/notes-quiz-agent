import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-full border border-paperLine flex items-center justify-center text-inkSoft hover:text-ink hover:border-ink transition"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
