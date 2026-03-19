import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "../App";
import { topicConfig } from "../theme";
import BottomNav from "../components/BottomNav";

// ─── Message pools ────────────────────────────────────────────────────────────

const MESSAGES = {
  morning: [
    "Morning, {name}! Set the tone with a quick win.",
    "Good morning, {name}. Let's start the day sharp.",
    "Early bird gets the knowledge, {name}. Let's go.",
    "Rise and learn, {name}. What's on the menu?",
  ],
  lunch: [
    "Hey {name}, a side of knowledge with your lunch?",
    "Lunch break brain snack incoming, {name}.",
    "{name}, got 5 minutes between bites?",
    "Hey {name}, let's make your lunch break count.",
  ],
  evening: [
    "Unwind and upgrade. What's for tonight, {name}?",
    "Evening, {name}. Wind down with something worth knowing.",
    "Hey {name}, end the day a little smarter.",
    "Golden hour, golden knowledge. Ready, {name}?",
  ],
  curiosity: [
    "Hey {name}, what's one thing you want to master in 5 minutes?",
    "Ready for a brain snack, {name}?",
    "Hey {name}, what's piquing your interest today?",
    "Got 300 seconds? Let's learn something cool, {name}.",
  ],
  growth: [
    "Hey {name}, let's get 1% better today.",
    "Time for your daily upgrade, {name}.",
    "Hey {name}, let's add a new tool to your mental kit.",
    "Ready to grow? We've got a seat saved for you, {name}.",
  ],
  action: [
    "Hey {name}, let's do something amazing today.",
    "Ready, set, learn. What's on deck, {name}?",
    "Hey {name}, let's make these next 5 minutes count.",
    "Quick boost or deep dive? Your choice, {name}.",
  ],
  lowFriction: [
    "Hey {name}, got a moment to get smarter?",
    "Little steps, big results. Ready to start, {name}?",
    "Hey {name}, fit a little wisdom into your day.",
    "No pressure, just progress. What'll it be, {name}?",
  ],
};

function getTimePool() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 14) return "lunch";
  if (h >= 18 && h < 23) return "evening";
  return null;
}

const VIBE_POOLS = ["curiosity", "growth", "action", "lowFriction"];

