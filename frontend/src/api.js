const BASE_URL = "http://localhost:8000";

const _post = (url, body) =>
  fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => {
    if (!r.ok) throw new Error((await r.json()).detail || "Request failed");
    return r.json();
  });

const _get = (url) =>
  fetch(`${BASE_URL}${url}`).then(async (r) => {
    if (!r.ok) throw new Error("Request failed");
    return r.json();
  });

export async function uploadPdfs(files, ownerId) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  fd.append("owner_id", ownerId);
  const r = await fetch(`${BASE_URL}/upload`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json()).detail || "Upload failed");
  return r.json();
}

export const addFiles = (nid, files) => {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  return fetch(`${BASE_URL}/notebook/${nid}/add-files`, { method: "POST", body: fd })
    .then(async (r) => { if (!r.ok) throw new Error(); return r.json(); });
};

export const getNotebooks = (ownerId) => _get(`/notebooks?owner_id=${encodeURIComponent(ownerId)}`);
export const getNotebook = (nid) => _get(`/notebook/${nid}`);
export const askDoubt = (nid, question, language = "en") => _post("/ask", { notebook_id: nid, question, language });
export const getStats = (nid) => _get(`/notebook/${nid}/stats`);
export const getDueQuestions = (nid) => _get(`/quiz/due/${nid}`);
export const getUserProfile = (ownerId) => _get(`/user/${ownerId}/profile`);
export const getWeakTopics = (nid) => _get(`/notebook/${nid}/weak-topics`);

export const generateQuiz = (nid, num = 5, lang = "en", difficulty = "medium", adaptive = false) =>
  _post("/quiz/generate", { notebook_id: nid, num_questions: num, language: lang, difficulty, adaptive });

export const generateExam = (nid, num = 10, lang = "en", timeLimit = 600, negMarking = 0.25) =>
  _post("/exam/generate", { notebook_id: nid, num_questions: num, language: lang, time_limit_seconds: timeLimit, negative_marking: negMarking });

export const answerQuestion = (nid, qid, idx, timeMs = 0, ownerId = null, hintUsed = false) =>
  _post("/quiz/answer", { notebook_id: nid, question_id: qid, selected_index: idx, time_ms: timeMs, owner_id: ownerId, hint_used: hintUsed });

export const getHint = (nid, qid, level = 1) =>
  _post("/quiz/hint", { notebook_id: nid, question_id: qid, hint_level: level });

export const generateFlashcards = (nid, num = 6, lang = "en") =>
  _post("/flashcards/generate", { notebook_id: nid, num_cards: num, language: lang });

export const gradeFlashcard = (nid, qid, knewIt, ownerId = null) =>
  _post("/flashcards/grade", { notebook_id: nid, question_id: qid, knew_it: knewIt, owner_id: ownerId });

export const enhanceNotes = (nid, mode = "summary", language = "en") =>
  _post("/notes/enhance", { notebook_id: nid, mode, language });

export const generateExamPaper = (nid, marks1 = 5, marks2 = 3, marks5 = 2, lang = "en") =>
  _post("/exam/paper", { notebook_id: nid, marks_1: marks1, marks_2: marks2, marks_5: marks5, language: lang });
