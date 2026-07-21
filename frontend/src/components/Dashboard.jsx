import { useEffect, useState } from "react";
import { BarChart3, Target, Flame, Repeat, Percent, BrainCircuit } from "lucide-react";
import { getStats, getWeakTopics, getUserProfile } from "../api";

export default function Dashboard({ notebook, ownerId, t }) {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getStats(notebook.notebook_id).then(setStats).catch(() => {});
    if (ownerId) getUserProfile(ownerId).then(setProfile).catch(() => {});
  }, [notebook, ownerId]);

  const masteryPct = stats?.total_questions
    ? Math.round((stats.mastered / stats.total_questions) * 100) : 0;

  const statCards = stats ? [
    { label: t.statMastered, value: stats.mastered, icon: Target, color: "text-sage" },
    { label: t.statDue, value: stats.due_today, icon: Flame, color: "text-pen" },
    { label: t.statAttempts, value: stats.total_attempts, icon: Repeat, color: "text-ink" },
    { label: t.statAccuracy, value: `${stats.accuracy}%`, icon: Percent, color: "text-magenta" },
  ] : [];

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2 text-textMain neon-text">
        <BarChart3 size={20} className="text-ink" /> {t.dashboardTitle}
      </h2>
      <p className="text-inkSoft mb-8">{t.dashboardSub}</p>

      {!stats && <p className="text-sm font-mono text-inkSoft">Loading…</p>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 stagger-in">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-surface border border-paperLine rounded-md p-4 lift-on-hover">
                <Icon size={16} className={`${color} mb-2`} />
                <p className="text-2xl font-display font-bold text-textMain">{value}</p>
                <p className="text-xs text-inkSoft mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Mastery progress */}
          <div className="bg-surface border border-paperLine rounded-md p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-textMain">{t.overallProgress}</p>
              <p className="text-sm font-mono text-ink">{masteryPct}%</p>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${masteryPct}%` }} /></div>
          </div>

          {/* Weak topics heatmap */}
          {stats.weak_topics?.length > 0 && (
            <div className="bg-surface border border-pen/30 rounded-md p-5 mb-4 animate-fade-in">
              <p className="text-sm font-medium text-textMain mb-3 flex items-center gap-2">
                <BrainCircuit size={15} className="text-pen" /> Weak areas (needs revision)
              </p>
              <div className="space-y-2">
                {stats.weak_topics.map((w) => (
                  <div key={w.topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-inkSoft font-mono truncate">{w.topic}</span>
                      <span className={w.accuracy < 50 ? "text-pen" : w.accuracy < 70 ? "text-amber" : "text-sage"}>
                        {w.accuracy}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-paperLine overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${w.accuracy < 50 ? "bg-pen" : w.accuracy < 70 ? "bg-amber" : "bg-sage"}`}
                        style={{ width: `${w.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-inkSoft mt-3">💡 Tip: Enable Adaptive mode in Quiz tab to focus on these topics.</p>
            </div>
          )}

          {/* Gamification profile */}
          {profile && (
            <div className="bg-surface border border-ink/20 rounded-md p-5 mb-4">
              <p className="text-sm font-medium text-textMain mb-3">Your achievements</p>
              <div className="flex flex-wrap gap-3">
                {profile.badges?.length === 0 && <p className="text-xs text-inkSoft">No badges yet — keep studying!</p>}
                {profile.badges?.map((b) => {
                  const meta = { first_quiz:"🎯 First Step", quiz_master:"🏆 Quiz Master", streak_3:"🔥 On Fire", streak_7:"⚡ Unstoppable", perfectionist:"💎 Perfectionist", scholar:"📚 Scholar" };
                  return (
                    <div key={b} className="flex items-center gap-1.5 bg-ink/10 border border-ink/20 px-3 py-1.5 rounded-full text-xs text-textMain">
                      {meta[b] || "🏅 " + b}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files breakdown */}
          <div className="bg-surface border border-paperLine rounded-md p-5">
            <p className="text-sm font-medium text-textMain mb-3">{t.filesInNotebook}</p>
            <div className="space-y-2">
              {notebook.files?.map((f) => (
                <div key={f.filename} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-inkSoft truncate pr-3">{f.filename}</span>
                  <span className="text-xs text-inkSoft whitespace-nowrap">{f.num_pages}p · {f.num_chunks}c</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
