import React, { useState, useRef, useEffect, useMemo } from "react";
import { useApp } from "../App";
import { topicConfig } from "../theme";
import { getUserSessions } from "../utils/db";
import BottomNav from "../components/BottomNav";

// ─── Message pools ────────────────────────────────────────────────────────────

const MESSAGES = {
  morning:    ["Morning, {name}! Set the tone with a quick win.", "Rise and learn, {name}. What's on the menu?", "Good morning, {name}. Let's start the day sharp."],
  lunch:      ["Hey {name}, a side of knowledge with your lunch?", "{name}, got 5 minutes between bites?", "Lunch break brain snack incoming, {name}."],
  evening:    ["Unwind and upgrade. What's for tonight, {name}?", "Evening, {name}. Wind down with something worth knowing.", "Hey {name}, end the day a little smarter."],
  curiosity:  ["Hey {name}, what's one thing you want to master in 5 minutes?", "Ready for a brain snack, {name}?", "Got 300 seconds? Let's learn something cool, {name}."],
  growth:     ["Hey {name}, let's get 1% better today.", "Time for your daily upgrade, {name}.", "Hey {name}, let's add a new tool to your mental kit."],
  action:     ["Hey {name}, let's do something amazing today.", "Ready, set, learn. What's on deck, {name}?", "Hey {name}, let's make these next 5 minutes count."],
  lowFriction:["Hey {name}, got a moment to get smarter?", "Little steps, big results. Ready to start, {name}?", "No pressure, just progress. What'll it be, {name}?"],
};

const VIBE_POOLS = ["curiosity", "growth", "action", "lowFriction"];

function getTimePool() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 14) return "lunch";
  if (h >= 18 && h < 23) return "evening";
  return null;
}

function pickMessage(firstName) {
  const timePool = getTimePool();
  const pool = timePool && Math.random() < 0.4
    ? MESSAGES[timePool]
    : MESSAGES[VIBE_POOLS[Math.floor(Math.random() * VIBE_POOLS.length)]];
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace(/\{name\}/g, firstName);
}

// ─── Engagement scoring ───────────────────────────────────────────────────────
// Returns topics sorted by personalised score, with reason labels