function pickMessage(firstName) {
  const timePool = getTimePool();

  // 40% chance to use a time-contextual message if one fits the hour
  const pool = timePool && Math.random() < 0.4
    ? MESSAGES[timePool]
    : MESSAGES[VIBE_POOLS[Math.floor(Math.random() * VIBE_POOLS.length)]];

  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace(/\{name\}/g, firstName);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { navigate, userProfile, currentTheme: t } = useApp();
  const topics       = Object.entries(topicConfig);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  const xp     = userProfile?.xp     || 0;
  const streak = userProfile?.streak || 0;
  const firstName = userProfile?.displayName?.split(" ")[0] || "there";

  // Pick a message once per mount (changes each time you visit the dashboard)
  const greeting = useMemo(() => pickMessage(firstName), [firstName]);

  // Track which card is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIdx(Number(entry.target.dataset.card));
        });
      },
      { root: container, threshold: 0.6 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ height: "100vh", background: t.colors.bg, position: "relative", overflow: "hidden" }}>

      {/* ── Top HUD ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
        padding: "2.75rem 1.25rem 1.25rem",
        background: `linear-gradient(to bottom, ${t.colors.bg}F5 0%, ${t.colors.bg}00 100%)`,
        pointerEvents: "none",
      }}>
        {/* Logo + XP pills row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
          <div style={{
            fontFamily: t.fonts.heading, color: t.colors.accent,
            fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.3px",
          }}>
            ⚡ MicroLearn
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <HudPill icon="🔥" value={streak} label="streak" t={t} />
            <HudPill icon="⚡" value={xp.toLocaleString()} label="XP" t={t} />
          </div>
        </div>

        {/* Motivational greeting */}
        <p style={{
          fontFamily: t.fonts.body,
          color: t.colors.textMuted,
          fontSize: "0.875rem",
          lineHeight: 1.45,
          margin: 0,
          maxWidth: "280px",
          // Fade in
          animation: "greetIn 0.6s ease forwards",
          opacity: 0,
        }}>
          {greeting}
        </p>
      </div>

      {/* ── Side dot indicators ── */}
      <div style={{
        position: "fixed", right: "1rem", top: "50%",
        transform: "translateY(-50%)", zIndex: 20,
        display: "flex", flexDirection: "column", gap: "0.5rem",
        pointerEvents: "none",
      }}>
        {topics.map(([name, cfg], i) => (
          <div key={name} style={{
            width: i === activeIdx ? "8px" : "5px",
            height: i === activeIdx ? "8px" : "5px",
            borderRadius: "50%",
            background: i === activeIdx ? cfg.color : t.colors.border,
            transition: "all 0.25s ease",
          }} />
        ))}
      </div>

      {/* ── Scroll-snap container ── */}
      <div
        ref={containerRef}
        style={{
          height: "calc(100vh - 64px)",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @keyframes floatUp {
            0%   { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes swipeHint {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50%       { opacity: 0.7; transform: translateY(6px); }
          }
          @keyframes greetIn {
            0%   { opacity: 0; transform: translateY(-6px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {topics.map(([name, cfg], i) => (
          <TopicCard
            key={name}
            index={i}
            name={name}
            cfg={cfg}
            t={t}
            isActive={i === activeIdx}
            isLast={i === topics.length - 1}
            onTap={() => navigate("lesson", { topic: name })}
          />
        ))}
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}

// ─── HUD Pill ─────────────────────────────────────────────────────────────────

function HudPill({ icon, value, label, t }) {
  return (
    <div style={{
      background: `${t.colors.bgCard}DD`,
      border: `1px solid ${t.colors.border}`,
      borderRadius: t.radii.full,
      padding: "0.3125rem 0.75rem",
      display: "flex", alignItems: "center", gap: "0.3125rem",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    }}>
      <span style={{ fontSize: "0.75rem" }}>{icon}</span>
      <span style={{ fontFamily: t.fonts.heading, color: t.colors.text, fontWeight: 600, fontSize: "0.75rem" }}>
        {value}
      </span>
      <span style={{ color: t.colors.textMuted, fontSize: "0.625rem" }}>{label}</span>
    </div>
  );
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ index, name, cfg, t, isActive, isLast, onTap }) {
  return (
    <div
      data-card={index}
      style={{
        height: "calc(100vh - 64px)",
        scrollSnapAlign: "start",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "5rem 1.5rem 2rem",
        position: "relative", overflow: "hidden",
        background: t.colors.bg,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "340px", height: "340px", borderRadius: "50%",
        background: cfg.bg, filter: "blur(80px)",
        opacity: isActive ? 0.8 : 0.3,
        transition: "opacity 0.5s ease", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "30%", left: "60%",
        width: "120px", height: "120px", borderRadius: "50%",
        background: cfg.bg, filter: "blur(40px)",
        opacity: isActive ? 0.5 : 0.1,
        transition: "opacity 0.5s ease", pointerEvents: "none",
      }} />

      {/* Card */}
      <div
        onClick={onTap}
        style={{
          position: "relative", zIndex: 1,
          background: t.isDark
            ? `linear-gradient(145deg, ${t.colors.bgCard} 0%, ${t.colors.bgElevated} 100%)`
            : t.colors.bgCard,
          border: `1px solid ${cfg.border}`,
          borderRadius: t.radii.xl,
          padding: "2.5rem 1.75rem 2.25rem",
          textAlign: "center", width: "100%", maxWidth: "340px",
          boxShadow: isActive
            ? `0 20px 60px ${cfg.bg}, 0 0 0 1px ${cfg.border}`
            : `0 8px 24px rgba(0,0,0,0.2)`,
          transition: "box-shadow 0.4s ease, transform 0.3s ease",
          transform: isActive ? "scale(1)" : "scale(0.97)",
          animation: isActive ? "floatUp 0.4s ease forwards" : "none",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1.125rem", lineHeight: 1 }}>
          {cfg.icon}
        </div>
        <h2 style={{
          fontFamily: t.fonts.heading, fontSize: "1.75rem", fontWeight: "700",
          color: cfg.color, margin: "0 0 0.625rem", letterSpacing: "-0.5px",
        }}>
          {name}
        </h2>
        <p style={{
          color: t.colors.textMuted, fontSize: "0.875rem",
          lineHeight: "1.55", margin: "0 0 1.75rem",
        }}>
          {cfg.description}
        </p>
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: t.radii.full, padding: "0.8125rem 1.75rem",
          color: cfg.color, fontFamily: t.fonts.heading,
          fontWeight: "600", fontSize: "0.875rem",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
        }}>
          Start Learning <span style={{ fontSize: "1rem" }}>→</span>
        </div>
      </div>

      {/* Swipe hint on first card only */}
      {index === 0 && (
        <div style={{
          position: "absolute", bottom: "1.25rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
          animation: "swipeHint 2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: "1.125rem" }}>↕</span>
          <span style={{
            color: t.colors.textDim, fontSize: "0.6875rem",
            fontFamily: t.fonts.body, letterSpacing: "0.04em",
          }}>
            swipe to explore topics
          </span>
        </div>
      )}
    </div>
  );
}
