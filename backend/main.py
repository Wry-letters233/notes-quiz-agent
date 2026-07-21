"""
main.py - FastAPI backend for Notes-to-Quiz Agent (Advanced Edition)
"""
import json
import uuid
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import rag_core
import quiz_store
import auth_store

app = FastAPI(title="Notes-to-Quiz Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────
class AskRequest(BaseModel):
    notebook_id: str
    question: str
    language: str = "en"

class QuizRequest(BaseModel):
    notebook_id: str
    num_questions: int = 5
    language: str = "en"
    difficulty: str = "medium"
    adaptive: bool = False  # if True, focus on weak topics

class ExamRequest(BaseModel):
    notebook_id: str
    num_questions: int = 10
    language: str = "en"
    time_limit_seconds: int = 600
    negative_marking: float = 0.25  # fraction to deduct per wrong answer

class AnswerRequest(BaseModel):
    notebook_id: str
    question_id: str
    selected_index: int
    time_ms: int = 0
    owner_id: Optional[str] = None
    hint_used: bool = False

class FlashcardRequest(BaseModel):
    notebook_id: str
    num_cards: int = 6
    language: str = "en"

class GradeRequest(BaseModel):
    notebook_id: str
    question_id: str
    knew_it: bool
    owner_id: Optional[str] = None

class HintRequest(BaseModel):
    notebook_id: str
    question_id: str
    hint_level: int = 1  # 1, 2, or 3

class NotesEnhanceRequest(BaseModel):
    notebook_id: str
    language: str = "en"
    mode: str = "summary"  # summary | keypoints | formulas | revision

class ExamPaperRequest(BaseModel):
    notebook_id: str
    marks_1: int = 5
    marks_2: int = 3
    marks_5: int = 2
    language: str = "en"


# ─── Upload & Notebooks ───────────────────────────────────────
@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...), owner_id: str = Form(...)):
    parsed = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(400, f"'{file.filename}' is not a PDF.")
        parsed.append((file.filename, await file.read()))
    try:
        meta = rag_core.create_notebook(parsed, owner_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    # count a quiz so first-quiz badge can fire
    user = quiz_store.load_user(owner_id)
    user["total_quizzes"] = user.get("total_quizzes", 0)
    return meta

@app.get("/notebooks")
def get_notebooks(owner_id: str):
    return {"notebooks": rag_core.list_notebooks(owner_id)}

@app.get("/notebook/{notebook_id}")
def get_notebook(notebook_id: str):
    try:
        return rag_core.get_notebook_meta(notebook_id)
    except ValueError:
        raise HTTPException(404, "Notebook not found.")

@app.post("/notebook/{notebook_id}/add-files")
async def add_files(notebook_id: str, files: List[UploadFile] = File(...)):
    parsed = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(400, f"'{file.filename}' is not a PDF.")
        parsed.append((file.filename, await file.read()))
    try:
        return rag_core.add_files_to_notebook(notebook_id, parsed)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception:
        raise HTTPException(404, "Notebook not found.")


# ─── Ask Doubt ────────────────────────────────────────────────
@app.post("/ask")
def ask_doubt(req: AskRequest):
    chunks = rag_core.retrieve_chunks(req.notebook_id, req.question, k=4)
    if not chunks:
        raise HTTPException(404, "No matching notebook found, or notes are empty.")
    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in chunks)
    lang_inst = "Respond in Hindi (Devanagari script)." if req.language == "hi" else "Respond in English."
    system_prompt = (
        "You are a helpful study assistant. Answer ONLY using the provided notes context. "
        f"{lang_inst} "
        "Be clear and detailed. End with: (Source: <filename>, Page <n>)"
    )
    answer = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}\n\nQUESTION: {req.question}")
    return {"answer": answer, "sources": [{"page": c["page"], "source": c["source"]} for c in chunks]}


