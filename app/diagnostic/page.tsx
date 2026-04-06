"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Answer } from "../context";
import LandscapeBackground from "../../components/LandscapeBackground";
import questionsData from "../../data/questions.json";
import conceptsData from "../../data/concepts.json";

type Question = {
  id: string;
  conceptId: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  difficulty: string;
};

const LETTERS = ["A", "B", "C", "D"];

export default function DiagnosticPage() {
  const router = useRouter();
  const { studentName, setAnswers, setMasteryMap } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Answer[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const questions: Question[] = questionsData as Question[];
  const currentQ = questions[currentIndex];
  const conceptInfo = conceptsData.find((c) => c.id === currentQ?.conceptId);

  useEffect(() => {
    setMounted(true);
    if (!studentName) router.push("/");
  }, [studentName, router]);

  useEffect(() => {
    setSelected(null);
    setShowHint(false);
    setAnswered(false);
    setShowFeedback(false);
    setAnimKey((k) => k + 1);
  }, [currentIndex]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setShowFeedback(true);

    const isCorrect = idx === currentQ.correctIndex;
    const newAnswer: Answer = {
      questionId: currentQ.id,
      conceptId: currentQ.conceptId,
      selectedIndex: idx,
      correct: isCorrect,
    };
    setLocalAnswers((prev) => [...prev, newAnswer]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const allAnswers = [...localAnswers];
    setAnswers(allAnswers);

    const masteryMap: Record<string, { level: "strong" | "developing" | "needsWork" | "notTested"; correct: number; total: number; conceptId: string }> = {};

    conceptsData.forEach((concept) => {
      const conceptAnswers = allAnswers.filter((a) => a.conceptId === concept.id);
      const total = conceptAnswers.length;
      const correct = conceptAnswers.filter((a) => a.correct).length;

      let level: "strong" | "developing" | "needsWork" | "notTested";
      if (total === 0) level = "notTested";
      else if (correct / total >= 0.8) level = "strong";
      else if (correct / total >= 0.5) level = "developing";
      else level = "needsWork";

      masteryMap[concept.id] = { conceptId: concept.id, level, correct, total };
    });

    setMasteryMap(masteryMap);
    router.push("/results");
  };

  const progress = ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;
  const isCorrect = selected === currentQ?.correctIndex;

  if (!mounted || !currentQ) return null;

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(180deg,#EEF2FF 0%,#FAF8F5 60%)" }}>
      <LandscapeBackground theme="sunset" />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push("/")} className="flex items-center gap-1 text-sm font-medium" style={{ color: "#5A5A7A" }}>
            ← Back
          </button>
          <div className="text-sm font-semibold" style={{ color: "#1A237E" }}>
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-6">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Concept tag */}
        {conceptInfo && (
          <div key={animKey} className="animate-slide-in-left mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: conceptInfo.bgColor, color: conceptInfo.color, border: `1px solid ${conceptInfo.color}33` }}
            >
              <span>{conceptInfo.emoji}</span>
              <span>{conceptInfo.shortName}</span>
            </span>
            <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full" style={{ background: "#F5F5F5", color: "#9E9EB0" }}>
              {currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}
            </span>
          </div>
        )}

        {/* Question card */}
        <div
          key={`q-${animKey}`}
          className="animate-page-in rounded-3xl p-6 mb-5 shadow-lg"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <h2 className="font-serif mb-6" style={{ fontSize: "clamp(1rem,4vw,1.2rem)", color: "#1A1A2E", lineHeight: 1.5 }}>
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              let cls = "option-btn";
              if (answered) {
                if (idx === currentQ.correctIndex) cls += " correct";
                else if (idx === selected && !isCorrect) cls += " wrong";
                else cls += " opacity-50 cursor-not-allowed";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: answered && idx === currentQ.correctIndex ? "#2E7D32" : answered && idx === selected && !isCorrect ? "#C62828" : "#EEF2FF",
                      color: answered && (idx === currentQ.correctIndex || (idx === selected && !isCorrect)) ? "white" : "#1A237E",
                    }}
                  >
                    {LETTERS[idx]}
                  </span>
                  <span>{option}</span>
                  {answered && idx === currentQ.correctIndex && <span className="ml-auto">✅</span>}
                  {answered && idx === selected && !isCorrect && <span className="ml-auto">❌</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        {!answered && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full text-sm font-medium py-2 px-4 rounded-xl mb-4 transition-all"
            style={{ background: showHint ? "#EDE7F6" : "#F5F5F5", color: showHint ? "#7B1FA2" : "#9E9EB0", border: "1px solid transparent" }}
          >
            {showHint ? "🔮 " : "💡 "}
            {showHint ? "Hide hint" : "Need a hint?"}
          </button>
        )}

        {showHint && !answered && (
          <div className="animate-page-in rounded-2xl p-4 mb-4" style={{ background: "#EDE7F6", border: "1px solid #CE93D8" }}>
            <p className="text-sm" style={{ color: "#6A1B9A" }}>
              <span className="font-semibold">Hint: </span>{currentQ.hint}
            </p>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className="animate-bounce-in rounded-2xl p-4 mb-5"
            style={{
              background: isCorrect ? "#E8F5E9" : "#FCE4EC",
              border: `1px solid ${isCorrect ? "#81C784" : "#EF9A9A"}`,
            }}
          >
            <p className="font-semibold text-sm mb-1" style={{ color: isCorrect ? "#2E7D32" : "#C62828" }}>
              {isCorrect ? `🎉 Correct! Well done, ${studentName.split(" ")[0]}!` : `❌ Not quite, ${studentName.split(" ")[0]}.`}
            </p>
            {!isCorrect && (
              <p className="text-sm" style={{ color: "#5A5A7A" }}>
                {currentQ.hint}
              </p>
            )}
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button onClick={handleNext} className="w-full btn-accent animate-bounce-in" style={{ padding: "16px" }}>
            {currentIndex < questions.length - 1 ? "Next Question →" : "See My Results! 🎯"}
          </button>
        )}

        {/* Question dots */}
        <div className="flex justify-center gap-1.5 mt-5 flex-wrap">
          {questions.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === currentIndex ? "20px" : "8px",
                height: "8px",
                background: i < currentIndex ? "#2E7D32" : i === currentIndex ? "#FF6F00" : "#e8e8f0",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
