"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./context";
import LandscapeBackground from "../components/LandscapeBackground";

const FLOATING_EMOJIS = ["🔮","🌑","📐","📷","🪞","🌍","⭐","💡","🔬","🌟"];

export default function WelcomePage() {
  const router = useRouter();
  const { setStudentName } = useApp();
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;
    setStudentName(name.trim());
    router.push("/diagnostic");
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(180deg, #E8F4FF 0%, #FAF8F5 60%)" }}>
      <LandscapeBackground theme="day" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <div key={i} className="absolute select-none animate-float-slow"
            style={{
              left: `${5 + (i * 9.5) % 90}%`,
              top: `${5 + (i * 13) % 58}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.3}s`,
              transform: `translateY(${scrollY * (0.05 + i * 0.01)}px)`,
              opacity: 0.18,
              fontSize: `${1.4 + (i % 3) * 0.4}rem`,
            }}
          >{emoji}</div>
        ))}
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg" style={{ background: "linear-gradient(135deg,#1A237E,#3949AB)" }}>CCA</div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "#1A237E" }}>CCA Group of Education</p>
            <p className="text-xs" style={{ color: "#9E9EB0" }}>Powered by Lyfshilp Academy</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#E8F0FE", color: "#1A237E" }}>Class 6 · Science</div>
      </header>

      <main className="relative z-20 px-5 pt-6 pb-32 max-w-md mx-auto">
        <div className="animate-page-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5 shadow-sm" style={{ background: "#FFF3E0", color: "#FF6F00", border: "1px solid #FFD180" }}>
            <span>⚡</span><span>Light, Shadows & Reflections</span>
          </div>
        </div>

        <div className="animate-page-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <h1 className="font-serif mb-3 leading-tight" style={{ fontSize: "clamp(1.9rem,7vw,2.6rem)", color: "#1A1A2E" }}>
            Learn <span className="gradient-text">Smarter</span><br />with Your <span style={{ color: "#7B1FA2" }}>AI Tutor</span> ✨
          </h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#5A5A7A" }}>
            Every student learns differently. Our AI tutor finds your gaps and builds a learning path just for you — in 3 minutes! 🚀
          </p>
        </div>

        <div className="animate-page-in grid grid-cols-3 gap-3 mb-6" style={{ animationDelay: "0.2s", opacity: 0 }}>
          {[{icon:"🧠",val:"6",label:"Concepts"},{icon:"⏱️",val:"3 min",label:"Quiz time"},{icon:"🤖",val:"AI",label:"Tutor"}].map(s => (
            <div key={s.label} className="text-center py-3 px-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-sm" style={{ color: "#1A237E" }}>{s.val}</div>
              <div className="text-xs" style={{ color: "#9E9EB0" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="animate-page-in rounded-3xl p-6 shadow-xl mb-5" style={{ animationDelay: "0.3s", opacity: 0, background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 className="font-semibold mb-1 text-lg" style={{ color: "#1A1A2E" }}>👋 What&apos;s your name?</h2>
          <p className="text-sm mb-4" style={{ color: "#9E9EB0" }}>Your AI tutor will personalise lessons just for you</p>
          <div className="relative mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && handleStart()}
              placeholder="e.g., Aman, Riya, Priya..."
              className="w-full px-4 py-4 rounded-2xl text-base outline-none transition-all"
              style={{ border: "2px solid", borderColor: name.trim() ? "#1A237E" : "#e8e8f0", background: "#FAFBFF", color: "#1A1A2E", fontSize: "16px" }}
              autoFocus
            />
            {name.trim() && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">✅</span>}
          </div>
          <button onClick={handleStart} disabled={!name.trim()} className="w-full btn-primary text-center" style={{ fontSize: "16px", padding: "16px" }}>
            {name.trim() ? `Start Assessment, ${name.split(" ")[0]}! 🎯` : "Enter your name to begin"}
          </button>
        </div>

        <div className="animate-page-in rounded-2xl p-5" style={{ animationDelay: "0.4s", opacity: 0, background: "linear-gradient(135deg,#1A237E 0%,#283593 100%)", color: "white" }}>
          <p className="font-semibold mb-3 text-sm opacity-80">What happens next</p>
          <div className="space-y-3">
            {[{step:"1",icon:"📝",text:"Answer 12 quick questions"},{step:"2",icon:"🗺️",text:"See your personalised mastery map"},{step:"3",icon:"🤖",text:"Learn with your AI tutor on weak topics"}].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>{item.step}</div>
                <span className="text-sm">{item.icon} {item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-20 text-center pb-6 px-6" style={{ color: "#9E9EB0", fontSize: "12px" }}>
        Central Children Academy · Experia Gurukul · CBSE Affiliated
      </footer>
    </div>
  );
}
