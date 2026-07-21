import { useEffect, useState } from "react";
import { Upload, MessageCircleQuestion, ListChecks, RotateCcw, Plus,
         BarChart3, BookOpen, Layers, Timer, BookMarked } from "lucide-react";
import { getNotebooks } from "../api";

export default function Sidebar({ tab, setTab, notebook, ownerId, onSwitchNotebook, t }) {
  const [all, setAll] = useState([]);

  useEffect(() => {
    if (!ownerId) return;
    getNotebooks(ownerId).then((r) => setAll(r.notebooks)).catch(() => {});
  }, [ownerId, notebook]);

  const tabs = [
    { id: "upload",   label: notebook ? t.newNotebook : t.uploadNotes, icon: notebook ? Plus : Upload },
    { id: "ask",      label: t.askDoubt,           icon: MessageCircleQuestion, disabled: !notebook },
    { id: "quiz",     label: t.generateQuiz,        icon: ListChecks,           disabled: !notebook },
    { id: "exam",     label: t.examMode,            icon: Timer,                disabled: !notebook },
    { id: "flashcards",label: t.flashcardsTitle,   icon: Layers,               disabled: !notebook },
    { id: "enhancer", label: t.notesEnhancerTitle, icon: BookMarked,           disabled: !notebook },
    { id: "review",   label: t.review,              icon: RotateCcw,            disabled: !notebook },
    { id: "dashboard",label: t.dashboard,           icon: BarChart3,            disabled: !notebook },
  ];

  const others = all.filter((n) => n.notebook_id !== notebook?.notebook_id);

  return (
    <aside className="w-64 shrink-0 notebook-margin pl-6 pr-4 py-6 overflow-y-auto">
      <nav className="space-y-0.5">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button key={tb.id} disabled={tb.disabled} onClick={() => setTab(tb.id)}
              className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-sm text-sm font-medium transition-all
                ${active ? "bg-ink/15 text-textMain border border-ink/40 shadow-neon" : "text-inkSoft border border-transparent hover:bg-surface hover:translate-x-0.5"}
                ${tb.disabled ? "opacity-30 cursor-not-allowed" : ""}`}>
              <Icon size={14} className={active ? "text-ink" : ""} />
              <span className="truncate">{tb.label}</span>
            </button>
          );
        })}
      </nav>

      {notebook && (
        <div className="mt-6 text-xs text-inkSoft border-t border-paperLine pt-4 animate-fade-in">
          <p className="font-medium text-textMain mb-1.5">
            {notebook.num_files} {notebook.num_files > 1 ? t.filesLoaded : t.fileLoaded}
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {notebook.filenames.map((n) => <p key={n} className="font-mono truncate text-[11px]">· {n}</p>)}
          </div>
          <p className="mt-2 pt-2 border-t border-paperLine/60">{t.pagesChunks(notebook.num_pages, notebook.num_chunks)}</p>
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-5 border-t border-paperLine pt-4">
          <p className="text-xs font-medium text-textMain mb-2 flex items-center gap-1.5">
            <BookOpen size={12} /> {t.switchNotebook}
          </p>
          <div className="space-y-1">
            {others.map((nb) => (
              <button key={nb.notebook_id} onClick={() => onSwitchNotebook(nb)}
                className="w-full text-left text-[11px] font-mono text-inkSoft hover:text-ink truncate px-2 py-1.5 rounded-sm hover:bg-surface transition"
                title={nb.filenames.join(", ")}>
                · {nb.filenames[0]}{nb.num_files > 1 ? ` +${nb.num_files - 1}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
