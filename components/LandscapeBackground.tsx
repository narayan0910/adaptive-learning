"use client";
import React from "react";

export default function LandscapeBackground({ theme = "day" }: { theme?: "day" | "night" | "sunset" }) {
  const themes = {
    day: {
      sky: ["#87CEEB", "#B8E4F7"],
      mountain1: "#6B8E6B",
      mountain2: "#5A7A5A",
      mountain3: "#4A6A4A",
      grass: "#7DC87D",
      grassDark: "#5AA85A",
      ground: "#8B6914",
      sunColor: "#FFD700",
      cloudColor: "rgba(255,255,255,0.9)",
    },
    night: {
      sky: ["#0D1B3E", "#1A237E"],
      mountain1: "#2A3A5A",
      mountain2: "#1E2E4A",
      mountain3: "#121E34",
      grass: "#1A4A1A",
      grassDark: "#0F3A0F",
      ground: "#2A1A08",
      sunColor: "#FFFDE7",
      cloudColor: "rgba(255,255,255,0.15)",
    },
    sunset: {
      sky: ["#FF6B35", "#FFB347"],
      mountain1: "#8B5E3C",
      mountain2: "#7A4E2C",
      mountain3: "#6A3E1C",
      grass: "#5A8A2A",
      grassDark: "#4A7A1A",
      ground: "#6B4A14",
      sunColor: "#FF4500",
      cloudColor: "rgba(255,200,150,0.7)",
    },
  };

  const t = themes[theme];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${t.sky[0]} 0%, ${t.sky[1]} 60%, rgba(250,248,245,0) 100%)`,
          opacity: 0.35,
        }}
      />

      {/* Stars (night only) */}
      {theme === "night" && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-star-twinkle"
              style={{
                width: Math.random() * 3 + 1 + "px",
                height: Math.random() * 3 + 1 + "px",
                top: Math.random() * 50 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 3 + "s",
                animationDuration: Math.random() * 2 + 1.5 + "s",
              }}
            />
          ))}
        </div>
      )}

      {/* Sun / Moon */}
      <div
        className="absolute animate-sun-glow rounded-full"
        style={{
          width: theme === "night" ? "50px" : "70px",
          height: theme === "night" ? "50px" : "70px",
          background: theme === "night"
            ? "radial-gradient(circle, #FFFDE7, #FFF9C4)"
            : theme === "sunset"
            ? "radial-gradient(circle, #FF6B35, #FF4500)"
            : "radial-gradient(circle, #FFE066, #FFD700)",
          top: "8%",
          right: "12%",
          opacity: 0.7,
        }}
      />

      {/* Clouds */}
      <Cloud x={10} y={12} size={1} delay={0} color={t.cloudColor} />
      <Cloud x={35} y={8} size={1.3} delay={3} color={t.cloudColor} />
      <Cloud x={65} y={15} size={0.9} delay={6} color={t.cloudColor} />
      <Cloud x={80} y={6} size={1.1} delay={1.5} color={t.cloudColor} />

      {/* SVG Landscape */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        style={{ height: "280px" }}
      >
        {/* Far mountains */}
        <path
          d="M0,280 L0,180 L120,100 L240,160 L360,80 L480,140 L600,70 L720,130 L840,60 L960,140 L1080,90 L1200,150 L1320,100 L1440,160 L1440,280 Z"
          fill={t.mountain3}
          opacity="0.4"
        />

        {/* Mid mountains */}
        <path
          d="M0,280 L0,200 L180,130 L300,180 L420,110 L540,170 L660,100 L780,160 L900,120 L1020,175 L1140,115 L1260,168 L1380,135 L1440,185 L1440,280 Z"
          fill={t.mountain2}
          opacity="0.5"
        />

        {/* Near hills */}
        <path
          d="M0,280 L0,230 L200,170 L350,210 L500,155 L650,200 L800,165 L950,210 L1100,170 L1250,215 L1440,180 L1440,280 Z"
          fill={t.mountain1}
          opacity="0.6"
        />

        {/* Ground */}
        <rect x="0" y="250" width="1440" height="30" fill={t.ground} opacity="0.5" />

        {/* Grass layer */}
        <path
          d="M0,280 L0,260 Q60,245 120,260 Q180,275 240,258 Q300,245 360,262 Q420,275 480,258 Q540,245 600,262 Q660,275 720,255 Q780,245 840,262 Q900,275 960,255 Q1020,245 1080,262 Q1140,275 1200,258 Q1260,245 1320,262 Q1380,275 1440,258 L1440,280 Z"
          fill={t.grass}
          opacity="0.7"
        />

        {/* Grass blades - decorative */}
        {[...Array(20)].map((_, i) => (
          <g key={i} opacity="0.6">
            <path
              d={`M${i * 72 + 10},260 Q${i * 72 + 8},248 ${i * 72 + 6},240`}
              stroke={t.grassDark}
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M${i * 72 + 20},258 Q${i * 72 + 22},246 ${i * 72 + 24},238`}
              stroke={t.grassDark}
              strokeWidth="2"
              fill="none"
            />
          </g>
        ))}

        {/* Trees */}
        <Tree x={80} y={230} h={40} t={t} />
        <Tree x={180} y={235} h={35} t={t} />
        <Tree x={350} y={228} h={45} t={t} />
        <Tree x={600} y={232} h={38} t={t} />
        <Tree x={800} y={228} h={42} t={t} />
        <Tree x={1000} y={235} h={36} t={t} />
        <Tree x={1200} y={230} h={40} t={t} />
        <Tree x={1350} y={228} h={44} t={t} />

        {/* Birds (day only) */}
        {theme === "day" && (
          <>
            <g className="animate-bird-fly" style={{ animationDelay: "0s" }}>
              <path d="M200,60 Q210,55 220,60" stroke="#444" strokeWidth="1.5" fill="none" />
            </g>
            <g className="animate-bird-fly" style={{ animationDelay: "1s" }}>
              <path d="M240,55 Q250,50 260,55" stroke="#444" strokeWidth="1.5" fill="none" />
            </g>
            <g className="animate-bird-fly" style={{ animationDelay: "2s" }}>
              <path d="M350,70 Q360,65 370,70" stroke="#555" strokeWidth="1.5" fill="none" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

function Cloud({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  return (
    <div
      className="absolute animate-cloud-drift"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        transform: `scale(${size})`,
      }}
    >
      <div className="relative" style={{ width: "80px", height: "35px" }}>
        <div
          className="absolute rounded-full"
          style={{
            background: color,
            width: "50px",
            height: "30px",
            top: "5px",
            left: "15px",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            background: color,
            width: "35px",
            height: "25px",
            top: "8px",
            left: "5px",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            background: color,
            width: "40px",
            height: "28px",
            top: "5px",
            left: "35px",
          }}
        />
      </div>
    </div>
  );
}

function Tree({ x, y, h, t }: { x: number; y: number; h: number; t: { mountain1: string; grass: string } }) {
  return (
    <g>
      {/* Trunk */}
      <rect x={x - 3} y={y + h * 0.7} width="6" height={h * 0.35} fill="#6B4226" opacity="0.7" />
      {/* Canopy layers */}
      <polygon
        points={`${x},${y} ${x - h * 0.4},${y + h * 0.45} ${x + h * 0.4},${y + h * 0.45}`}
        fill={t.mountain1}
        opacity="0.8"
      />
      <polygon
        points={`${x},${y + h * 0.2} ${x - h * 0.45},${y + h * 0.65} ${x + h * 0.45},${y + h * 0.65}`}
        fill={t.grass}
        opacity="0.7"
      />
      <polygon
        points={`${x},${y + h * 0.4} ${x - h * 0.5},${y + h * 0.82} ${x + h * 0.5},${y + h * 0.82}`}
        fill={t.grass}
        opacity="0.6"
      />
    </g>
  );
}
