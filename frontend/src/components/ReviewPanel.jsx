import { useEffect, useState } from "react";
import { RotateCcw, Check, X } from "lucide-react";
import { getDueQuestions, answerQuestion, gradeFlashcard } from "../api";
import SourceTag from "./SourceTag";

export default function ReviewPanel({ notebook, t }) {
  const [due, setDue] = useState([]);
  const [results, setResults] = useState({});
  const [selected, setSelected] = useState({});
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [notebook]);

  async function load() {
    setLoading(true);
    const res = await getDueQuestions(notebook.notebook_id);
    setDue(res.questions);
    setResults({});
    setSelected({});
    setFlipped({});
    setLoading(false);
  }

  async function handleSelect(q, idx) {
    if (results[q.id]) return;
    setSelected((s) => ({ ...s, [q.id]: idx }));
    const res = await answerQuestion(notebook.notebook_id, q.id, idx);
    setResults((r) => ({ ...r, [q.id]: res }));
  }

  async function handleGrade(q, knewIt) {
    if (results[q.id]) return;
    const res = await gradeFlashcard(notebook.notebook_id, q.id, knewIt);
    setResults((r) => ({ ...r, [q.id]: { ...res, correct: knewIt } }));
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2 text-textMain neon-text">
        <RotateCcw size={20} className="text-pen" /> {t.reviewTitle}
      </h2>
      <p className="text-inkSoft mb-8">{t.reviewSub}</p>

      {loading && <p className="text-sm font-mono text-inkSoft">{t.checkingDue}</p>}

      {!loading && due.length === 0 && (
        <div className="border border-paperLine rounded-md p-8 text-center bg-surface animate-fade-in">
          <p className="font-display text-lg font-semibold mb-1 text-textMain">{t.nothingDue}</p>
          <p className="text-sm text-inkSoft">{t.nothingDueSub}</p>
        </div>
      )}

      <div className="space-y-5 stagger-in">
        {due.map((q, i) => {
          const result = results[q.id];
          const sel = selected[q.id];

          if (q.kind === "flashcard") {
            const isFlipped = flipped[q.id];
            return (
              <div key={q.id} className="bg-surface border border-pen/30 rounded-md p-5 lift-on-hover">
                <span className="font-mono text-xs text-pen block mb-2">REVIEW · {t.flashcardsTitle}</span>
                <div
                  className={`flip-card h-32 cursor-pointer ${isFlipped ? "flipped" : ""}`}
                  onClick={() => setFlipped((f) => ({ ...f, [q.id]: !f[q.id] }))}
                >
                  <div className="flip-card-inner relative w-full h-full">
                    <div className="flip-front bg-paper border border-paperLine rounded-md p-3 flex items-center justify-center text-center">
                      <p className="text-sm font-medium text-textMain">{q.front}</p>
                    </div>
                    <div className="flip-back bg-paper border border-violet/40 rounded-md p-3 flex items-center justify-center text-center">
                      <p className="text-sm text-textMain">{q.back}</p>
                    </div>
                  </div>
                </div>
                {isFlipped && !result && (
                  <div className="flex gap-2 mt-3 animate-fade-in">
                    <button onClick={() => handleGrade(q, false)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm border border-paperLine text-inkSoft hover:border-pen hover:text-pen transition">
                      <X size={13} /> {t.forgot}
                    </button>
                    <button onClick={() => handleGrade(q, true)} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm border border-paperLine text-inkSoft hover:border-sage hover:text-sage transition">
                      <Check size={13} /> {t.knewIt}
                    </button>
                  </div>
                )}
                {result && (
                  <p className="mt-3 text-sm text-inkSoft animate-fade-in">
                    {result.mastered ? (
                      <span className="text-sage font-mono text-xs">{t.masteredTag}</span>
                    ) : (
                      <span className="text-inkSoft font-mono text-xs">{t.backAgain} {result.next_review}</span>
                    )}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={q.id} className="bg-surface border border-pen/30 rounded-md p-5 lift-on-hover">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-medium text-textMain">
                  <span className="font-mono text-xs text-pen mr-2">REVIEW</span>
                  {q.question}
                </p>
                {q.page && <SourceTag page={q.page} source={q.source} />}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  let style = "border-paperLine text-inkSoft hover:border-ink hover:text-textMain";
                  if (result) {
                    if (idx === result.correct_index) style = "border-sage bg-sage/10 text-textMain shadow-neonLime";
                    else if (idx === sel) style = "border-pen bg-pen/10 text-textMain shadow-neonRed";
                  } else if (idx === sel) {
                    style = "border-ink text-textMain shadow-neon";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(q, idx)}
                      className={`text-left text-sm px-3 py-2 rounded-sm border transition-all active:scale-[0.98] ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {result && (
                <p className="mt-3 text-sm text-inkSoft animate-fade-in">
                  <span className={result.correct ? "text-sage font-semibold" : "text-pen font-semibold"}>
                    {result.correct ? t.correct + " " : t.stillOff + " "}
                  </span>
                  {q.explanation}
                  {result.mastered ? (
                    <span className="block text-xs font-mono mt-1 text-sage">{t.masteredTag}</span>
                  ) : (
                    <span className="block text-xs font-mono mt-1 text-inkSoft">{t.backAgain} {result.next_review}</span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
