# Notes → Quiz Agent (Advanced Edition)

A full RAG-based study platform: upload PDF notes, ask cited doubts,
generate adaptive quizzes/flashcards/exams, get AI-written summaries and
exam papers, track real analytics, and stay motivated with XP/streaks.

**Fully free to run** — embeddings are 100% local (sentence-transformers,
no API key ever) and the default LLM is Ollama (also local and free).
OpenAI is supported as an optional swap-in.

## Features

### Core study tools
- **Multiple notebooks** — upload several PDFs into one notebook, switch
  between previously-created notebooks from the sidebar.
- **Ask a doubt** — RAG-grounded answers, cited by filename + page.
- **Smart Quiz Modes** — MCQ generation with Easy / Medium / Hard difficulty.
- **Flashcards** — flip-card front/back study mode, self-graded.
- **Exam Mode** — timed test (5/10/15/30 min), configurable negative
  marking, full result breakdown with per-question review.
- **Notes Enhancer** — turns your PDF into a chapter-wise summary, key
  points list, formula/theorem sheet, or 1-page revision sheet.
- **Auto Exam Paper Generator** — generates a blueprint exam paper with
  1-mark / 2-mark / 5-mark sections and a target total.

### Adaptive learning engine
- Every quiz/flashcard answer is tagged with a short **topic** name.
- The dashboard surfaces your **weakest topics** (lowest accuracy) as a
  heatmap.
- Toggle **Adaptive mode** in the Quiz tab to bias new questions toward
  your weak source files automatically.

### Spaced repetition (SM-2 / Anki-style)
- Real SM-2 algorithm: easiness factor + repetition count drive the next
  review interval (1d → 3d → 7d → 15d+, not a flat 2-day rule).
- Works for both MCQ quiz questions and flashcards.
- The **Review** tab only shows what's actually due today.

### Hint system
- Stuck on a quiz question? Request a hint in 3 escalating levels: a
  subtle nudge, a narrowed-down clue, or a near-complete hint — all
  generated live from your notes, never just handing over the answer
  outright at level 1.

### Performance analytics dashboard
- Mastery %, total attempts, accuracy %, and average time per question.
- Weak-topic heatmap (color-coded by accuracy).
- Per-file breakdown (pages, chunks indexed).

### Gamification
- XP for correct answers (less if a hint was used).
- Daily study streak tracking with bonus XP at 3-day and 7-day streaks.
- Unlockable badges: First Step, Quiz Master, On Fire, Unstoppable,
  Perfectionist, Scholar.
- Persistent level + XP bar shown at the top of the app.

### Other
- **Dark / light theme toggle** — neon "cyberpunk" dark mode and a clean
  light mode, switchable anytime, persisted across sessions.
- **English / Hindi toggle** — switches UI text *and* the language the AI
  generates answers/quizzes/flashcards in.
- **Citation transparency** — every AI answer and quiz question states the
  exact source filename and page it came from.

## Architecture

```
PDFs (1 or many) → pdfplumber parses pages → LangChain chunks text
                  → sentence-transformers embeddings (LOCAL, free)
                  → Chroma vector store (one collection per notebook)

Ask a doubt     → similarity search top-k chunks → LLM answers, cited
Generate quiz   → sample chunks (weak-source-biased if adaptive) → LLM MCQs
Exam mode       → harder mixed-difficulty MCQs + client-side timer/scoring
Flashcards      → sample chunks → LLM front/back cards
Notes enhancer  → broader chunk sample → LLM summary/keypoints/formulas
Hint            → re-retrieve relevant chunks → LLM hint at 1 of 3 levels
Every answer    → SM-2 scheduling + topic accuracy tracking + XP award
```

## 1. Set up the local LLM (Ollama) — one-time

```bash
# Install Ollama: https://ollama.com/download
ollama pull llama3.2
ollama serve
```

No account, no API key, no cost.

> Prefer OpenAI instead? Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...`
> in `.env`. Embeddings stay local either way.

## 2. Backend setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
uvicorn main:app --reload --port 8000
```

First run downloads the embedding model (~80MB) once, then it's fully
offline. Visit `http://localhost:8000/docs` for interactive API docs.

## 3. Frontend setup (React + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Backend + Ollama must both be running.

## Notes

- Login is name-only (no real password) — it just personalizes notebooks
  on this device via `localStorage`. A minimal real auth backend
  (`auth_store.py`, salted password hashes) is included if you want to
  wire up actual signup/login later.
- Theme, language, and login session persist per-browser via
  `localStorage`.

## Where to take this next

- Wire up `auth_store.py` for real signup/login.
- Add a class/group leaderboard (compare XP across users).
- Voice mode (speech-to-text question, TTS answer) using Web Speech API.
- Export flashcards to Anki's `.apkg` format.
- Deploy: backend on Render/Railway, frontend on Vercel/Netlify (Ollama
  needs a server with enough RAM, or swap to OpenAI for deployment).
