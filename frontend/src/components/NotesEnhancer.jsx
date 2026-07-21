import { useState } from "react";
import { BookMarked, Loader } from "lucide-react";
import { enhanceNotes, generateExamPaper } from "../api";

const MODES = [
  { id: "summary",   label: "Chapter Summary",    emoji: "📝" },
  { id: "keypoints", label: "Key Points",          emoji: "🎯" },
  { id: "formulas",  label: "Formulas & Theorems", emoji: "🔢" },
  { id: "revision",  label: "1-Page Revision",     emoji: "⚡" },
];

export default function NotesEnhancer({ notebook, lang, t }) {
  const [mode, setMode] = useState("summary");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paperMode, setPaperMode] = useState(false);
  const [paperResult, setPaperResult] = useState(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [marks, setMarks] = useState({ m1: 5, m2: 3, m5: 2 });

  async function handleEnhance() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await enhanceNotes(notebook.notebook_id, mode, lang);
      setResult(res.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaper() {
    setPaperLoading(true);
    setPaperResult(null);
    try {
      const res = await generateExamPaper(notebook.notebook_id, marks.m1, marks.m2, marks.m5, lang);
      setPaperResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaperLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold mb-2 text-textMain neon-text flex items-center gap-2">
        <BookMarked size={20} className="text-sage" /> {t.notesEnhancerTitle}
      </h2>
      <p className="text-inkSoft mb-6">{t.notesEnhancerSub}</p>

      {/* Tab: Enhance vs Exam Paper */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setPaperMode(false)}
          className={`text-sm px-4 py-2 rounded-sm border transition ${!paperMode ? "bg-ink text-paper border-ink shadow-neon" : "border-paperLine text-inkSoft hover:border-ink"}`}>
          Notes Enhancer
        </button>
        <button onClick={() => setPaperMode(true)}
          className={`text-sm px-4 py-2 rounded-sm border transition ${paperMode ? "bg-sage text-paper border-sage shadow-neonLime" : "border-paperLine text-inkSoft hover:border-sage"}`}>
          📄 Exam Paper Generator
        </button>
      </div>

      {!paperMode ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`p-3 rounded-sm border text-left text-xs transition lift-on-hover ${mode === m.id ? "border-sage bg-sage/10 text-textMain shadow-neonLime" : "border-paperLine text-inkSoft hover:border-sage"}`}>
                <p className="text-xl mb-1">{m.emoji}</p>
                <p className="font-medium">{m.label}</p>
              </button>
            ))}
          </div>

          <button onClick={handleEnhance} disabled={loading}
            className="w-full bg-sage text-paper py-3 rounded-sm font-semibold mb-6 shadow-neonLime hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader size={16} className="animate-spin" /> Analyzing notes…</> : `Generate ${MODES.find(m => m.id === mode)?.label}`}
          </button>

          {error && <p className="text-pen text-sm mb-4">{error}</p>}

          {result && (
            <div className="bg-surface border border-sage/30 rounded-md p-5 animate-fade-in">
              <pre className="text-sm text-textMain whitespace-pre-wrap font-body leading-relaxed">{result}</pre>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-surface border border-paperLine rounded-md p-5 mb-5 space-y-4">
            {[["1-mark questions", "m1"], ["2-mark questions", "m2"], ["5-mark questions", "m5"]].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-textMain">{label}</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMarks((m) => ({ ...m, [key]: Math.max(0, m[key] - 1) }))}
                    className="w-7 h-7 rounded-sm border border-paperLine text-inkSoft hover:border-ink hover:text-textMain transition">−</button>
                  <span className="w-6 text-center text-textMain font-mono text-sm">{marks[key]}</span>
                  <button onClick={() => setMarks((m) => ({ ...m, [key]: m[key] + 1 }))}
                    className="w-7 h-7 rounded-sm border border-paperLine text-inkSoft hover:border-ink hover:text-textMain transition">+</button>
                </div>
              </div>
            ))}
            <p className="text-xs text-inkSoft font-mono">
              Total marks: {marks.m1 + marks.m2 * 2 + marks.m5 * 5}
            </p>
          </div>

          <button onClick={handlePaper} disabled={paperLoading}
            className="w-full bg-sage text-paper py-3 rounded-sm font-semibold mb-6 shadow-neonLime hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2">
            {paperLoading ? <><Loader size={16} className="animate-spin" /> Generating paper…</> : "Generate Exam Paper"}
          </button>

          {paperResult && (
            <div className="bg-surface border border-sage/30 rounded-md p-5 animate-fade-in space-y-5">
              <p className="text-xs font-mono text-inkSoft">Total: {paperResult.total_marks} marks</p>
              {(paperResult.sections || []).map((sec, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-textMain mb-2">{sec.marks}-mark questions</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {(sec.questions || []).map((q, j) => (
                      <li key={j} className="text-sm text-inkSoft">{q}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