function scoreTopics(sessions) {
  const topics = Object.keys(topicConfig);
  const now    = Date.now();

  // Build per-topic stats
  const stats = {};
  topics.forEach((t) => {
    stats[t] = { count: 0, totalQuiz: 0, quizSessions: 0, lastSeen: null };
  });

  sessions.forEach((s) => {
    const st = stats[s.topic];
    if (!st) return;
    st.count++;
    if (s.quizScore !== undefined && s.quizScore !== null) {
      st.totalQuiz   += s.quizScore;
      st.quizSessions++;
    }
    const ts = s.completedAt?.toDate?.()?.getTime?.() || 0;
    if (!st.lastSeen || ts > st.lastSeen) st.lastSeen = ts;
  });

  const scored = topics.map((topic) => {
    const s          = stats[topic];
    const avgQuiz    = s.quizSessions ? s.totalQuiz / s.quizSessions : null;
    const daysSince  = s.lastSeen ? (now - s.lastSeen) / 86400000 : null;
    const isNew      = s.count === 0;

    let score  = 0;
    let reason = null;

    if (isNew) {
      // Never tried — explore nudge
      score  = 40 + Math.random() * 20;
      reason = "New for you";
    } else {
      // Base: engagement frequency (capped at 10 sessions)
      score += Math.min(s.count, 10) * 3;

      // Quiz performance bonus — high score = strong interest
      if (avgQuiz !== null) {
        score += avgQuiz * 10; // 0–30 points
        if (avgQuiz >= 2.5) reason = "You're excelling here";
        else if (avgQuiz < 1.5) reason = "Worth revisiting";
      }

      // Recency decay — if not visited in >3 days, boost it back up
      if (daysSince !== null && daysSince > 3) {
        score += Math.min(daysSince, 14) * 1.5;
        if (!reason) reason = "Time to revisit";
      }

      // Streak on a topic — if visited today or yesterday, boost
      if (daysSince !== null && daysSince < 1.5) {
        score += 15;
        if (!reason) reason = "On a roll";
      }

      if (!reason) reason = `${s.count} lesson${s.count !== 1 ? "s" : ""} done`;
    }

    return { topic, score, reason, stats: s, avgQuiz, isNew };
  });

  // Sort: highest score first, shuffle ties slightly
  return scored
    .sort((a, b) => (b.score - a.score) + (Math.random() - 0.5) * 2);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { navigate, userProfile, authUser, currentTheme: t } = useApp();

  const xp        = userProfile?.xp     || 0;
  const streak    = userProfile?.streak || 0;
  const firstName = userProfile?.displayName?.split(" ")[0] || "there";

  const greeting  = useMemo(() => pickMessage(firstName), [firstName]);

  const [sessions,       setSessions]       = useState([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const containerRef = useRef(null);

  // Load sessions once for scoring
  useEffect(() => {
    if (!authUser?.uid) return;
    getUserSessions(authUser.uid, 100)
      .then((s) => { setSessions(s); setSessionsLoaded(true); })
      .catch(() => setSessionsLoaded(true));
  }, [authUser?.uid]);

  // Compute ranked topics
  const rankedTopics = useMemo(() => {
    if (!sessionsLoaded) return Object.keys(topicConfig).map((topic) => ({
      topic, reason: null, stats: { count: 0 }, avgQuiz: null, isNew: true,
    }));
    return scoreTopics(sessions);
  }, [sessions, sessionsLoaded]);

  // IntersectionObserver for active card
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-card]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActiveIdx(Number(e.target.dataset.card));
      }),
      { root: container, threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [rankedTopics]);

  return (
    <div style={{ height: "100vh", background: t.colors.bg, position: "relative", overflow: "hidden" }}>

      {/* ── Top HUD ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
        padding: "2.75rem 1.25rem 1.25rem",
        background: `linear-gradient(to bottom, ${t.colors.bg}F5 0%, ${t.colors.bg}00 100%)`,
        pointerEvents: "none",
      }}>
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
        <p style={{
          fontFamily: t.fonts.body, color: t.colors.textMuted,
          fontSize: "0.875rem", lineHeight: 1.45, margin: 0, maxWidth: "280px",
          animation: "greetIn 0.6s ease forwards", opacity: 0,
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
        {rankedTopics.map(({ topic }, i) => {
          const cfg = topicConfig[topic];
          return (
            <div key={topic} style={{
              width: i === activeIdx ? "8px" : "5px",
              height: i === activeIdx ? "8px" : "5px",
              borderRadius: "50%",
              background: i === activeIdx ? cfg.color : t.colors.border,
              transition: "all 0.25s ease",
            }} />
          );
        })}
      </div>

      {/* ── Scroll-snap container ── */}
      <div
        ref={containerRef}
        style={{
          height: "calc(100vh - 64px)", overflowY: "scroll",
          scrollSnapType: "y mandatory", scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none", scrollbarWidth: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @keyframes floatUp  { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
          @keyframes swipeHint{ 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:0.7;transform:translateY(6px)} }
          @keyframes greetIn  { 0%{opacity:0;transform:translateY(-6px)} 100%{opacity:1;transform:translateY(0)} }
        `}</style>

        {rankedTopics.map(({ topic, reason, stats, avgQuiz, isNew }, i) => (
          <TopicCard
            key={topic}
            index={i}
            topic={topic}
            cfg={topicConfig[topic]}
            t={t}
            isActive={i === activeIdx}
            isFirst={i === 0}
            reason={reason}
            lessonCount={stats.count}
            avgQuiz={avgQuiz}
            isNew={isNew}
            onTap={() => navigate("lesson", { topic })}
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
      background: `${t.colors.bgCard}DD`, border: `1px solid ${t.colors.border}`,
      borderRadius: t.radii.full, padding: "0.3125rem 0.75rem",
      display: "flex", alignItems: "center", gap: "0.3125rem",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    }}>
      <span style={{ fontSize: "0.75rem" }}>{icon}</span>
      <span style={{ fontFamily: t.fonts.heading, color: t.colors.text, fontWeight: 600, fontSize: "0.75rem" }}>{value}</span>
      <span style={{ color: t.colors.textMuted, fontSize: "0.625rem" }}>{label}</span>
    </div>
  );
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ index, topic, cfg, t, isActive, isFirst, reason, lessonCount, avgQuiz, isNew, onTap }) {
  // Build mini progress dots based on lesson count
  const progressDots = Math.min(lessonCount, 8);
  const maxDots = 8;

  return (
    <div
      data-card={index}
      style={{
        height: "calc(100vh - 64px)", scrollSnapAlign: "start",
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
        {/* For You / reason tag */}
        {reason && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: t.radii.full, padding: "0.25rem 0.75rem",
            marginBottom: "1rem",
          }}>
            <span style={{ fontSize: "0.625rem" }}>
              {isNew ? "✨" : avgQuiz >= 2.5 ? "🔥" : avgQuiz < 1.5 && !isNew ? "💪" : "📍"}
            </span>
            <span style={{ fontSize: "0.6875rem", color: cfg.color, fontWeight: "600", fontFamily: t.fonts.heading }}>
              {reason}
            </span>
          </div>
        )}

        {/* Icon */}
        <div style={{ fontSize: "4rem", marginBottom: "1.125rem", lineHeight: 1 }}>{cfg.icon}</div>

        {/* Topic name */}
        <h2 style={{
          fontFamily: t.fonts.heading, fontSize: "1.75rem", fontWeight: "700",
          color: cfg.color, margin: "0 0 0.625rem", letterSpacing: "-0.5px",
        }}>
          {topic}
        </h2>

        {/* Description */}
        <p style={{
          color: t.colors.textMuted, fontSize: "0.875rem",
          lineHeight: "1.55", margin: "0 0 1.25rem",
        }}>
          {cfg.description}
        </p>

        {/* Progress dots */}
        {lessonCount > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.375rem", marginBottom: "1.25rem" }}>
            {Array.from({ length: maxDots }).map((_, i) => (
              <div key={i} style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: i < progressDots ? cfg.color : t.colors.border,
                transition: "background 0.2s",
              }} />
            ))}
            {lessonCount > maxDots && (
              <span style={{ color: cfg.color, fontSize: "0.625rem", marginLeft: "0.25rem", fontWeight: "700" }}>
                +{lessonCount - maxDots}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: t.radii.full, padding: "0.8125rem 1.75rem",
          color: cfg.color, fontFamily: t.fonts.heading,
          fontWeight: "600", fontSize: "0.875rem",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
        }}>
          {lessonCount === 0 ? "Start Learning" : "Next Lesson"}
          <span style={{ fontSize: "1rem" }}>→</span>
        </div>
      </div>

      {/* Swipe hint on first card only */}
      {isFirst && (
        <div style={{
          position: "absolute", bottom: "1.25rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
          animation: "swipeHint 2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: "1.125rem" }}>↕</span>
          <span style={{ color: t.colors.textDim, fontSize: "0.6875rem", fontFamily: t.fonts.body, letterSpacing: "0.04em" }}>
            swipe to explore topics
          </span>
        </div>
      )}
    </div>
  );
}
