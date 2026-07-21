import { useState } from "react";
import { BookOpen, Brain, RotateCcw, ArrowRight } from "lucide-react";
import StudyIllustration from "./StudyIllustration";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

export default function Login({ onLogin, lang, setLang, theme, setTheme, t }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const FEATURES = [
    { icon: BookOpen, text: t.feature1 },
    { icon: Brain, text: t.feature2 },
    { icon: RotateCcw, text: t.feature3 },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = { id, name: name.trim(), email: email.trim() };
    localStorage.setItem("nqa_user", JSON.stringify(user));
    onLogin(user);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: brand / hero panel */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0A0C16] overflow-hidden flex-col justify-between p-12 border-r border-paperLine">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-ink/20 blur-3xl blob-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-magenta/15 blur-3xl blob-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="scan-line" style={{ top: "20%" }} />

        <div className="relative z-10 stagger-in">
          <p className="font-mono text-xs text-ink tracking-widest uppercase mb-6">
            {t.brandTag}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-textMain leading-[1.3] max-w-md neon-text">
            {t.heroHeadline}
          </h1>
          <p className="text-inkSoft mt-5 max-w-sm text-[15px] leading-relaxed">
            {t.heroSub}
          </p>
        </div>

        <div className="relative z-10 my-6">
          <StudyIllustration />
        </div>

        <div className="relative z-10 space-y-5 stagger-in">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-8 h-8 rounded-sm bg-surface border border-paperLine flex items-center justify-center">
                <Icon size={16} className="text-ink" />
              </div>
              <p className="text-inkSoft text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-paper relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>

        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden mb-8">
            <p className="font-mono text-xs text-ink tracking-widest uppercase mb-2">{t.brandTag}</p>
            <h1 className="font-display text-xl font-bold text-textMain">{t.welcome}</h1>
          </div>
          <h2 className="hidden lg:block font-display text-xl font-bold mb-1 text-textMain">{t.welcome}</h2>
          <p className="text-inkSoft text-sm mb-8">{t.welcomeSub}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-ink mb-1.5 tracking-wide">{t.nameLabel}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                className="w-full border border-paperLine rounded-sm px-4 py-2.5 bg-surface text-textMain placeholder:text-inkSoft/60 focus:outline-none focus:border-ink focus:shadow-neon text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ink mb-1.5 tracking-wide">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full border border-paperLine rounded-sm px-4 py-2.5 bg-surface text-textMain placeholder:text-inkSoft/60 focus:outline-none focus:border-ink focus:shadow-neon text-sm transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ink text-paper py-3 rounded-sm font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] shadow-neon transition group"
            >
              {t.continueBtn}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <p className="text-xs text-inkSoft mt-6 text-center">{t.runsLocally}</p>
        </div>
      </div>
    </div>
  );
}