# ─── Quiz ─────────────────────────────────────────────────────
@app.post("/quiz/generate")
def generate_quiz(req: QuizRequest):
    # Adaptive mode: bias sampling toward weak sources
    weak_sources = []
    if req.adaptive:
        weak = quiz_store.get_weak_source_files(req.notebook_id)
        weak_sources = [w["source"] for w in weak[:2]]

    sample = rag_core.sample_chunks_for_quiz(
        req.notebook_id, n=req.num_questions + 3, prefer_sources=weak_sources
    )
    if not sample:
        raise HTTPException(404, "Notebook not found or has no content.")

    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in sample)
    lang_inst = "Hindi (Devanagari script)" if req.language == "hi" else "English"
    diff_map = {
        "easy":   "Test basic recall of definitions and simple facts.",
        "medium": "Test understanding and application, not just recall.",
        "hard":   "Test deep analysis, comparison between concepts, and reasoning.",
    }
    diff_inst = diff_map.get(req.difficulty, diff_map["medium"])
    system_prompt = (
        f"Generate exactly {req.num_questions} MCQs (4 options each) in {lang_inst} "
        f"strictly from the context. {diff_inst} "
        "Return ONLY valid JSON list. Each item: "
        "{question, options[4], correct_index(0-3), explanation, page, source, topic(short concept name)}."
    )
    raw = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}")
    questions = _parse_questions(raw)
    quiz_store.save_questions(req.notebook_id, questions, kind="mcq")
    return {"questions": questions}


# ─── Exam Mode ────────────────────────────────────────────────
@app.post("/exam/generate")
def generate_exam(req: ExamRequest):
    sample = rag_core.sample_chunks_for_quiz(req.notebook_id, n=req.num_questions + 4)
    if not sample:
        raise HTTPException(404, "Notebook not found or has no content.")
    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in sample)
    lang_inst = "Hindi (Devanagari script)" if req.language == "hi" else "English"
    system_prompt = (
        f"Generate exactly {req.num_questions} challenging exam-style MCQs (4 options each) in {lang_inst}. "
        "Mix of difficulty levels. Return ONLY valid JSON list. "
        "Each item: {question, options[4], correct_index(0-3), explanation, page, source, topic}."
    )
    raw = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}")
    questions = _parse_questions(raw)
    quiz_store.save_questions(req.notebook_id, questions, kind="exam")
    return {
        "questions": questions,
        "time_limit_seconds": req.time_limit_seconds,
        "negative_marking": req.negative_marking,
    }


# ─── Answer + XP ─────────────────────────────────────────────
@app.post("/quiz/answer")
def answer_question(req: AnswerRequest):
    questions = quiz_store.load_questions(req.notebook_id)
    target = next((q for q in questions if q["id"] == req.question_id), None)
    if not target:
        raise HTTPException(404, "Question not found.")
    was_correct = req.selected_index == target["correct_index"]
    _, updated_q = quiz_store.record_answer(
        req.notebook_id, req.question_id, was_correct, req.time_ms
    )
    gamification = {}
    if req.owner_id:
        gamification = quiz_store.award_xp(req.owner_id, was_correct, req.hint_used)
    return {
        "correct": was_correct,
        "correct_index": target["correct_index"],
        "explanation": target["explanation"],
        "mastered": updated_q["mastered"],
        "next_review": updated_q["next_review"],
        "sm2_interval": updated_q["sm2_interval"],
        "gamification": gamification,
    }


# ─── Hint System ──────────────────────────────────────────────
@app.post("/quiz/hint")
def get_hint(req: HintRequest):
    questions = quiz_store.load_questions(req.notebook_id)
    target = next((q for q in questions if q["id"] == req.question_id), None)
    if not target:
        raise HTTPException(404, "Question not found.")

    chunks = rag_core.retrieve_chunks(req.notebook_id, target["question"], k=2)
    context = "\n".join(c["text"] for c in chunks)

    level_prompts = {
        1: "Give a very subtle hint (one sentence) that points the student in the right direction WITHOUT revealing the answer or any option text.",
        2: "Give a moderate hint that narrows down the answer to 2 possibilities. Do NOT state the answer directly.",
        3: "Give a strong hint that almost gives away the answer, but still requires the student to make the final connection.",
    }
    prompt = level_prompts.get(req.hint_level, level_prompts[1])
    system_prompt = f"You are a tutor giving hints. {prompt} Question: {target['question']}"
    hint = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}")
    return {"hint": hint, "hint_level": req.hint_level}


# ─── Flashcards ───────────────────────────────────────────────
@app.post("/flashcards/generate")
def generate_flashcards(req: FlashcardRequest):
    sample = rag_core.sample_chunks_for_quiz(req.notebook_id, n=req.num_cards + 3)
    if not sample:
        raise HTTPException(404, "Notebook not found or has no content.")
    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in sample)
    lang_inst = "Hindi (Devanagari script)" if req.language == "hi" else "English"
    system_prompt = (
        f"Create exactly {req.num_cards} flashcards in {lang_inst} from the context. "
        "Each card: short 'front' (term/concept), concise 'back' (1-2 sentence definition). "
        "Return ONLY valid JSON list: [{front, back, page, source}]."
    )
    raw = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}")
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        cards_raw = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(500, "Flashcard generation failed. Try again.")
    cards = [{"id": str(uuid.uuid4())[:8], **c} for c in cards_raw]
    quiz_store.save_questions(req.notebook_id, cards, kind="flashcard")
    return {"cards": cards}

