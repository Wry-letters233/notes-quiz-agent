"""
quiz_store.py
- SM-2 spaced repetition algorithm (Anki-style)
- Adaptive learning (weak topic tracking + weighted quiz sampling)
- XP / streak / badge gamification
"""
import json
from pathlib import Path
from datetime import date, timedelta, datetime
import math

DATA_DIR = Path(__file__).parent / "data"


def _quiz_path(notebook_id: str) -> Path:
    return DATA_DIR / notebook_id / "quiz.json"

def _user_path(owner_id: str) -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    return DATA_DIR / f"user_{owner_id}.json"


# ─── SM-2 algorithm ───────────────────────────────────────────
def _sm2_next(easiness: float, interval: int, repetitions: int, quality: int):
    """
    SM-2 algorithm (Anki style):
    quality: 0=total blank, 1=wrong, 2=wrong but familiar, 3=correct hard, 4=correct, 5=perfect
    Returns: (next_interval_days, new_easiness, new_repetitions)
    """
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 3
        else:
            interval = math.ceil(interval * easiness)
        repetitions += 1

    easiness = max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return interval, easiness, repetitions


# ─── Question CRUD ────────────────────────────────────────────
def save_questions(notebook_id: str, questions: list, kind: str = "mcq"):
    path = _quiz_path(notebook_id)
    existing = load_questions(notebook_id)
    today = date.today().isoformat()
    for q in questions:
        q["kind"] = q.get("kind", kind)
        q["next_review"] = today
        q["wrong_count"] = 0
        q["mastered"] = False
        q["attempts"] = 0
        q["correct_attempts"] = 0
        q["sm2_easiness"] = 2.5
        q["sm2_interval"] = 1
        q["sm2_repetitions"] = 0
        q["topic"] = q.get("topic") or q.get("source", "general")
        q["time_taken_ms"] = []
    existing.extend(questions)
    path.parent.mkdir(exist_ok=True)
    with open(path, "w") as f:
        json.dump(existing, f, indent=2)
    return questions


def load_questions(notebook_id: str) -> list:
    path = _quiz_path(notebook_id)
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)


def get_due_questions(notebook_id: str) -> list:
    today = date.today().isoformat()
    return [q for q in load_questions(notebook_id)
            if not q["mastered"] and q.get("next_review", today) <= today]


def record_answer(notebook_id: str, question_id: str, was_correct: bool,
                  time_ms: int = 0, quality: int = None):
    """
    SM-2 based answer recording.
    quality: 0-5 scale (auto-derived from was_correct if not provided)
    """
    questions = load_questions(notebook_id)
    today = date.today()
    updated_q = None
    for q in questions:
        if q["id"] == question_id:
            q["attempts"] = q.get("attempts", 0) + 1
            if time_ms > 0:
                q.setdefault("time_taken_ms", []).append(time_ms)
            if was_correct:
                q["correct_attempts"] = q.get("correct_attempts", 0) + 1
                q["wrong_count"] = max(0, q.get("wrong_count", 0) - 1)

            # Derive SM-2 quality
            if quality is None:
                quality = 4 if was_correct else 1

            interval, easiness, reps = _sm2_next(
                q.get("sm2_easiness", 2.5),
                q.get("sm2_interval", 1),
                q.get("sm2_repetitions", 0),
                quality
            )
            q["sm2_easiness"] = round(easiness, 3)
            q["sm2_interval"] = interval
            q["sm2_repetitions"] = reps
            q["next_review"] = (today + timedelta(days=interval)).isoformat()
            q["mastered"] = (reps >= 5 and was_correct)
            updated_q = q
            break

    with open(_quiz_path(notebook_id), "w") as f:
        json.dump(questions, f, indent=2)
    return questions, updated_q


# ─── Adaptive learning ────────────────────────────────────────
def get_weak_topics(notebook_id: str, top_n: int = 5) -> list:
    questions = load_questions(notebook_id)
    topic_stats = {}
    for q in questions:
        topic = q.get("topic", "general")
        attempts = q.get("attempts", 0)
        correct = q.get("correct_attempts", 0)
        if topic not in topic_stats:
            topic_stats[topic] = {"attempts": 0, "correct": 0}
        topic_stats[topic]["attempts"] += attempts
        topic_stats[topic]["correct"] += correct

    weak = []
    for topic, stats in topic_stats.items():
        if stats["attempts"] > 0:
            acc = stats["correct"] / stats["attempts"]
            weak.append({"topic": topic, "accuracy": round(acc * 100), "attempts": stats["attempts"]})

    weak.sort(key=lambda x: x["accuracy"])
    return weak[:top_n]


