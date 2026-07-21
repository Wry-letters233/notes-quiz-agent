import { useState, useEffect, useRef } from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { generateExam, answerQuestion } from "../api";
import SourceTag from "./SourceTag";

export default function ExamMode({ notebook, lang, ownerId, t }) {
  const [phase, setPhase] = useState("setup");   // setup | exam | result
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [timeLimit, setTimeLimit] = useState(600);
  const [negMarking, setNegMarking] = useState(0.25);
  const [numQ, setNumQ] = useState(10);
  const [loading, setLoading] = useState(false);
  const [startTimes, setStartTimes] = useState({});
  const timerRef = useRef(null);

  async function startExam() {
    setLoading(true);
    try {
      const res = await generateExam(notebook.notebook_id, numQ, lang, timeLimit, negMarking);
      setQuestions(res.questions);
      setTimeLeft(timeLimit);
      setSelected({});
      setSubmitted(false);
      const now = Date.now();
      const times = {};
      res.questions.forEach((q) => { times[q.id] = now; });
      setStartTimes(times);
      setPhase("exam");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (phase !== "exam" || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitted]);

  async function handleSubmit(autoSubmit = false) {
    clearInterval(timerRef.current);
    setSubmitted(true);
    // Grade answers
    for (const q of questions) {
      const sel = selected[q.id];
      if (sel !== undefined) {
        const timeMs = Date.now() - (startTimes[q.id] || Date.now());
        await answerQuestion(notebook.notebook_id, q.id, sel, timeMs, ownerId);
      }
    }
    setPhase("result");
  }

  function calcScore() {
    let score = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    questions.forEach((q) => {
      const sel = selected[q.id];
      if (sel === undefined) { skipped++; }
      else if (sel === q.correct_index) { score += 1; correct++; }
      else { score -= negMarking; wrong++; }
    });
    return { score: Math.max(0, score), correct, wrong, skipped, total: questions.length, maxScore: questions.length };
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const urgency = timeLeft < 60;

  if (phase === "setup") {
    return (
      <div className="max-w-xl">
        <h2 className="font-display text-2xl font-bold mb-2 text-textMain neon-text flex items-center gap-2">
          <Timer size={20} className="text-amber" /> {t.examMode}
        </h2>
        <p className="text-inkSoft mb-8">{t.examModeSub}</p>

        <div className="bg-surface border border-paperLine rounded-md p-6 space-y-5">
          <div>
            <label className="text-xs font-mono text-ink block mb-1.5">{t.numQuestions}</label>
            <select value={numQ} onChange={(e) => setNumQ(Number(e.target.value))}
              className="w-full bg-paper border border-paperLine rounded-sm px-3 py-2 text-textMain text-sm focus:border-ink focus:outline-none">
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-ink block mb-1.5">{t.timeLimit}</label>
            <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full bg-paper border border-paperLine rounded-sm px-3 py-2 text-textMain text-sm focus:border-ink focus:outline-none">
              {[[300,"5 min"],[600,"10 min"],[900,"15 min"],[1800,"30 min"]].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-ink block mb-1.5">{t.negativeMarking}</label>
            <select value={negMarking} onChange={(e) => setNegMarking(Number(e.target.value))}
              className="w-full bg-paper border border-paperLine rounded-sm px-3 py-2 text-textMain text-sm focus:border-ink focus:outline-none">
              {[[0,"None"],[0.25,"¼ mark"],[0.5,"½ mark"],[1,"Full mark"]].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button onClick={startExam} disabled={loading}
            className="w-full bg-amber text-paper py-3 rounded-sm font-semibold shadow-neon hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50">
            {loading ? "Generating exam…" : t.startExam}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "exam") {
    return (
      <div className="max-w-3xl">
        {/* Sticky timer bar */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-3 rounded-sm mb-6 border ${urgency ? "border-pen bg-pen/10 shadow-neonRed" : "border-ink bg-ink/10 shadow-neon"}`}>
          <span className="font-mono text-sm text-textMain">{questions.length} questions · -{negMarking} per wrong</span>
          <div className="flex items-center gap-2">
            {urgency && <AlertTriangle size={14} className="text-pen" />}
            <span className={`font-display font-bold text-lg ${urgency ? "text-pen" : "text-ink"}`}>{fmt(timeLeft)}</span>
          </div>
          <button onClick={() => handleSubmit(false)}
            className="text-xs font-mono bg-pen text-paper px-3 py-1.5 rounded-sm hover:brightness-110 transition">
            Submit now
          </button>
        </div>

        <div className="space-y-5">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-surface border border-paperLine rounded-md p-5">
              <p className="font-medium text-textMain mb-3">
                <span className="font-mono text-xs text-ink mr-2">Q{i + 1}</span>{q.question}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <button key={idx} onClick={() => setSelected((s) => ({ ...s, [q.id]: idx }))}
                    className={`text-left text-sm px-3 py-2 rounded-sm border transition-all active:scale-[0.98] ${
                      selected[q.id] === idx ? "border-ink bg-ink/15 text-textMain shadow-neon" : "border-paperLine text-inkSoft hover:border-ink hover:text-textMain"
                    }`}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Result
  const { score, correct, wrong, skipped, total, maxScore } = calcScore();
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-bold mb-6 text-textMain neon-text">Exam Result</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[["Score", `${score.toFixed(1)} / ${maxScore}`, "text-ink"],
          ["Correct", correct, "text-sage"],
          ["Wrong", wrong, "text-pen"],
          ["Skipped", skipped, "text-inkSoft"]].map(([label, val, cls]) => (
          <div key={label} className="bg-surface border border-paperLine rounded-md p-4 text-center lift-on-hover">
            <p className={`text-2xl font-display font-bold ${cls}`}>{val}</p>
            <p className="text-xs text-inkSoft mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-surface border border-paperLine rounded-md p-5 mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-textMain">Overall score</span>
          <span className="font-mono text-ink">{pct}%</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const sel = selected[q.id];
          const isCorrect = sel === q.correct_index;
          const isSkipped = sel === undefined;
          return (
            <div key={q.id} className={`bg-surface border rounded-md p-4 ${isCorrect ? "border-sage/40" : isSkipped ? "border-paperLine" : "border-pen/40"}`}>
              <p className="text-sm font-medium text-textMain mb-2">
                <span className="font-mono text-xs text-inkSoft mr-2">Q{i + 1}</span>{q.question}
              </p>
              <p className="text-xs text-inkSoft">
                {isSkipped ? <span className="text-inkSoft">⊘ Skipped</span>
                  : isCorrect ? <span className="text-sage">✓ Correct</span>
                  : <span className="text-pen">✗ Wrong — correct: {q.options[q.correct_index]}</span>}
              </p>
              {q.explanation && <p className="text-xs text-inkSoft mt-2 italic">{q.explanation}</p>}
            </div>
          );
        })}
      </div>
      <button onClick={() => setPhase("setup")} className="mt-6 bg-ink text-paper px-6 py-2.5 rounded-sm font-semibold shadow-neon hover:brightness-110 transition">
        Take another exam
      </button>
    </div>
  );
}
