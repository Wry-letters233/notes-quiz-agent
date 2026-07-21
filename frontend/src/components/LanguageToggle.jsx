export default function LanguageToggle({ lang, setLang }) {
  return (
    <div className="inline-flex border border-paperLine rounded-full overflow-hidden text-xs font-mono bg-surface">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1.5 transition ${lang === "en" ? "bg-ink text-paper shadow-neon" : "text-inkSoft hover:text-textMain"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-3 py-1.5 transition ${lang === "hi" ? "bg-ink text-paper shadow-neon" : "text-inkSoft hover:text-textMain"}`}
      >
        हिं
      </button>
    </div>
  );
}