def get_weak_source_files(notebook_id: str) -> list:
    """Returns source files ranked by accuracy (weakest first)."""
    questions = load_questions(notebook_id)
    source_stats = {}
    for q in questions:
        src = q.get("source", "unknown")
        if src not in source_stats:
            source_stats[src] = {"attempts": 0, "correct": 0}
        source_stats[src]["attempts"] += q.get("attempts", 0)
        source_stats[src]["correct"] += q.get("correct_attempts", 0)

    ranked = []
    for src, stats in source_stats.items():
        if stats["attempts"] > 0:
            acc = round(stats["correct"] / stats["attempts"] * 100)
            ranked.append({"source": src, "accuracy": acc, "attempts": stats["attempts"]})
    ranked.sort(key=lambda x: x["accuracy"])
    return ranked


# ─── Stats ────────────────────────────────────────────────────
def get_stats(notebook_id: str) -> dict:
    today = date.today().isoformat()
    questions = load_questions(notebook_id)
    mastered = sum(1 for q in questions if q["mastered"])
    due_today = sum(1 for q in questions if not q["mastered"] and q.get("next_review", today) <= today)
    total_attempts = sum(q.get("attempts", 0) for q in questions)
    correct_attempts = sum(q.get("correct_attempts", 0) for q in questions)
    accuracy = round((correct_attempts / total_attempts) * 100) if total_attempts else 0
    all_times = [t for q in questions for t in q.get("time_taken_ms", [])]
    avg_time = round(sum(all_times) / len(all_times) / 1000, 1) if all_times else 0
    return {
        "total_questions": len(questions),
        "mastered": mastered,
        "due_today": due_today,
        "total_attempts": total_attempts,
        "accuracy": accuracy,
        "avg_time_seconds": avg_time,
        "weak_topics": get_weak_topics(notebook_id),
    }


# ─── Gamification ─────────────────────────────────────────────
BADGES = {
    "first_quiz":    {"id": "first_quiz",   "name": "First Step",   "emoji": "🎯", "desc": "Completed your first quiz"},
    "quiz_master":   {"id": "quiz_master",  "name": "Quiz Master",  "emoji": "🏆", "desc": "Got 10 questions correct"},
    "streak_3":      {"id": "streak_3",     "name": "On Fire 🔥",   "emoji": "🔥", "desc": "3-day study streak"},
    "streak_7":      {"id": "streak_7",     "name": "Unstoppable",  "emoji": "⚡", "desc": "7-day study streak"},
    "perfectionist": {"id": "perfectionist","name": "Perfectionist","emoji": "💎", "desc": "100% accuracy in a quiz"},
    "scholar":       {"id": "scholar",      "name": "Scholar",      "emoji": "📚", "desc": "Mastered 25 questions"},
}


def load_user(owner_id: str) -> dict:
    path = _user_path(owner_id)
    if path.exists():
        return json.load(open(path))
    return {
        "owner_id": owner_id,
        "xp": 0,
        "streak": 0,
        "last_study_date": None,
        "badges": [],
        "total_correct": 0,
        "total_quizzes": 0,
    }


def _save_user(owner_id: str, data: dict):
    with open(_user_path(owner_id), "w") as f:
        json.dump(data, f, indent=2)


def award_xp(owner_id: str, was_correct: bool, hint_used: bool = False) -> dict:
    user = load_user(owner_id)
    today = date.today().isoformat()
    xp_gain = 0
    new_badges = []

    if was_correct:
        xp_gain = 5 if not hint_used else 2
        user["total_correct"] = user.get("total_correct", 0) + 1

    # Streak logic
    last = user.get("last_study_date")
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    if last == today:
        pass  # already studied today
    elif last == yesterday:
        user["streak"] = user.get("streak", 0) + 1
    else:
        user["streak"] = 1
    user["last_study_date"] = today

    # Streak bonus XP
    if user["streak"] >= 7:
        xp_gain += 10
    elif user["streak"] >= 3:
        xp_gain += 5

    user["xp"] = user.get("xp", 0) + xp_gain
    existing = set(user.get("badges", []))

    # Check badge conditions
    if "first_quiz" not in existing and user.get("total_quizzes", 0) >= 1:
        new_badges.append(BADGES["first_quiz"])
        existing.add("first_quiz")
    if "quiz_master" not in existing and user.get("total_correct", 0) >= 10:
        new_badges.append(BADGES["quiz_master"])
        existing.add("quiz_master")
    if "streak_3" not in existing and user["streak"] >= 3:
        new_badges.append(BADGES["streak_3"])
        existing.add("streak_3")
    if "streak_7" not in existing and user["streak"] >= 7:
        new_badges.append(BADGES["streak_7"])
        existing.add("streak_7")
    if "scholar" not in existing and user.get("total_correct", 0) >= 25:
        new_badges.append(BADGES["scholar"])
        existing.add("scholar")

    user["badges"] = list(existing)
    _save_user(owner_id, user)
    return {"xp_gained": xp_gain, "new_badges": new_badges, "user": user}
