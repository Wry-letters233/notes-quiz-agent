import { useState } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import { generateQuiz, answerQuestion, getHint } from "../api";
import SourceTag from "./SourceTag";

export default function QuizPanel({ notebook, lang, ownerId, t }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});
  const [selected, setSelected] = useState({});
  const [difficulty, setDifficulty] = useState("medium");
  const [adaptive, setAdaptive] = useState(false);
  const [hints, setHints] = useState({});     // qid -> {level, text, loading}
  const [startTime, setStartTime] = useState({});
  const [gamification, setGamification] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResults({});
    setSelected({});
    setHints({});
    setGamification(null);
    try {
      const res = await generateQuiz(notebook.notebook_id, 5, lang, difficulty, adaptive);
      setQuestions(res.questions);
      const now = Date.now();
      const times = {};
      res.questions.forEach((q) => { times[q.id] = now; });
      setStartTime(times);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(q, idx) {
    if (results[q.id]) return;
    setSelected((s) => ({ ...s, [q.id]: idx }));
    const timeMs = Date.now() - (startTime[q.id] || Date.now());
    const hintUsed = !!(hints[q.id]?.text);
    const res = await answerQuestion(notebook.notebook_id, q.id, idx, timeMs, ownerId, hintUsed);
    setResults((r) => ({ ...r, [q.id]: res }));
    if (res.gamification?.new_badges?.length) {
      setGamification(res.gamification);
      setTimeout(() => setGamification(null), 4000);
    }
  }

  async function handleHint(q, level) {
    setHints((h) => ({ ...h, [q.id]: { level, loading: true, text: null } }));
    try {
      const res = await getHint(notebook.notebook_id, q.id, level);
      setHints((h) => ({ ...h, [q.id]: { level, loading: false, text: res.hint } }));
    } catch {
      setHints((h) => ({ ...h, [q.id]: { level, loading: false, text: "Could not get hint." } }));
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2 text-textMain neon-text">
          <Sparkles size={20} className="text-magenta" /> {t.quizTitle}
        </h2>
        <button onClick={handleGenerate} disabled={loading}
          className="bg-magenta text-paper px-4 py-2 rounded-sm font-semibold text-sm shadow-neonMagenta hover:brightness-110 active:scale-95 transition disabled:opacity-50">
          {loading ? t.writingQuestions : questions.length ? t.newQuizBtn : t.generateBtn}
        </button>
      </div>
      <p className="text-inkSoft mb-4">{t.quizSub}</p>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-mono text-inkSoft">{t.difficulty}:</span>
        {["easy","medium","hard"].map((d) => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${difficulty === d ? "bg-ink text-paper border-ink shadow-neon" : "border-paperLine text-inkSoft hover:border-ink hover:text-textMain"}`}>
            {t[d]}
          </button>
        ))}
        <button onClick={() => setAdaptive((a) => !a)}
          className={`text-xs px-3 py-1.5 rounded-full border transition ml-2 ${adaptive ? "bg-amber text-paper border-amber shadow-neon" : "border-paperLine text-inkSoft hover:border-amber"}`}>
          🧠 {adaptive ? "Adaptive ON" : "Adaptive OFF"}
        </button>
      </div>

      {error && <p className="text-pen text-sm mb-4">{error}</p>}

      {/* New badge toast */}
      {gamification?.new_badges?.length > 0 && (
        <div className="mb-4 animate-fade-in bg-ink/20 border border-ink px-4 py-2 rounded-sm font-mono text-sm text-textMain shadow-neon">
          {gamification.new_badges.map((b) => `${b.emoji} ${b.name} unlocked!`).join(" · ")}
        </div>
      )}

      <div className="space-y-5 stagger-in">
        {questions.map((q, i) => {
          const result = results[q.id];
          const sel = selected[q.id];
          const hint = hints[q.id];
          return (
            <div key={q.id} className="bg-surface border border-paperLine rounded-md p-5 lift-on-hover">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-medium text-textMain">
                  <span className="font-mono text-xs text-ink mr-2">Q{i + 1}</span>{q.question}
                </p>
                {q.page && <SourceTag page={q.page} source={q.source} />}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  let style = "border-paperLine text-inkSoft hover:border-ink hover:text-textMain";
                  if (result) {
                    if (idx === result.correct_index) style = "border-sage bg-sage/10 text-textMain shadow-neonLime";
                    else if (idx === sel) style = "border-pen bg-pen/10 text-textMain shadow-neonRed";
                  } else if (idx === sel) style = "border-ink text-textMain shadow-neon";
                  return (
                    <button key={idx} onClick={() => handleSelect(q, idx)}
                      className={`text-left text-sm px-3 py-2 rounded-sm border transition-all active:scale-[0.98] ${style}`}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  );
                })}
              </div>

              {/* Hint system */}
              {!result && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-paperLine/50">
                  <Lightbulb size={13} className="text-amber" />
                  <span className="text-xs text-inkSoft">Hint:</span>
                  {[1, 2, 3].map((lvl) => (
                    <button key={lvl} onClick={() => handleHint(q, lvl)}
                      className={`text-xs px-2 py-1 rounded-sm border transition ${hint?.level === lvl ? "border-amber bg-amber/15 text-textMain" : "border-paperLine text-inkSoft hover:border-amber"}`}>
                      {lvl === 1 ? "💡 Subtle" : lvl === 2 ? "🔦 More" : "🔆 Strong"}
                    </button>
                  ))}
                </div>
              )}
              {hint?.loading && <p className="text-xs font-mono text-inkSoft mt-2">Getting hint…</p>}
              {hint?.text && (
                <div className="mt-2 px-3 py-2 bg-amber/10 border border-amber/30 rounded-sm text-xs text-textMain animate-fade-in">
                  {hint.text}
                </div>
              )}

              {result && (
                <div className="mt-3 text-sm text-inkSoft animate-fade-in">
                  <span className={result.correct ? "text-sage font-semibold" : "text-pen font-semibold"}>
                    {result.correct ? t.correct + " " : t.incorrect + " "}
                  </span>
                  {q.explanation}
                  <span className="block text-xs font-mono mt-1 text-ink">
                    Next review: {result.next_review} (in {result.sm2_interval}d)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
