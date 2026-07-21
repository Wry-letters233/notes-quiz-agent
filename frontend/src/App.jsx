import { useEffect, useState } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import GamificationBar from "./components/GamificationBar";
import UploadPanel from "./components/UploadPanel";
import DoubtPanel from "./components/DoubtPanel";
import QuizPanel from "./components/QuizPanel";
import FlashcardPanel from "./components/FlashcardPanel";
import ExamMode from "./components/ExamMode";
import NotesEnhancer from "./components/NotesEnhancer";
import ReviewPanel from "./components/ReviewPanel";
import Dashboard from "./components/Dashboard";
import { useTranslation } from "./translations";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [tab, setTab] = useState("upload");
  const [notebook, setNotebook] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("nqa_lang") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("nqa_theme") || "dark");
  const t = useTranslation(lang);

  useEffect(() => {
    const saved = localStorage.getItem("nqa_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.id) {
        parsed.id = crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}`;
        localStorage.setItem("nqa_user", JSON.stringify(parsed));
      }
      setUser(parsed);
    }
    setCheckedSession(true);
  }, []);

  useEffect(() => { localStorage.setItem("nqa_lang", lang); }, [lang]);
  useEffect(() => {
    localStorage.setItem("nqa_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function handleLogout() {
    localStorage.removeItem("nqa_user");
    setUser(null);
    setNotebook(null);
    setTab("upload");
  }

  function handleUploaded(meta) {
    setNotebook(meta);
    setTab("ask");
  }

  function handleSwitchNotebook(meta) {
    setNotebook(meta);
    setTab("ask");
  }

  if (!checkedSession) return null;
  if (!user) return <Login onLogin={setUser} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        user={user}
        notebook={notebook}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />
      <GamificationBar ownerId={user.id} />
      <div className="flex flex-1">
        <Sidebar
          tab={tab}
          setTab={setTab}
          notebook={notebook}
          ownerId={user.id}
          onSwitchNotebook={handleSwitchNotebook}
          t={t}
        />
        <main className="flex-1 px-10 py-10 animate-fade-in" key={tab}>
          {tab === "upload" && <UploadPanel onUploaded={handleUploaded} ownerId={user.id} t={t} />}
          {tab === "ask" && notebook && <DoubtPanel notebook={notebook} lang={lang} t={t} />}
          {tab === "quiz" && notebook && <QuizPanel notebook={notebook} lang={lang} ownerId={user.id} t={t} />}
          {tab === "flashcards" && notebook && <FlashcardPanel notebook={notebook} lang={lang} ownerId={user.id} t={t} />}
          {tab === "exam" && notebook && <ExamMode notebook={notebook} lang={lang} ownerId={user.id} t={t} />}
          {tab === "enhancer" && notebook && <NotesEnhancer notebook={notebook} lang={lang} t={t} />}
          {tab === "review" && notebook && <ReviewPanel notebook={notebook} t={t} />}
          {tab === "dashboard" && notebook && <Dashboard notebook={notebook} ownerId={user.id} t={t} />}
        </main>
      </div>
    </div>
  );
}
