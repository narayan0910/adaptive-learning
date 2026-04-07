"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "../../context";
import LandscapeBackground from "../../../components/LandscapeBackground";
import conceptsData from "../../../data/concepts.json";
import lessonsData from "../../../data/lessons.json";
import practiceData from "../../../data/practice.json";

type PracticeQuestion = {
  id: string;
  conceptId: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  difficulty: string;
};

const LETTERS = ["A", "B", "C", "D"];

const QUICK_ASKS = [
  "What is this concept about?",
  "Give me a daily life example",
  "Why is this important?",
  "Explain it simply",
];

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: number };

function plainLessonText(lesson: { title: string; content: string }): string {
  const body = lesson.content.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return `${lesson.title}. ${body}`;
}

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const conceptId = params?.conceptId as string;
  const { studentName } = useApp();

  const concept = conceptsData.find((c) => c.id === conceptId);
  const lesson = (lessonsData as Record<string, { conceptId: string; title: string; content: string; tryAtHome: string }>)[conceptId];
  const practiceQuestions: PracticeQuestion[] = (practiceData as Record<string, PracticeQuestion[]>)[conceptId] || [];

  const [activeTab, setActiveTab] = useState<"lesson" | "practice" | "tutor">("lesson");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswered, setPracticeAnswered] = useState(false);
  const [practiceSelected, setPracticeSelected] = useState<number | null>(null);
  const [practiceScore, setPracticeScore] = useState(0);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lessonSpeaking, setLessonSpeaking] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatStorageKey = studentName && conceptId ? `chat:${studentName.toLowerCase().trim()}:${conceptId}` : "";

  useEffect(() => {
    setMounted(true);
    if (!studentName) router.push("/");
  }, [studentName, router]);

  useEffect(() => {
    setPracticeIndex(0);
    setPracticeAnswered(false);
    setPracticeSelected(null);
    setPracticeScore(0);
    setPracticeComplete(false);
    setAiQuery("");
    setChatMessages([]);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setLessonSpeaking(false);
  }, [conceptId]);

  useEffect(() => {
    if (!chatStorageKey || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(chatStorageKey);
    if (!saved) {
      setChatMessages([
        {
          role: "assistant",
          content: `Hi ${studentName.split(" ")[0]}! I'm your tutor for ${concept?.name || "this concept"}. Ask me anything and I'll help step by step.`,
          createdAt: Date.now(),
        },
      ]);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as ChatMessage[];
      const valid = Array.isArray(parsed)
        ? parsed.filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              typeof m.createdAt === "number"
          )
        : [];
      setChatMessages(valid.slice(-40));
    } catch {
      setChatMessages([]);
    }
  }, [chatStorageKey, concept?.name, studentName]);

  useEffect(() => {
    if (!chatStorageKey || typeof window === "undefined") return;
    window.localStorage.setItem(chatStorageKey, JSON.stringify(chatMessages.slice(-40)));
  }, [chatMessages, chatStorageKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, aiLoading, activeTab]);

  useEffect(() => {
    if (activeTab !== "lesson" && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      setLessonSpeaking(false);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleLessonSpeech = () => {
    if (!lesson || typeof window === "undefined" || !window.speechSynthesis) return;
    if (lessonSpeaking) {
      window.speechSynthesis.cancel();
      setLessonSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plainLessonText(lesson));
    u.rate = 0.92;
    u.lang = "en-IN";
    u.onend = () => setLessonSpeaking(false);
    u.onerror = () => setLessonSpeaking(false);
    setLessonSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const currentPracticeQ = practiceQuestions[practiceIndex];

  const handlePracticeSelect = (idx: number) => {
    if (practiceAnswered) return;
    setPracticeSelected(idx);
    setPracticeAnswered(true);
    if (idx === currentPracticeQ.correctIndex) {
      setPracticeScore((s) => s + 1);
    }
  };

  const handlePracticeNext = () => {
    if (practiceIndex < practiceQuestions.length - 1) {
      setPracticeIndex((i) => i + 1);
      setPracticeAnswered(false);
      setPracticeSelected(null);
    } else {
      setPracticeComplete(true);
    }
  };

  const askTutor = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || aiLoading) return;
    const historyBefore = chatMessages;
    setChatMessages((m) => [...m, { role: "user", content: trimmed, createdAt: Date.now() }]);
    setAiQuery("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          history: historyBefore,
          studentName,
          conceptName: concept?.name || conceptId,
        }),
      });
      const data = await res.json();
      const reply = data.response || "I'm having trouble right now. Try again!";
      setChatMessages((m) => [...m, { role: "assistant", content: reply, createdAt: Date.now() }]);
    } catch {
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: "Oops! Something went wrong. Please try again.", createdAt: Date.now() },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const clearChat = () => {
    const starter: ChatMessage = {
      role: "assistant",
      content: `Chat cleared. I'm ready to help you again with ${concept?.name || "this concept"}.`,
      createdAt: Date.now(),
    };
    setChatMessages([starter]);
  };

  if (!mounted || !concept || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F5" }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-float">📚</div>
          <p style={{ color: "#5A5A7A" }}>Loading lesson...</p>
        </div>
      </div>
    );
  }

  const lessonParagraphs = lesson.content.split("\n\n").filter(Boolean);

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(180deg,#F3E5F5 0%,#FAF8F5 50%)" }}>
      <LandscapeBackground theme="night" />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-5 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push("/results")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            ←
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{concept.emoji}</span>
              <h1 className="font-serif font-bold text-base leading-tight" style={{ color: "#1A1A2E" }}>
                {concept.name}
              </h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#9E9EB0" }}>
              Class 6 · Science · Chapter 11
            </p>
          </div>
          <span
            className="badge"
            style={{ background: concept.bgColor, color: concept.color, border: `1px solid ${concept.color}33` }}
          >
            {concept.shortName}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {([
            { id: "lesson", icon: "📖", label: "Lesson" },
            { id: "practice", icon: "✍️", label: "Practice" },
            { id: "tutor", icon: "🤖", label: "AI Tutor" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id
                  ? tab.id === "tutor" ? "#7B1FA2" : "#1A237E"
                  : "transparent",
                color: activeTab === tab.id ? "white" : "#5A5A7A",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* LESSON TAB */}
        {activeTab === "lesson" && (
          <div className="animate-page-in space-y-4">
            {/* Lesson header */}
            <div
              className="rounded-3xl p-5"
              style={{
                background: `linear-gradient(135deg, ${concept.color}22, ${concept.color}11)`,
                border: `1px solid ${concept.color}33`,
              }}
            >
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: "#FF6F00", color: "white" }}
              >
                📖 LESSON
              </span>
              <h2 className="font-serif text-xl font-bold" style={{ color: "#1A1A2E" }}>
                {lesson.title}
              </h2>
            </div>

            {/* Lesson content */}
            <div className="rounded-3xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-end gap-2 -mt-1 mb-1">
                <button
                  type="button"
                  onClick={toggleLessonSpeech}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: lessonSpeaking ? "#FCE4EC" : "#E8EAF6",
                    color: lessonSpeaking ? "#C2185B" : "#1A237E",
                    border: `2px solid ${lessonSpeaking ? "#F48FB1" : "#C5CAE9"}`,
                  }}
                  aria-pressed={lessonSpeaking}
                  aria-label={lessonSpeaking ? "Stop reading" : "Read lesson aloud"}
                >
                  <span className="text-base" aria-hidden>
                    {lessonSpeaking ? "⏹" : "🔊"}
                  </span>
                  {lessonSpeaking ? "Stop" : "Read aloud"}
                </button>
              </div>
              {lessonParagraphs.map((para, idx) => {
                const parts = para.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={idx} className="text-sm leading-relaxed" style={{ color: "#1A1A2E" }}>
                    {parts.map((part, pIdx) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong key={pIdx} style={{ color: "#1A237E", fontWeight: 700 }}>
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>

            {/* Try at home */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg,#FFF3E0,#FFFDE7)", border: "2px dashed #FFD180" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏠</span>
                <span className="font-bold text-sm" style={{ color: "#E65100" }}>Try This At Home!</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#5A5A7A" }}>
                {lesson.tryAtHome}
              </p>
            </div>

            {/* CTA to practice */}
            <button
              onClick={() => setActiveTab("practice")}
              className="w-full btn-accent"
              style={{ padding: "16px" }}
            >
              Ready to Practice! ✍️
            </button>
          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === "practice" && (
          <div className="animate-page-in">
            {!practiceComplete ? (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "#5A5A7A" }}>
                    Question {practiceIndex + 1} of {practiceQuestions.length}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#2E7D32" }}>
                    ✅ {practiceScore} correct
                  </span>
                </div>
                <div className="progress-bar mb-5">
                  <div className="progress-fill" style={{ width: `${((practiceIndex) / practiceQuestions.length) * 100}%` }} />
                </div>

                {currentPracticeQ && (
                  <div className="rounded-3xl p-5 mb-4 shadow-lg" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: "#EDE7F6", color: "#7B1FA2" }}>
                      ✍️ PRACTICE
                    </span>
                    <h3 className="font-serif text-base font-semibold mb-5 leading-relaxed" style={{ color: "#1A1A2E" }}>
                      {currentPracticeQ.question}
                    </h3>

                    <div className="space-y-3">
                      {currentPracticeQ.options.map((opt, idx) => {
                        let cls = "option-btn";
                        if (practiceAnswered) {
                          if (idx === currentPracticeQ.correctIndex) cls += " correct";
                          else if (idx === practiceSelected && idx !== currentPracticeQ.correctIndex) cls += " wrong";
                          else cls += " opacity-50 cursor-not-allowed";
                        }
                        return (
                          <button
                            key={idx}
                            className={cls}
                            onClick={() => handlePracticeSelect(idx)}
                            disabled={practiceAnswered}
                            style={{ display: "flex", alignItems: "center", gap: "12px" }}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: practiceAnswered && idx === currentPracticeQ.correctIndex ? "#2E7D32"
                                  : practiceAnswered && idx === practiceSelected && idx !== currentPracticeQ.correctIndex ? "#C62828"
                                  : "#EEF2FF",
                                color: practiceAnswered && (idx === currentPracticeQ.correctIndex || (idx === practiceSelected && idx !== currentPracticeQ.correctIndex)) ? "white" : "#1A237E",
                              }}
                            >
                              {LETTERS[idx]}
                            </span>
                            <span className="text-sm">{opt}</span>
                            {practiceAnswered && idx === currentPracticeQ.correctIndex && <span className="ml-auto">✅</span>}
                            {practiceAnswered && idx === practiceSelected && idx !== currentPracticeQ.correctIndex && <span className="ml-auto">❌</span>}
                          </button>
                        );
                      })}
                    </div>

                    {practiceAnswered && (
                      <div
                        className="animate-page-in mt-4 rounded-2xl p-3"
                        style={{
                          background: practiceSelected === currentPracticeQ.correctIndex ? "#E8F5E9" : "#FCE4EC",
                          border: `1px solid ${practiceSelected === currentPracticeQ.correctIndex ? "#81C784" : "#EF9A9A"}`,
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: practiceSelected === currentPracticeQ.correctIndex ? "#2E7D32" : "#C62828" }}>
                          {practiceSelected === currentPracticeQ.correctIndex
                            ? `🎉 Correct! Great work, ${studentName.split(" ")[0]}!`
                            : `Not quite! ${currentPracticeQ.hint}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {practiceAnswered && (
                  <button onClick={handlePracticeNext} className="w-full btn-accent animate-bounce-in" style={{ padding: "16px" }}>
                    {practiceIndex < practiceQuestions.length - 1 ? "Next Question →" : "See Results 🎯"}
                  </button>
                )}
              </>
            ) : (
              <div className="animate-bounce-in text-center rounded-3xl p-8 shadow-xl" style={{ background: "rgba(255,255,255,0.95)" }}>
                <div className="text-6xl mb-4">{practiceScore === practiceQuestions.length ? "🏆" : practiceScore >= practiceQuestions.length / 2 ? "🌟" : "💪"}</div>
                <h3 className="font-serif text-2xl font-bold mb-2" style={{ color: "#1A1A2E" }}>Practice Complete!</h3>
                <p className="text-4xl font-bold mb-2" style={{ color: "#1A237E" }}>
                  {practiceScore}/{practiceQuestions.length}
                </p>
                <p className="text-sm mb-6" style={{ color: "#5A5A7A" }}>
                  {practiceScore === practiceQuestions.length
                    ? `Perfect score, ${studentName.split(" ")[0]}! You've mastered this concept! 🎉`
                    : `Good effort, ${studentName.split(" ")[0]}! Review the lesson and try the AI tutor for help.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPracticeIndex(0); setPracticeAnswered(false); setPracticeSelected(null); setPracticeScore(0); setPracticeComplete(false); }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: "#EEF2FF", color: "#1A237E", border: "2px solid #C5CAE9" }}
                  >
                    Try Again
                  </button>
                  <button onClick={() => setActiveTab("tutor")} className="flex-1 btn-accent" style={{ padding: "12px" }}>
                    Ask AI Tutor 🤖
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI TUTOR TAB */}
        {activeTab === "tutor" && (
          <div className="animate-page-in flex flex-col gap-4">
            {/* Tutor header */}
            <div
              className="rounded-3xl p-5"
              style={{ background: "linear-gradient(135deg,#7B1FA2,#9C27B0)", color: "white" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl animate-float"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-lg">AI Tutor Chat</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,255,255,0.25)" }}>LIVE</span>
                  </div>
                  <p className="text-xs opacity-70">Powered by Lyfshilp Academy</p>
                </div>
              </div>
              <p className="text-sm opacity-85">
                Hi {studentName.split(" ")[0]}! I&apos;m your personal science tutor. Ask me anything about{" "}
                <strong>{concept.name}</strong> — your messages stay in this chat.
              </p>
            </div>

            {/* Quick ask buttons */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#9E9EB0" }}>Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ASKS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => askTutor(q)}
                    disabled={aiLoading}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                    style={{
                      background: "#EDE7F6",
                      color: "#7B1FA2",
                      border: "1px solid #CE93D8",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat thread */}
            <div
              className="rounded-3xl p-3 flex flex-col gap-0"
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(0,0,0,0.06)",
                minHeight: "220px",
                maxHeight: "min(52vh, 420px)",
              }}
            >
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <p className="text-xs font-semibold" style={{ color: "#9E9EB0" }}>
                  Conversation
                </p>
                <button
                  type="button"
                  onClick={clearChat}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                  style={{ color: "#7B1FA2", background: "#F3E5F5", border: "1px solid #E1BEE7" }}
                >
                  Clear
                </button>
              </div>
              <div className="overflow-y-auto px-1 pb-2 space-y-3 flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
                {chatMessages.length === 0 && !aiLoading && (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "#F3E5F5", border: "1px dashed #CE93D8" }}>
                    <p className="text-sm" style={{ color: "#6A1B9A" }}>
                      Start the conversation — type below or tap a quick question.
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, idx) =>
                  msg.role === "user" ? (
                    <div key={idx} className="flex justify-end">
                      <div
                        className="max-w-[min(100%,18rem)] rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm"
                        style={{ background: "#1A237E", color: "white" }}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-75">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex justify-start">
                      <div
                        className="max-w-[min(100%,20rem)] rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm"
                        style={{ background: "white", border: "2px solid #CE93D8", boxShadow: "0 2px 12px rgba(123,31,162,0.08)" }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">🤖</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7B1FA2" }}>
                            AI Tutor
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: "#1A1A2E" }}>
                          {msg.content}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "#9E9EB0" }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "#EDE7F6" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                        <p className="text-sm" style={{ color: "#7B1FA2" }}>
                          Your tutor is thinking...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#9E9EB0" }}>Message your tutor:</p>
              <div className="flex gap-2">
                <input
                  ref={aiInputRef}
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askTutor(aiQuery)}
                  placeholder={`e.g., Why is my shadow sometimes long?`}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    border: "2px solid #EDE7F6",
                    background: "#FAFBFF",
                    color: "#1A1A2E",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => askTutor(aiQuery)}
                  disabled={!aiQuery.trim() || aiLoading}
                  className="px-4 py-3 rounded-xl font-semibold text-sm transition-all shrink-0"
                  style={{
                    background: aiQuery.trim() && !aiLoading ? "#7B1FA2" : "#EEF2FF",
                    color: aiQuery.trim() && !aiLoading ? "white" : "#9E9EB0",
                  }}
                >
                  {aiLoading ? "..." : "Send"}
                </button>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-2xl p-4" style={{ background: "#F3E5F5", border: "1px solid #E1BEE7" }}>
              <p className="text-xs" style={{ color: "#6A1B9A" }}>
                💡 <strong>Tip:</strong> Scroll up to see earlier messages. Follow-up questions work better because the tutor remembers this chat.
              </p>
            </div>
          </div>
        )}

        {/* Concept navigation */}
        <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#9E9EB0" }}>Other concepts:</p>
          <div className="flex gap-2 flex-wrap">
            {conceptsData
              .filter((c) => c.id !== conceptId)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/learn/${c.id}`)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: c.bgColor, color: c.color, border: `1px solid ${c.color}33` }}
                >
                  {c.emoji} {c.shortName}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