@app.post("/flashcards/grade")
def grade_flashcard(req: GradeRequest):
    _, updated_q = quiz_store.record_answer(req.notebook_id, req.question_id, req.knew_it)
    gamification = {}
    if req.owner_id:
        gamification = quiz_store.award_xp(req.owner_id, req.knew_it)
    return {"mastered": updated_q["mastered"], "next_review": updated_q["next_review"], "gamification": gamification}


# ─── Smart Notes Enhancer ────────────────────────────────────
@app.post("/notes/enhance")
def enhance_notes(req: NotesEnhanceRequest):
    # Get a bigger spread of chunks for notes enhancement
    sample = rag_core.sample_chunks_for_quiz(req.notebook_id, n=15)
    if not sample:
        raise HTTPException(404, "Notebook not found or has no content.")
    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in sample)
    lang_inst = "Hindi (Devanagari script)" if req.language == "hi" else "English"

    prompts = {
        "summary": (
            f"Write a clear chapter-wise summary in {lang_inst} of the provided notes. "
            "Use headings for each topic. Keep it concise but complete."
        ),
        "keypoints": (
            f"Extract the most important key points and concepts in {lang_inst} from these notes. "
            "Format as a numbered list. Group related points under sub-headings."
        ),
        "formulas": (
            f"Extract all formulas, equations, theorems, and definitions in {lang_inst} from these notes. "
            "For each: write the name, the formula/definition, and a one-line explanation."
        ),
        "revision": (
            f"Create a concise 1-page revision sheet in {lang_inst} covering the most critical points. "
            "Include: key concepts, important terms, must-remember facts, and common exam traps. "
            "Format clearly with sections."
        ),
    }
    system_prompt = prompts.get(req.mode, prompts["summary"])
    result = rag_core.chat_completion(system_prompt, f"NOTES:\n{context}")
    return {"result": result, "mode": req.mode}


# ─── Exam Paper Generator ────────────────────────────────────
@app.post("/exam/paper")
def generate_exam_paper(req: ExamPaperRequest):
    sample = rag_core.sample_chunks_for_quiz(req.notebook_id, n=20)
    if not sample:
        raise HTTPException(404, "Notebook not found or has no content.")
    context = "\n\n".join(f"[{c['source']} - Page {c['page']}]\n{c['text']}" for c in sample)
    lang_inst = "Hindi (Devanagari script)" if req.language == "hi" else "English"
    total = req.marks_1 + req.marks_2 * 2 + req.marks_5 * 5
    system_prompt = (
        f"Generate an exam paper in {lang_inst} with: "
        f"{req.marks_1} one-mark questions, {req.marks_2} two-mark questions, {req.marks_5} five-mark questions. "
        f"Total marks: {total}. "
        "Return ONLY valid JSON: {sections: [{marks: N, questions: [string]}]}"
    )
    raw = rag_core.chat_completion(system_prompt, f"CONTEXT:\n{context}")
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        paper = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(500, "Paper generation failed. Try again.")
    paper["total_marks"] = total
    return paper


# ─── Stats & Gamification ────────────────────────────────────
@app.get("/quiz/due/{notebook_id}")
def get_due(notebook_id: str):
    return {"questions": quiz_store.get_due_questions(notebook_id)}

@app.get("/notebook/{notebook_id}/stats")
def get_stats(notebook_id: str):
    return quiz_store.get_stats(notebook_id)

@app.get("/user/{owner_id}/profile")
def get_profile(owner_id: str):
    return quiz_store.load_user(owner_id)

@app.get("/notebook/{notebook_id}/weak-topics")
def get_weak_topics(notebook_id: str):
    return {"weak_topics": quiz_store.get_weak_topics(notebook_id)}

@app.get("/health")
def health():
    return {"status": "ok"}


# ─── Helpers ─────────────────────────────────────────────────
def _parse_questions(raw: str) -> list:
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        qs_raw = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(500, "Quiz generation produced invalid JSON. Please try again.")
    return [{"id": str(uuid.uuid4())[:8], **q} for q in qs_raw]
