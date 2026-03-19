import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import { saveSession, updateUserStats } from "../utils/db";
import {
  xpForQuiz,
  getLevelForXP,
  calcNewStreak,
  checkNewBadges,
} from "../utils/gamification";
import { topicConfig } from "../theme";

// ─── Fetch quiz directly, grounded in the actual lesson text ─────────────────

async function fetchQuizFromLesson(lessonText, topic, apiKey) {
  const prompt = `You just taught a micro-lesson on "${topic}". Here is the exact lesson content:

---
${lessonText.slice(0, 3000)}
---

Based ONLY on what was taught above, generate exactly 3 multiple-choice quiz questions that test understanding of the specific content in this lesson.

Respond with ONLY valid JSON in this exact format, no markdown, no preamble:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Rules:
- "correct" is the 0-based index of the correct option
- All 4 options must be plausible
- Questions must be directly about the lesson content above, not generic ${topic} trivia`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const raw = data?.content?.[0]?.text || "";
  // Strip any accidental markdown fences
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

export default function QuizScreen() {
  const {
    apiKey, currentLesson, lessonTopic,
    navigate, authUser, userProfile, reloadProfile,
    currentTheme: t,
  } = useApp();

  const topic = lessonTopic || "Tech";
  const cfg   = topicConfig[topic] || topicConfig["Tech"];

  const [quiz,      setQuiz]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score,     setScore]     = useState(0);
  const [xpEarned,  setXpEarned]  = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const containerRef = useRef(null);

  // ── Load quiz ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentLesson) { navigate("dashboard"); return; }

    const lessonText = typeof currentLesson === "string"
      ? currentLesson
      : currentLesson.content || currentLesson.text || "";

    fetchQuizFromLesson(lessonText, topic, apiKey)
      .then((q) => { setQuiz(q); setLoading(false); })
      .catch((err) => {
        console.error("Quiz fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track active card ─────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !quiz) return;
    const cards = container.querySelectorAll("[data-quiz-card]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActiveCard(Number(e.target.dataset.quizCard));
      }),
      { root: container, threshold: 0.55 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [quiz]);

  // ── Answer selection ───────────────────────────────────────────────────────
  const handleAnswer = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    setScore(correct);
    setSubmitted(true);

    setSaving(true);
    const earned = xpForQuiz(correct, quiz.questions.length);
    setXpEarned(earned);

    const { newStreak } = calcNewStreak(userProfile?.streak || 0, userProfile?.lastSessionDate);
    const newXP     = (userProfile?.xp || 0) + earned;
    const newLevel  = getLevelForXP(newXP).level;
    const newTotal  = (userProfile?.totalSessions || 0) + 1;
    const updatedProfile = { ...userProfile, xp: newXP, level: newLevel, streak: newStreak, totalSessions: newTotal };
    const badges = checkNewBadges(updatedProfile, { quizScore: correct }, userProfile?.badges || []);
    setNewBadges(badges);

    try {
      await saveSession(authUser.uid, {
        topic, lessonTitle: topic, quizScore: correct, xpEarned: earned,
      });
      await updateUserStats(authUser.uid, {
        xp: newXP, level: newLevel, streak: newStreak,
        lastSessionDate: new Date(), totalSessions: newTotal,
        badges: [...(userProfile?.badges || []), ...badges.map((b) => b.id)],
      });
      await reloadProfile();
    } catch (e) {
      console.error("Session save error:", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: "100vh", background: t.colors.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1rem",
      }}>
        <div style={{ fontSize: "2.5rem", animation: "spin 1.5s linear infinite" }}>🎯</div>
        <p style={{ color: t.colors.textMuted, fontFamily: t.fonts.body, fontSize: "0.9375rem" }}>
          Building your quiz…
        </p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh", background: t.colors.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1.5rem",
      }}>
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <p style={{ color: t.colors.error, textAlign: "center", fontSize: "0.9375rem" }}>{error}</p>
        <button onClick={() => navigate("dashboard")} style={{
          background: t.colors.accentDim, border: `1px solid ${t.colors.accent}40`,
          borderRadius: t.radii.full, padding: "0.75rem 1.5rem",
          color: t.colors.accent, fontFamily: t.fonts.heading,
          fontWeight: "600", cursor: "pointer",
        }}>
          Back to Topics
        </button>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (submitted) {
    const total   = quiz?.questions?.length || 3;
    const percent = Math.round((score / total) * 100);
    const emoji   = percent === 100 ? "🎯" : percent >= 66 ? "🌟" : "💪";
    const msg     = percent === 100 ? "Perfect score!" : percent >= 66 ? "Great work!" : "Keep going!";

    return (
      <div style={{
        minHeight: "100vh", background: t.colors.bg,
        display: "flex", flexDirection: "column",
        padding: "3.75rem 1.5rem 2.5rem",
      }}>
        {/* Score header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "0.75rem" }}>{emoji}</div>
          <h1 style={{
            fontFamily: t.fonts.heading, fontSize: "1.875rem", fontWeight: "800",
            color: t.colors.text, marginBottom: "0.375rem",
          }}>{msg}</h1>
          <p style={{ color: t.colors.textMuted, fontSize: "0.9375rem" }}>
            {score} / {total} correct
          </p>
        </div>

        {/* XP earned */}
        <div style={{
          background: t.colors.accentDim,
          border: `1px solid ${t.colors.accent}25`,
          borderRadius: t.radii.lg, padding: "1.25rem",
          textAlign: "center", marginBottom: "0.875rem",
        }}>
          <div style={{
            fontFamily: t.fonts.heading, fontSize: "2.5rem",
            fontWeight: "800", color: t.colors.accent,
          }}>+{xpEarned} XP</div>
          <div style={{ color: t.colors.textMuted, fontSize: "0.8125rem" }}>earned this session</div>
        </div>

        {/* Answer review */}
        {quiz?.questions?.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.correct;
          return (
            <div key={i} style={{
              background: t.colors.bgCard,
              border: `1px solid ${isCorrect ? t.colors.success + "40" : t.colors.error + "40"}`,
              borderRadius: t.radii.md, padding: "0.875rem", marginBottom: "0.625rem",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{isCorrect ? "✅" : "❌"}</span>
                <p style={{ fontSize: "0.8125rem", fontWeight: "500", color: t.colors.text, lineHeight: "1.4", margin: 0 }}>
                  {q.question}
                </p>
              </div>
              <p style={{ fontSize: "0.75rem", color: t.colors.textMuted, paddingLeft: "1.5rem", lineHeight: "1.5", margin: 0 }}>
                <strong style={{ color: t.colors.success }}>✓ {q.options[q.correct]}</strong>
                {" — "}{q.explanation}
              </p>
            </div>
          );
        })}

        {/* New badges */}
        {newBadges.length > 0 && (
          <div style={{
            background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
            borderRadius: t.radii.lg, padding: "1rem", marginBottom: "0.875rem",
          }}>
            <h3 style={{ fontFamily: t.fonts.heading, color: t.colors.text, marginBottom: "0.75rem", fontSize: "0.9375rem" }}>
              🏆 New Badges!
            </h3>
            {newBadges.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.75rem" }}>{b.icon}</span>
                <div>
                  <div style={{ fontFamily: t.fonts.heading, color: t.colors.text, fontWeight: "600", fontSize: "0.875rem" }}>
                    {b.title}
                  </div>
                  <div style={{ color: t.colors.textMuted, fontSize: "0.75rem" }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("dashboard")}
          style={{
            background: t.colors.accent, color: "#000", border: "none",
            borderRadius: t.radii.full, padding: "1rem", width: "100%",
            fontFamily: t.fonts.heading, fontSize: "1rem", fontWeight: "700",
            cursor: "pointer", marginTop: "auto",
          }}
        >
          Back to Topics →
        </button>
      </div>
    );
  }

  // ── TikTok quiz cards ──────────────────────────────────────────────────────
  const questions   = quiz?.questions || [];
  const allAnswered = questions.every((_, i) => answers[i] !== undefined);
  const totalCards  = questions.length + 1; // questions + submit card

  return (
    <div style={{ height: "100vh", background: t.colors.bg, position: "relative", overflow: "hidden" }}>
      <style>{`
        [data-quiz-scroll]::-webkit-scrollbar { display: none; }
        @keyframes cardIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
        padding: "env(safe-area-inset-top, 12px) 1.25rem 0",
        background: `linear-gradient(to bottom, ${t.colors.bg} 60%, ${t.colors.bg}00)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.75rem", paddingBottom: "0.625rem" }}>
          <button onClick={() => navigate("lesson")} style={{
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
              <span style={{ fontSize: "0.75rem" }}>🎯</span>
              <span style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: "600", fontFamily: t.fonts.heading }}>
                Quiz · {topic}
              </span>
            </div>
          </div>

          <span style={{ color: t.colors.textMuted, fontSize: "0.75rem", fontFamily: t.fonts.heading }}>
            {Math.min(activeCard + 1, questions.length)} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: t.colors.border, borderRadius: t.radii.full, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.max((Object.keys(answers).length / questions.length) * 100, 4)}%`,
            background: `linear-gradient(90deg, ${cfg.color} 0%, ${t.colors.accent} 100%)`,
            borderRadius: t.radii.full, transition: "width 0.35s ease",
          }} />
        </div>
      </div>

      {/* ── Scroll-snap cards ── */}
      <div
        data-quiz-scroll
        ref={containerRef}
        style={{
          height: "100vh", overflowY: "scroll",
          scrollSnapType: "y mandatory", scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none", scrollbarWidth: "none",
        }}
      >
        {/* One card per question */}
        {questions.map((q, qi) => {
          const isActive   = qi === activeCard;
          const isAnswered = answers[qi] !== undefined;

          return (
            <div
              key={qi}
              data-quiz-card={qi}
              style={{
                height: "100vh", scrollSnapAlign: "start",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "6rem 1.5rem 3rem",
              }}
            >
              <div style={{
                width: "100%", maxWidth: "420px",
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
                transform: isActive ? "scale(1)" : "scale(0.97)",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
              }}>
                {/* Q number chip */}
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  marginBottom: "1rem", background: cfg.bg,
                  borderRadius: t.radii.full, padding: "0.25rem 0.75rem",
                }}>
                  <span style={{ fontSize: "0.6875rem", color: cfg.color, fontWeight: "700", fontFamily: t.fonts.heading, letterSpacing: "0.04em" }}>
                    QUESTION {qi + 1}
                  </span>
                </div>

                {/* Question text */}
                <p style={{
                  fontFamily: t.fonts.heading, fontSize: "1.0625rem",
                  fontWeight: "600", color: t.colors.text,
                  lineHeight: "1.45", marginBottom: "1.25rem",
                }}>
                  {q.question}
                </p>

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, oi)}
                        style={{
                          background: isSelected ? cfg.bg : t.colors.bgElevated,
                          border: `1.5px solid ${isSelected ? cfg.color : t.colors.border}`,
                          borderRadius: t.radii.md, padding: "0.8125rem 1rem",
                          textAlign: "left", cursor: "pointer",
                          color: isSelected ? cfg.color : t.colors.textMuted,
                          fontFamily: t.fonts.body, fontSize: "0.9375rem",
                          fontWeight: isSelected ? "600" : "400",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: "0.625rem",
                        }}
                      >
                        <span style={{
                          width: "1.375rem", height: "1.375rem", borderRadius: "50%", flexShrink: 0,
                          border: `1.5px solid ${isSelected ? cfg.color : t.colors.border}`,
                          background: isSelected ? cfg.color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.625rem", color: isSelected ? t.colors.bg : "transparent",
                          fontWeight: "700",
                        }}>
                          {isSelected ? "✓" : ""}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Swipe hint */}
              {isActive && !isAnswered && (
                <div style={{
                  marginTop: "1.25rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                  animation: "pulse 2s ease-in-out infinite",
                }}>
                  <span style={{ fontSize: "1.125rem" }}>↕</span>
                  <span style={{ color: t.colors.textDim, fontSize: "0.6875rem", fontFamily: t.fonts.body }}>
                    tap an answer, then swipe
                  </span>
                </div>
              )}
              {isActive && isAnswered && qi < questions.length - 1 && (
                <div style={{
                  marginTop: "1.25rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                  animation: "pulse 2s ease-in-out infinite",
                }}>
                  <span style={{ fontSize: "1.125rem" }}>↕</span>
                  <span style={{ color: t.colors.textDim, fontSize: "0.6875rem", fontFamily: t.fonts.body }}>
                    swipe for next question
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Submit card */}
        <div
          data-quiz-card={questions.length}
          style={{
            height: "100vh", scrollSnapAlign: "start",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "6rem 1.5rem 3rem",
          }}
        >
          <div style={{
            width: "100%", maxWidth: "420px",
            background: t.isDark
              ? `linear-gradient(145deg, ${t.colors.bgCard} 0%, ${t.colors.bgElevated} 100%)`
              : t.colors.bgCard,
            border: `1px solid ${allAnswered ? cfg.border : t.colors.border}`,
            borderRadius: t.radii.xl, padding: "2rem 1.5rem",
            textAlign: "center",
            boxShadow: allAnswered ? `0 16px 48px ${cfg.bg}` : "none",
            animation: activeCard === questions.length ? "cardIn 0.35s ease forwards" : "none",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              {allAnswered ? "🎯" : "⏳"}
            </div>
            <h2 style={{
              fontFamily: t.fonts.heading, fontSize: "1.25rem",
              fontWeight: "700", color: t.colors.text, marginBottom: "0.5rem",
            }}>
              {allAnswered ? "Ready to submit!" : `${questions.length - Object.keys(answers).length} question${questions.length - Object.keys(answers).length !== 1 ? "s" : ""} left`}
            </h2>
            <p style={{ color: t.colors.textMuted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              {allAnswered
                ? `You answered all ${questions.length} questions.`
                : "Swipe back up to answer remaining questions."}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              style={{
                width: "100%", padding: "1rem",
                background: allAnswered
                  ? `linear-gradient(135deg, ${cfg.color} 0%, ${t.colors.accent} 100%)`
                  : t.colors.bgElevated,
                border: "none", borderRadius: t.radii.full,
                color: allAnswered ? "#000" : t.colors.textDim,
                fontFamily: t.fonts.heading, fontSize: "1rem", fontWeight: "700",
                cursor: allAnswered ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              {saving ? "Saving…" : "Submit Quiz →"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Side dots ── */}
      <div style={{
        position: "fixed", right: "1rem", top: "50%",
        transform: "translateY(-50%)", zIndex: 20,
        display: "flex", flexDirection: "column", gap: "0.5rem",
        pointerEvents: "none",
      }}>
        {Array.from({ length: totalCards }).map((_, i) => (
          <div key={i} style={{
            width: i === activeCard ? "8px" : "5px",
            height: i === activeCard ? "8px" : "5px",
            borderRadius: "50%",
            background: i === activeCard
              ? cfg.color
              : answers[i] !== undefined
              ? cfg.color + "60"
              : t.colors.border,
            transition: "all 0.25s ease",
          }} />
        ))}
      </div>
    </div>
  );
}
