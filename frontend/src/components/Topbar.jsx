import { useEffect, useState } from "react";
import { LogOut, Flame, Target } from "lucide-react";
import { getStats } from "../api";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ user, notebook, onLogout, lang, setLang, theme, setTheme, t }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!notebook) return;
    let active = true;
    getStats(notebook.notebook_id).then((s) => { if (active) setStats(s); }).catch(() => {});
    const interval = setInterval(() => {
      getStats(notebook.notebook_id).then((s) => { if (active) setStats(s); }).catch(() => {});
    }, 4000);
    return () => { active = false; clearInterval(interval); };
  }, [notebook]);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-10 py-4 border-b border-paperLine bg-surface/60 backdrop-blur-sm">
      <div>
        <p className="text-sm text-inkSoft">
          {t.welcomeBack} <span className="text-textMain font-medium">{user.name.split(" ")[0]}</span>
        </p>
      </div>

      <div className="flex items-center gap-5">
        {stats && (
          <div className="hidden sm:flex items-center gap-5 text-xs font-mono text-inkSoft">
            <span className="flex items-center gap-1.5">
              <Target size={13} className="text-sage" /> {stats.mastered} {t.mastered}
            </span>
            <span className="flex items-center gap-1.5">
              <Flame size={13} className="text-pen" /> {stats.due_today} {t.dueToday}
            </span>
          </div>
        )}

        <ThemeToggle theme={theme} setTheme={setTheme} />
        <LanguageToggle lang={lang} setLang={setLang} />

        <div className="flex items-center gap-3 pl-4 border-l border-paperLine">
          <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold shadow-neon">
            {initials}
          </div>
          <button
            onClick={onLogout}
            className="text-inkSoft hover:text-pen transition"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
