import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../App";
import { topicConfig } from "../theme";
import BottomNav from "../components/BottomNav";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { navigate, userProfile, currentTheme: t, fontScale } = useApp();
  const topics      = Object.entries(topicConfig);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  const xp     = userProfile?.xp     || 0;
  const streak = userProfile?.streak || 0;

  // Track which card is visible via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIdx(Number(entry.target.dataset.card));
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: t.colors.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Top HUD ── */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 20,
          padding: "44px 20px 20px",
          background: `linear-gradient(to bottom, ${t.colors.bg}F5 0%, ${t.colors.bg}00 100%)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: t.fonts.heading,
            color: t.colors.accent,
            fontWeight: 700,
            fontSize: `${18 * (fontScale || 1)}px`,
            letterSpacing: "-0.3px",
          }}
        >
          ⚡ MicroLearn
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <HudPill icon="🔥" value={streak} label="streak" t={t} />
          <HudPill icon="⚡" value={xp.toLocaleString()} label="XP" t={t} />
        </div>
      </div>

      {/* ── Dot indicators (right side) ── */}
      <div
        style={{
          position: "fixed",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {topics.map(([name, cfg], i) => (
          <div
            key={name}
            style={{
              width: i === activeIdx ? "8px" : "5px",
              height: i === activeIdx ? "8px" : "5px",
              borderRadius: "50%",
              background: i === activeIdx ? cfg.color : t.colors.border,
              transition: "all 0.25s ease",
            }}
          />
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
          // Hide scrollbar
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
        `}</style>

        {topics.map(([name, cfg], i) => (
          <TopicCard
            key={name}
            index={i}
            name={name}
            cfg={cfg}
            t={t}
            fontScale={fontScale || 1}
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
    <div
      style={{
        background: `${t.colors.bgCard}DD`,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radii.full,
        padding: "5px 12px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span style={{ fontSize: "12px" }}>{icon}</span>
      <span
        style={{
          fontFamily: t.fonts.heading,
          color: t.colors.text,
          fontWeight: 600,
          fontSize: "12px",
        }}
      >
        {value}
      </span>
      <span style={{ color: t.colors.textMuted, fontSize: "10px" }}>{label}</span>
    </div>
  );
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ index, name, cfg, t, fontScale, isActive, isLast, onTap }) {
  return (
    <div
      data-card={index}
      style={{
        height: "calc(100vh - 64px)",
        scrollSnapAlign: "start",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 32px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        background: t.colors.bg,
      }}
    >
      {/* Background glow blob */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background: cfg.bg,
          filter: "blur(80px)",
          opacity: isActive ? 0.8 : 0.3,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      />

      {/* Second smaller accent glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "60%",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: cfg.bg,
          filter: "blur(40px)",
          opacity: isActive ? 0.5 : 0.1,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        onClick={onTap}
        style={{
          position: "relative",
          zIndex: 1,
          background: t.isDark
            ? `linear-gradient(145deg, ${t.colors.bgCard} 0%, ${t.colors.bgElevated} 100%)`
            : t.colors.bgCard,
          border: `1px solid ${cfg.border}`,
          borderRadius: t.radii.xl,
          padding: "40px 28px 36px",
          textAlign: "center",
          width: "100%",
          maxWidth: "340px",
          boxShadow: isActive
            ? `0 20px 60px ${cfg.bg}, 0 0 0 1px ${cfg.border}`
            : `0 8px 24px rgba(0,0,0,0.2)`,
          transition: "box-shadow 0.4s ease, transform 0.3s ease",
          transform: isActive ? "scale(1)" : "scale(0.97)",
          animation: isActive ? "floatUp 0.4s ease forwards" : "none",
        }}
      >
        {/* Emoji icon */}
        <div
          style={{
            fontSize: "64px",
            marginBottom: "18px",
            lineHeight: 1,
            display: "block",
          }}
        >
          {cfg.icon}
        </div>

        {/* Topic name */}
        <h2
          style={{
            fontFamily: t.fonts.heading,
            fontSize: `${28 * fontScale}px`,
            fontWeight: "700",
            color: cfg.color,
            margin: "0 0 10px",
            letterSpacing: "-0.5px",
          }}
        >
          {name}
        </h2>

        {/* Description */}
        <p
          style={{
            color: t.colors.textMuted,
            fontSize: `${14 * fontScale}px`,
            lineHeight: "1.55",
            margin: "0 0 28px",
          }}
        >
          {cfg.description}
        </p>

        {/* CTA button */}
        <div
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: t.radii.full,
            padding: "13px 28px",
            color: cfg.color,
            fontFamily: t.fonts.heading,
            fontWeight: "600",
            fontSize: `${14 * fontScale}px`,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Start Learning
          <span style={{ fontSize: "16px" }}>→</span>
        </div>
      </div>

      {/* Swipe hint (only show on first card) */}
      {index === 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            animation: "swipeHint 2s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "18px" }}>↕</span>
          <span
            style={{
              color: t.colors.textDim,
              fontSize: "11px",
              fontFamily: t.fonts.body,
              letterSpacing: "0.04em",
            }}
          >
            swipe to explore topics
          </span>
        </div>
      )}
    </div>
  );
}
