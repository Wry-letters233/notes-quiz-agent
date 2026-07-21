import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { askDoubt } from "../api";
import SourceTag from "./SourceTag";

function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter((s) => {
    const key = `${s.source}-${s.page}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function DoubtPanel({ notebook, lang, t }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion("");
    setLoading(true);
    setHistory((h) => [...h, { role: "user", text: q }]);
    try {
      const res = await askDoubt(notebook.notebook_id, q, lang);
      setHistory((h) => [...h, { role: "agent", text: res.answer, sources: res.sources }]);
    } catch (e) {
      setHistory((h) => [...h, { role: "agent", text: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col h-full">
      <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2 text-textMain neon-text">
        <MessageCircleQuestion size={20} className="text-ink" /> {t.askTitle}
      </h2>
      <p className="text-inkSoft mb-6">
        {t.askSub} <span className="font-mono text-sm text-ink">({notebook.filenames[0]}{notebook.num_files > 1 ? ` +${notebook.num_files - 1}` : ""})</span>
      </p>

      <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-[55vh] pr-1">
        {history.length === 0 && (
          <p className="text-sm text-inkSoft italic">{t.askEmpty}</p>
        )}
        {history.map((h, i) => (
          <div key={i} className={`animate-fade-in ${h.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block px-4 py-3 rounded-md text-sm max-w-[85%] ${
              h.role === "user"
                ? "bg-ink text-paper shadow-neon"
                : "bg-surface border border-paperLine text-textMain"
            }`}>
              <p className="whitespace-pre-wrap">{h.text}</p>
              {h.sources && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {dedupeSources(h.sources).map((s, idx) => (
                    <SourceTag key={idx} page={s.page} source={s.source} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs font-mono text-ink">{t.searching}</p>}
      </div>

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.askPlaceholder}
          className="flex-1 border border-paperLine rounded-sm px-4 py-2 bg-surface text-textMain placeholder:text-inkSoft/60 focus:outline-none focus:border-ink focus:shadow-neon transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper px-5 py-2 rounded-sm font-semibold hover:brightness-110 active:scale-95 shadow-neon transition disabled:opacity-50"
        >
          {t.askBtn}
        </button>
      </form>
    </div>
  );
}
