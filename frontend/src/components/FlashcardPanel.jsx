import { useState } from "react";
import { Layers, Check, X } from "lucide-react";
import { generateFlashcards, gradeFlashcard } from "../api";
import SourceTag from "./SourceTag";

export default function FlashcardPanel({ notebook, lang, t }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [graded, setGraded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setFlipped({});
    setGraded({});
    try {
      const res = await generateFlashcards(notebook.notebook_id, 6, lang);
      setCards(res.cards);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleFlip(id) {
    setFlipped((f) => ({ ...f, [id]: !f[id] }));
  }

  async function handleGrade(card, knewIt) {
    await gradeFlashcard(notebook.notebook_id, card.id, knewIt);
    setGraded((g) => ({ ...g, [card.id]: knewIt }));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2 text-textMain neon-text">
          <Layers size={20} className="text-violet" /> {t.flashcardsTitle}
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-violet text-paper px-4 py-2 rounded-sm font-semibold text-sm hover:brightness-110 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? t.writingQuestions : cards.length ? t.newFlashcardsBtn : t.generateFlashcardsBtn}
        </button>
      </div>
      <p className="text-inkSoft mb-8">{t.flashcardsSub}</p>

      {error && <p className="text-pen text-sm mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-5 stagger-in">
        {cards.map((c) => {
          const isFlipped = flipped[c.id];
          const grade = graded[c.id];
          return (
            <div key={c.id} className="flex flex-col gap-2">
              <div
                className={`flip-card h-40 cursor-pointer ${isFlipped ? "flipped" : ""}`}
                onClick={() => toggleFlip(c.id)}
              >
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-front bg-surface border border-paperLine rounded-md p-4 flex flex-col justify-between">
                    <p className="text-sm font-medium text-textMain">{c.front}</p>
                    <span className="text-[10px] font-mono text-inkSoft self-end">{t.tapToFlip}</span>
                  </div>
                  <div className="flip-back bg-surface border border-violet/40 rounded-md p-4 flex flex-col justify-between">
                    <p className="text-sm text-textMain">{c.back}</p>
                    {c.page && <span className="self-end"><SourceTag page={c.page} source={c.source} /></span>}
                  </div>
                </div>
              </div>

              {isFlipped && (
                <div className="flex gap-2 animate-fade-in">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGrade(c, false); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm border transition ${
                      grade === false ? "border-pen bg-pen/10 text-pen shadow-neonRed" : "border-paperLine text-inkSoft hover:border-pen hover:text-pen"
                    }`}
                  >
                    <X size={13} /> {t.forgot}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGrade(c, true); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm border transition ${
                      grade === true ? "border-sage bg-sage/10 text-sage shadow-neonLime" : "border-paperLine text-inkSoft hover:border-sage hover:text-sage"
                    }`}
                  >
                    <Check size={13} /> {t.knewIt}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
