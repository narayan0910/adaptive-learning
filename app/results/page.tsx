"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, MasteryLevel } from "../context";
import LandscapeBackground from "../../components/LandscapeBackground";
import conceptsData from "../../data/concepts.json";

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; bg: string; badgeClass: string; emoji: string }> = {
  strong: { label: "Strong", color: "#2E7D32", bg: "#E8F5E9", badgeClass: "badge-strong", emoji: "💪" },
  developing: { label: "Developing", color: "#E65100", bg: "#FFF3E0", badgeClass: "badge-developing", emoji: "📈" },
  needsWork: { label: "Needs Practice", color: "#C62828", bg: "#FCE4EC", badgeClass: "badge-needs-work", emoji: "🎯" },
  notTested: { label: "Not Tested", color: "#9E9E9E", bg: "#F5F5F5", badgeClass: "badge-not-tested", emoji: "❓" },
};

function Confetti({ count = 30 }: { count?: number }) {
  const colors = ["#FF6F00", "#1A237E", "#7B1FA2", "#2E7D32", "#E65100", "#F44336", "#FFD700"];
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-20px",
            background: colors[i % colors.length],
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDuration: `${2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { studentName, answers, masteryMap } = useApp();
  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);

  const totalCorrect = answers.filter((a) => a.correct).length;
  const totalQ = answers.length;
  const score = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  useEffect(() => {
    setMounted(true);
    if (!studentName) { router.push("/"); return; }
    if (score >= 70) setTimeout(() => setShowConfetti(true), 500);
    const timer = setInterval(() => setVisibleCards((v) => v < conceptsData.length + 3 ? v + 1 : v), 120);
    return () => clearInterval(timer);
  }, [studentName, router, score]);

  const getMotivation = () => {
    if (score >= 80) return { msg: `Wow, ${studentName.split(" ")[0]}! You're a science star! 🌟`, sub: "Excellent understanding of the chapter!" };
    if (score >= 50) return { msg: `Good effort, ${studentName.split(" ")[0]}! 💪`, sub: "You're getting there. Let's strengthen the weak spots!" };
    return { msg: `Keep going, ${studentName.split(" ")[0]}! 🚀`, sub: "Every expert was once a beginner. Let's learn together!" };
  };

  const motivation = getMotivation();
  const weakConcepts = conceptsData.filter((c) => {
    const m = masteryMap[c.id];
    return m && (m.level === "needsWork" || m.level === "developing");
  }).sort((a, b) => a.order - b.order);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(180deg,#E8F4FF 0%,#FAF8F5 50%)" }}>
      {showConfetti && <Confetti count={40} />}
      <LandscapeBackground theme="day" />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-6 pb-24">
        {/* Back nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push("/")} className="text-sm font-medium" style={{ color: "#5A5A7A" }}>← Home</button>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#E8F0FE", color: "#1A237E" }}>Results</span>
        </div>

        {/* Score card */}
        {visibleCards > 0 && (
          <div className="animate-bounce-in rounded-3xl p-6 mb-5 text-center shadow-xl"
            style={{ background: "linear-gradient(135deg,#1A237E,#283593)", color: "white" }}>
            <p className="text-sm opacity-70 mb-2 font-medium">Your Score</p>
            <div className="font-serif mb-2" style={{ fontSize: "5rem", lineHeight: 1, fontWeight: 700 }}>{score}%</div>
            <p className="text-lg opacity-90 mb-3">{totalCorrect} of {totalQ} correct</p>
            <div className="w-full rounded-full overflow-hidden mb-4" style={{ height: "8px", background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: score >= 70 ? "#69F0AE" : "#FFD740" }} />
            </div>
            <p className="font-semibold text-base">{motivation.msg}</p>
            <p className="text-sm opacity-70 mt-1">{motivation.sub}</p>
          </div>
        )}

        {/* Mastery map */}
        {visibleCards > 1 && (
          <div className="animate-page-in mb-5">
            <h2 className="font-serif text-xl font-bold mb-4" style={{ color: "#1A1A2E" }}>
              🗺️ Your Mastery Map
            </h2>
            <div className="space-y-3">
              {conceptsData.map((concept, idx) => {
                const mastery = masteryMap[concept.id] || { level: "notTested" as MasteryLevel, correct: 0, total: 0 };
                const config = MASTERY_CONFIG[mastery.level];
                const canLearn = mastery.level === "needsWork" || mastery.level === "developing";

                return (
                  visibleCards > idx + 2 && (
                    <div
                      key={concept.id}
                      className="animate-slide-in-left rounded-2xl p-4 transition-all"
                      style={{
                        background: config.bg,
                        border: `1px solid ${config.color}22`,
                        animationDelay: `${idx * 0.05}s`,
                        cursor: canLearn ? "pointer" : "default",
                      }}
                      onClick={() => canLearn && router.push(`/learn/${concept.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{concept.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "#1A1A2E" }}>{concept.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`badge ${config.badgeClass}`}>{config.emoji} {config.label}</span>
                              {mastery.total > 0 && (
                                <span className="text-xs" style={{ color: "#9E9EB0" }}>{mastery.correct}/{mastery.total} correct</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {canLearn && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all hover:scale-105"
                              style={{ background: config.color, color: "white", whiteSpace: "nowrap" }}>
                              Start lesson →
                            </span>
                          </div>
                        )}
                        {mastery.level === "strong" && <span className="text-2xl">⭐</span>}
                      </div>

                      {/* Mini progress bar for concept */}
                      {mastery.total > 0 && (
                        <div className="mt-3">
                          <div className="progress-bar" style={{ height: "4px" }}>
                            <div className="progress-fill" style={{ width: `${(mastery.correct / mastery.total) * 100}%`, background: config.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                );
              })}
            </div>
          </div>
        )}

        {/* Learning path */}
        {weakConcepts.length > 0 && visibleCards > conceptsData.length + 1 && (
          <div className="animate-page-in mb-5">
            <h2 className="font-serif text-xl font-bold mb-4" style={{ color: "#1A1A2E" }}>
              🛣️ Your Learning Path
            </h2>
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-sm mb-4" style={{ color: "#5A5A7A" }}>Complete these concepts in order for the best learning experience:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {weakConcepts.map((concept, idx) => (
                  <React.Fragment key={concept.id}>
                    <button
                      onClick={() => router.push(`/learn/${concept.id}`)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:scale-105"
                      style={{
                        background: idx === 0 ? "#FF6F00" : "#EEF2FF",
                        color: idx === 0 ? "white" : "#1A237E",
                        border: `2px solid ${idx === 0 ? "#FF8F00" : "#C5CAE9"}`,
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: idx === 0 ? "rgba(255,255,255,0.3)" : "#1A237E", color: idx === 0 ? "white" : "white" }}>
                        {idx + 1}
                      </span>
                      {concept.emoji} {concept.shortName}
                    </button>
                    {idx < weakConcepts.length - 1 && (
                      <span style={{ color: "#FF6F00", fontSize: "18px", fontWeight: "bold" }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parent dashboard card */}
        {visibleCards > conceptsData.length + 2 && (
          <div className="animate-page-in rounded-2xl p-5 mb-5" style={{ background: "linear-gradient(135deg,#0D1B3E,#1A237E)", color: "white" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>FOR PARENTS</span>
            </div>
            <h3 className="font-serif text-lg font-bold mb-3">📊 Weekly Progress Reports</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🎯", val: `${score}%`, label: "Diagnostic Score" },
                { icon: "📚", val: `${weakConcepts.length}`, label: "To Improve" },
                { icon: "🤖", val: "AI", label: "Personal Tutor" },
              ].map((stat) => (
                <div key={stat.label} className="text-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="font-bold text-sm">{stat.val}</div>
                  <div className="text-xs opacity-60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retake button */}
        {visibleCards > conceptsData.length + 2 && (
          <div className="animate-page-in flex gap-3">
            <button onClick={() => router.push("/")} className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-105"
              style={{ background: "#EEF2FF", color: "#1A237E", border: "2px solid #C5CAE9" }}>
              🏠 Home
            </button>
            {weakConcepts.length > 0 && (
              <button onClick={() => router.push(`/learn/${weakConcepts[0].id}`)} className="flex-1 btn-accent" style={{ padding: "16px" }}>
                Start Learning →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
