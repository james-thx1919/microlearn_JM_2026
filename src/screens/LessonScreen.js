import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import { topicConfig } from "../theme";
import { saveSession } from "../utils/db";
import { awardXP } from "../utils/gamification";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Split a flat lesson string into card-sized chunks.
 *  Tries to split on blank lines / markdown headings first,
 *  then falls back to ~250-char paragraph chunks. */
function splitIntoCards(text) {
  if (!text) return ["Loading your lesson…"];

  // If the lesson already has sections as an array, handled by caller
  // Split on double newlines or markdown h2/h3 headings
  const raw = text
    .split(/\n\s*\n|(?=\n#{1,3} )/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Merge very short chunks with the next one (< 60 chars)
  const merged = [];
  let buf = "";
  raw.forEach((chunk) => {
    buf = buf ? buf + "\n\n" + chunk : chunk;
    if (buf.length >= 80) { merged.push(buf); buf = ""; }
  });
  if (buf) merged.push(buf);

  return merged.length ? merged : [text];
}

/** Render a markdown-lite card body — bold, bullet points, headings */
function CardBody({ text, t }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {lines.map((line, i) => {
        // Heading
        if (/^#{1,3} /.test(line)) {
          const content = line.replace(/^#{1,3} /, "");
          return (
            <p key={i} style={{
              fontFamily: t.fonts.heading, fontWeight: "700",
              fontSize: "1.125rem", color: t.colors.text,
              margin: 0, lineHeight: 1.3,
            }}>
              {content}
            </p>
          );
        }
        // Bullet
        if (/^[-*] /.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
              <span style={{ color: t.colors.accent, flexShrink: 0, marginTop: "0.15rem", fontSize: "0.9rem" }}>•</span>
              <p style={{ margin: 0, color: t.colors.text, fontSize: "1rem", lineHeight: 1.6 }}>
                {renderInline(line.replace(/^[-*] /, ""), t)}
              </p>
            </div>
          );
        }
        // Normal paragraph
        if (line.trim()) {
          return (
            <p key={i} style={{ margin: 0, color: t.colors.text, fontSize: "1rem", lineHeight: 1.65 }}>
              {renderInline(line, t)}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

/** Render **bold** inline markdown */
function renderInline(text, t) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} style={{ color: t.colors.text, fontWeight: "700" }}>{part.slice(2, -2)}</strong>
      : part
  );
}

// ─── LessonScreen ─────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const { navigate, lessonTopic, currentLesson, apiKey, authUser, userProfile, setUserProfile, currentTheme: t } = useApp();

  const topic     = lessonTopic || "Tech";
  const cfg       = topicConfig[topic] || topicConfig["Tech"];

  // ── Lesson content state ───────────────────────────────────────────────────
  const [lessonText, setLessonText]   = useState("");
  const [cards, setCards]             = useState([]);
  const [loading, setLoading]         = useState(!currentLesson);
  const [error, setError]             = useState(null);

  // ── Navigation state ───────────────────────────────────────────────────────
  const [activeCard, setActiveCard]   = useState(0);
  const containerRef                  = useRef(null);

  // ── Fetch lesson if not already loaded ────────────────────────────────────
  useEffect(() => {
    if (currentLesson) {
      // currentLesson may be a string or { content, title, sections[] }
      const text =
        typeof currentLesson === "string"
          ? currentLesson
          : currentLesson.content || currentLesson.text || JSON.stringify(currentLesson);
      setLessonText(text);
      setCards(splitIntoCards(text));
      setLoading(false);
      return;
    }

    if (!apiKey) { setError("No API key configured."); setLoading(false); return; }

    setLoading(true);
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Create a concise micro-lesson on the topic of "${topic}". 
Format with 4-6 sections separated by blank lines. Each section should have a short heading (use ## prefix) and 2-3 sentences of content. Use **bold** for key terms. Keep total length to ~400 words. Be engaging and practical.`,
        }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data?.content?.[0]?.text || "Lesson content unavailable.";
        setLessonText(text);
        setCards(splitIntoCards(text));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load lesson. Please try again.");
        setLoading(false);
      });
  }, [topic, currentLesson, apiKey]);

  // ── Track active card via IntersectionObserver ────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || cards.length === 0) return;

    const cardEls = container.querySelectorAll("[data-lesson-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveCard(Number(e.target.dataset.lessonCard));
        });
      },
      { root: container, threshold: 0.55 }
    );
    cardEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [cards]);

  // ── Finish lesson → quiz ──────────────────────────────────────────────────
  const handleFinish = async () => {
    try {
      await saveSession(authUser.uid, { topic, lessonText, xpEarned: 10 });
      const updated = await awardXP(authUser.uid, userProfile, 10, []);
      if (updated) setUserProfile(updated);
    } catch (e) {
      console.error("Save session error:", e);
    }
    navigate("quiz", { topic, lesson: lessonText });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: "100vh", background: t.colors.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem",
      }}>
        <div style={{ fontSize: "2.5rem", animation: "spin 1.5s linear infinite" }}>{cfg.icon}</div>
        <p style={{ color: t.colors.textMuted, fontFamily: t.fonts.body, fontSize: "0.9375rem" }}>
          Preparing your lesson…
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh", background: t.colors.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1rem", padding: "1.5rem",
      }}>
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <p style={{ color: t.colors.error, textAlign: "center", fontSize: "0.9375rem" }}>{error}</p>
        <button onClick={() => navigate("dashboard")} style={{
          background: t.colors.accentDim, border: `1px solid ${t.colors.accent}40`,
          borderRadius: t.radii.full, padding: "0.75rem 1.5rem",
          color: t.colors.accent, fontFamily: t.fonts.heading, fontWeight: "600",
          cursor: "pointer", fontSize: "0.9375rem",
        }}>
          Back to Topics
        </button>
      </div>
    );
  }

  const progress = cards.length > 1 ? activeCard / (cards.length - 1) : 0;

  return (
    <div style={{ height: "100vh", background: t.colors.bg, position: "relative", overflow: "hidden" }}>
      <style>{`
        [data-lesson-scroll]::-webkit-scrollbar { display: none; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
      `}</style>

      {/* ── Top bar: back + progress ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
        padding: "env(safe-area-inset-top, 12px) 1.25rem 0",
        background: `linear-gradient(to bottom, ${t.colors.bg} 60%, ${t.colors.bg}00)`,
      }}>
        {/* Back + topic label row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.75rem", paddingBottom: "0.625rem" }}>
          <button onClick={() => navigate("dashboard")} style={{
            background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
            borderRadius: t.radii.full, width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <span style={{ fontSize: "0.875rem", color: t.colors.textMuted }}>←</span>
          </button>

          <div style={{ flex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: t.radii.full, padding: "0.25rem 0.75rem",
            }}>
              <span style={{ fontSize: "0.75rem" }}>{cfg.icon}</span>
              <span style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: "600", fontFamily: t.fonts.heading }}>
                {topic}
              </span>
            </div>
          </div>

          {/* Card counter */}
          <span style={{ color: t.colors.textMuted, fontSize: "0.75rem", fontFamily: t.fonts.heading }}>
            {activeCard + 1} / {cards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: "3px", background: t.colors.border, borderRadius: t.radii.full, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${Math.max(((activeCard + 1) / cards.length) * 100, 4)}%`,
            background: `linear-gradient(90deg, ${cfg.color} 0%, ${t.colors.accent} 100%)`,
            borderRadius: t.radii.full,
            transition: "width 0.35s ease",
          }} />
        </div>
      </div>

      {/* ── Scroll-snap card container ── */}
      <div
        data-lesson-scroll
        ref={containerRef}
        style={{
          height: "100vh",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {cards.map((cardText, i) => {
          const isActive  = i === activeCard;
          const isLast    = i === cards.length - 1;

          return (
            <div
              key={i}
              data-lesson-card={i}
              style={{
                height: "100vh",
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "6rem 1.5rem 3rem",
              }}
            >
              {/* Card */}
              <div style={{
                width: "100%", maxWidth: "400px",
                background: t.isDark
                  ? `linear-gradient(145deg, ${t.colors.bgCard} 0%, ${t.colors.bgElevated} 100%)`
                  : t.colors.bgCard,
                border: `1px solid ${isActive ? cfg.border : t.colors.border}`,
                borderRadius: t.radii.xl,
                padding: "1.75rem 1.5rem",
                boxShadow: isActive
                  ? `0 16px 48px ${cfg.bg}, 0 0 0 1px ${cfg.border}`
                  : "0 4px 16px rgba(0,0,0,0.15)",
                animation: isActive ? "cardIn 0.35s ease forwards" : "none",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                transform: isActive ? "scale(1)" : "scale(0.97)",
              }}>
                {/* Card number chip */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  marginBottom: "1rem",
                  background: cfg.bg, borderRadius: t.radii.full,
                  padding: "0.25rem 0.75rem",
                }}>
                  <span style={{ fontSize: "0.6875rem", color: cfg.color, fontWeight: "700", fontFamily: t.fonts.heading, letterSpacing: "0.04em" }}>
                    {isLast ? "FINAL" : `CARD ${i + 1}`}
                  </span>
                </div>

                <CardBody text={cardText} t={t} />

                {/* Last card CTA */}
                {isLast && (
                  <button
                    onClick={handleFinish}
                    style={{
                      marginTop: "1.5rem",
                      width: "100%",
                      padding: "0.875rem",
                      background: `linear-gradient(135deg, ${cfg.color} 0%, ${t.colors.accent} 100%)`,
                      border: "none",
                      borderRadius: t.radii.full,
                      color: "#000",
                      fontFamily: t.fonts.heading,
                      fontWeight: "700",
                      fontSize: "0.9375rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Take the Quiz 🎯
                  </button>
                )}
              </div>

              {/* Swipe hint (not on last card) */}
              {!isLast && isActive && (
                <div style={{
                  marginTop: "1.25rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                  animation: "pulse 2s ease-in-out infinite",
                }}>
                  <span style={{ fontSize: "1.125rem" }}>↕</span>
                  <span style={{ color: t.colors.textDim, fontSize: "0.6875rem", fontFamily: t.fonts.body, letterSpacing: "0.04em" }}>
                    swipe for next
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Right-side dot progress ── */}
      <div style={{
        position: "fixed", right: "1rem", top: "50%",
        transform: "translateY(-50%)", zIndex: 20,
        display: "flex", flexDirection: "column", gap: "0.5rem",
        pointerEvents: "none",
      }}>
        {cards.map((_, i) => (
          <div key={i} style={{
            width: i === activeCard ? "8px" : "5px",
            height: i === activeCard ? "8px" : "5px",
            borderRadius: "50%",
            background: i === activeCard ? cfg.color : t.colors.border,
            transition: "all 0.25s ease",
          }} />
        ))}
      </div>
    </div>
  );
}
