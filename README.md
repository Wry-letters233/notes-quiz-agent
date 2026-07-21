<div align="center">

# 📚 Notes → Quiz Agent

### An AI study platform that turns your PDF notes into cited answers, adaptive quizzes, flashcards, and full mock exams — running entirely on your own machine.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6F00?style=flat-square)](https://www.trychroma.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#license)

[![Offline First](https://img.shields.io/badge/🔒-100%25_Offline_Capable-brightgreen?style=flat-square)]()
[![Zero API Cost](https://img.shields.io/badge/💸-Zero_API_Cost-brightgreen?style=flat-square)]()
[![Bilingual](https://img.shields.io/badge/🌐-English_%2F_Hindi-blueviolet?style=flat-square)]()

</div>

---

## Overview

**Notes → Quiz Agent** is a full-stack Retrieval-Augmented Generation (RAG) application built for students. Upload one or many PDFs, and it becomes a personal AI tutor that:

- answers your doubts **with exact page-level citations**,
- generates **adaptive quizzes** that focus on your weak topics,
- runs **timed mock exams** with negative marking,
- builds **spaced-repetition flashcards** (Anki-style SM-2 scheduling),
- and rewrites your notes into **summaries, formula sheets, and exam papers**.

Every piece of intelligence — embeddings *and* the LLM — runs **locally**. No OpenAI key, no cloud bill, no data leaving your laptop.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📖 Core Study Tools
- Multi-PDF upload merged into one searchable notebook
- Switch between multiple saved notebooks
- **Ask a Doubt** — RAG-grounded answers cited by filename + page
- **Quiz Mode** — MCQs at Easy / Medium / Hard difficulty
- **Flashcards** — flip-card front/back, self-graded
- **Exam Mode** — timed test with configurable negative marking
- **Notes Enhancer** — chapter summaries, key points, formula sheets, 1-page revision sheets
- **Auto Exam Paper Generator** — 1/2/5-mark question blueprints

</td>
<td width="50%" valign="top">

### 🧠 Intelligence Layer
- **Adaptive Learning Engine** — tracks per-topic accuracy, biases new questions toward weak areas
- **SM-2 Spaced Repetition** — real Anki-style scheduling (1d → 3d → 7d → 15d+)
- **3-Level Hint System** — progressive LLM-generated hints instead of instant answers
- **Citation Transparency** — every answer/question states its exact source

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 Analytics & Motivation
- Performance dashboard — mastery %, accuracy, avg. time/question
- Weak-topic heatmap
- XP system, daily streaks, unlockable badges
- Persistent level + XP bar

</td>
<td width="50%" valign="top">

### 🎨 Experience
- **Dark (neon)** and **Light** theme, one click toggle
- **English / Hindi** toggle — UI *and* AI output both switch
- Local, name-based login (no password, no server accounts)
- Fully responsive, animated, glassmorphism-accented UI

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
                       ┌─────────────────────────────────────────┐
                       │              React Frontend              │
                       │   (Vite · Tailwind · lucide-react)        │
                       └───────────────────┬───────────────────────┘
                                            │ REST (fetch)
                       ┌───────────────────▼───────────────────────┐
                       │              FastAPI Backend               │
                       │   main.py · rag_core.py · quiz_store.py    │
                       └──────┬──────────────────────┬───────────────┘
                              │                       │
              ┌───────────────▼───────────┐  ┌────────▼─────────────┐
              │  sentence-transformers     │  │   Ollama (llama3.2)   │
              │  (local embeddings)        │  │   local LLM           │
              └───────────────┬────────────┘  └────────┬──────────────┘
                              │                          │
                       ┌───────▼───────┐         generates answers,
                       │   ChromaDB     │         quizzes, hints,
                       │ (vector store) │         summaries, exams
                       └────────────────┘
```

**Pipeline:**

```
PDF upload  → pdfplumber parses pages → LangChain chunks text (page-tagged)
            → sentence-transformers embeddings → ChromaDB vector store

Ask a doubt   → similarity search top-k chunks → LLM answers, cited
Quiz/Exam     → sample chunks (weak-topic-biased if adaptive) → LLM MCQs
Flashcards    → sample chunks → LLM front/back cards
Notes Enhancer→ broader chunk sample → LLM summary / formulas / exam paper
Every answer  → SM-2 scheduling + topic accuracy tracking + XP award
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, lucide-react |
| **Backend** | Python, FastAPI, Pydantic |
| **PDF Parsing** | pdfplumber |
| **Chunking** | LangChain text-splitters |
| **Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`) — 100% local |
| **Vector DB** | ChromaDB |
| **LLM** | Ollama (`llama3.2`) — local by default; OpenAI supported as a swap-in |
| **Storage** | Local JSON (users, quiz progress, XP) |

---

## 🚀 Getting Started

### 1. Install Ollama (one-time)

```bash
# https://ollama.com/download
ollama pull llama3.2
ollama serve
```

> Prefer a hosted model instead? Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...` in `.env`. Embeddings stay local either way.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
uvicorn main:app --reload --port 8000
```

First run downloads the embedding model (~80 MB) once, then it's fully offline. Interactive API docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — backend and Ollama must both be running.

---

## 📁 Project Structure

```
notes-quiz-agent/
├── backend/
│   ├── main.py            # FastAPI routes
│   ├── rag_core.py        # PDF parsing, chunking, embeddings, LLM calls
│   ├── quiz_store.py       # SM-2 scheduling, topic tracking, XP/streaks
│   ├── auth_store.py       # Optional real-auth scaffold (salted hashes)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Login, Dashboard, QuizPanel, ExamMode, ...
│   │   ├── translations.js # EN / HI strings
│   │   ├── api.js
│   │   └── App.jsx
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔒 Privacy & Cost

| | |
|---|---|
| **Data leaves your machine?** | Never — embeddings, vector store, and LLM all run locally |
| **API key required?** | No, by default |
| **Works offline?** | Yes, after the one-time setup/downloads |
| **Ongoing cost** | $0 |

---

## 🗺️ Roadmap

- [ ] Real authentication (signup/login) using the included `auth_store.py`
- [ ] Class/group leaderboard
- [ ] Voice mode (speech-to-text question, TTS answer)
- [ ] Export flashcards to Anki `.apkg`
- [ ] Cloud deployment guide (Render/Railway + Vercel)

---

## 📄 License

This project is available under the [MIT License](LICENSE).

---

<div align="center">

Built as a personal project exploring RAG pipelines, local LLMs, and adaptive learning systems.

</div>
