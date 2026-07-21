import { useEffect, useState } from "react";
import { getUserProfile } from "../api";

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200];
function getLevel(xp) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}
function nextLevelXp(xp) {
  const lvl = getLevel(xp);
  return LEVEL_THRESHOLDS[lvl] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}
function prevLevelXp(xp) {
  const lvl = getLevel(xp);
  return LEVEL_THRESHOLDS[lvl - 1] ?? 0;
}

export default function GamificationBar({ ownerId }) {
  const [profile, setProfile] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    const load = () => getUserProfile(ownerId).then((p) => { if (active) setProfile(p); }).catch(() => {});
    load();
    const interval = setInterval(load, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [ownerId]);

  useEffect(() => {
    if (!newBadges.length) return;
    const t = setTimeout(() => setNewBadges([]), 4000);
    return () => clearTimeout(t);
  }, [newBadges]);

  if (!profile) return null;

  const { xp = 0, streak = 0, badges = [] } = profile;
  const lvl = getLevel(xp);
  const prev = prevLevelXp(xp);
  const next = nextLevelXp(xp);
  const pct = next > prev ? Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100)) : 100;

  return (
    <div className="px-10 py-3 border-b border-paperLine bg-surface/40 flex items-center gap-6 text-sm flex-wrap">
      {/* Level + XP bar */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-paper text-xs font-bold shadow-neon shrink-0">
          {lvl}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-inkSoft">Lv {lvl}</span>
            <span className="text-xs font-mono text-inkSoft">{xp} XP</span>
          </div>
          <div className="progress-track w-28">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span className="text-pen">🔥</span>
        <span className="text-textMain font-semibold">{streak}</span>
        <span className="text-inkSoft">day streak</span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {badges.map((b) => (
          <span key={b} className="text-base" title={b}>
            {b === "first_quiz" ? "🎯" : b === "quiz_master" ? "🏆" : b === "streak_3" ? "🔥" : b === "streak_7" ? "⚡" : b === "perfectionist" ? "💎" : b === "scholar" ? "📚" : "🏅"}
          </span>
        ))}
      </div>

      {/* New badge toast */}
      {newBadges.map((badge) => (
        <div key={badge.id} className="ml-auto animate-fade-in bg-ink/20 border border-ink text-textMain text-xs px-3 py-1.5 rounded-sm font-mono shadow-neon">
          {badge.emoji} {badge.name} unlocked!
        </div>
      ))}
    </div>
  );
}
