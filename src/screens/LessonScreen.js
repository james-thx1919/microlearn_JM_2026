import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import { generateLesson } from "../utils/ai";
import { getUserSessions } from "../utils/db";
import { theme, topicConfig } from "../theme";

export default function LessonScreen() {
  const {
    apiKey,
    lessonTopic,
    navigate,
    authUser,
    currentLesson,
    setCurrentLesson,
  } = useApp();
  const [lesson, setLesson] = useState(currentLesson);
  const [loading, setLoading] = useState(!currentLesson);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showAction, setShowAction] = useState(false);
  const [rated, setRated] = useState(false);
  const scrollRef = useRef(null);

  const cfg = topicConfig[lessonTopic] || topicConfig["Tech"];

  useEffect(() => {
    if (!lesson) fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const pct =
        (el.scrollTop / (el.scrollHeight - el.clientHeight || 1)) * 100;
      setProgress(Math.round(pct));
      if (pct > 65) setShowAction(true);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [lesson]);

  const fetchLesson = async () => {
    setLoading(true);
    setError("");
    try {
      const history = await getUserSessions(authUser.uid, 5);
      const gen = await generateLesson(lessonTopic, history, apiKey);
      setLesson(gen);
      setCurrentLesson(gen);
    } catch (e) {
      setError(e.message || "Failed to generate lesson. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (r) => {
    setRated(true);
    setTimeout(() => navigate("quiz"), 500);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.colors.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            fontSize: "52px",
            marginBottom: "16px",
            animation: "float 2s ease-in-out infinite",
          }}
        >
          {cfg.icon}
        </div>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "20px",
            color: theme.colors.text,
            marginBottom: "8px",
          }}
        >
          Crafting your lesson…
        </h2>
        <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
          AI is selecting the best content
        </p>
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.colors.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>😕</div>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "20px",
            color: theme.colors.text,
            marginBottom: "8px",
          }}
        >
          Generation failed
        </h2>
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: "14px",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          {error}
        </p>
        <button onClick={fetchLesson} style={btnPrimary}>
          Try Again
        </button>
        <button
          onClick={() => navigate("dashboard")}
          style={{ ...btnGhost, marginTop: "10px" }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        background: theme.colors.bg,
      }}
    >
      {/* Reading progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          maxWidth: "430px",
          margin: "0 auto",
          height: "3px",
          background: theme.colors.bgElevated,
          zIndex: 200,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${cfg.color}, ${theme.colors.accent})`,
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Back */}
      <button
        onClick={() => navigate("dashboard")}
        style={{
          position: "fixed",
          top: "14px",
          left: "14px",
          background: `${theme.colors.bgCard}E0`,
          backdropFilter: "blur(8px)",
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii.full,
          padding: "7px 15px",
          color: theme.colors.textMuted,
          cursor: "pointer",
          fontFamily: theme.fonts.body,
          fontSize: "13px",
          zIndex: 200,
        }}
      >
        ← Back
      </button>

      <div ref={scrollRef} style={{ height: "100%", overflowY: "auto" }}>
        {/* Hero */}
        <div
          style={{
            background: cfg.bg,
            padding: "68px 24px 28px",
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <Tag text={lessonTopic} color={cfg.color} bg={`${cfg.color}20`} />
            <span style={{ color: theme.colors.textMuted, fontSize: "12px" }}>
              {lesson.readTime || "3 min read"}
            </span>
          </div>
          <h1
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "26px",
              fontWeight: "800",
              color: theme.colors.text,
              lineHeight: "1.2",
              letterSpacing: "-0.5px",
              marginBottom: "10px",
            }}
          >
            {lesson.title}
          </h1>
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: "15px",
              lineHeight: "1.55",
            }}
          >
            {lesson.subtitle}
          </p>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Hook */}
          <div
            style={{
              borderLeft: `3px solid ${cfg.color}`,
              background: `${cfg.color}08`,
              borderRadius: `0 ${theme.radii.md} ${theme.radii.md} 0`,
              padding: "14px 16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: theme.colors.text,
                fontSize: "16px",
                lineHeight: "1.65",
                fontStyle: "italic",
              }}
            >
              {lesson.hook}
            </p>
          </div>

          {/* Sections */}
          {lesson.sections?.map((sec, i) => (
            <div key={i} style={{ marginBottom: "22px" }}>
              <h2
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: "17px",
                  fontWeight: "700",
                  color: theme.colors.text,
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: cfg.bg,
                    color: cfg.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {sec.heading}
              </h2>
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: "15px",
                  lineHeight: "1.7",
                }}
              >
                {sec.content}
              </p>
            </div>
          ))}

          {/* Key Takeaway */}
          <div
            style={{
              background: theme.colors.accentDim,
              border: `1px solid ${theme.colors.accent}25`,
              borderRadius: theme.radii.lg,
              padding: "18px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: theme.colors.accent,
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              KEY TAKEAWAY
            </div>
            <p
              style={{
                color: theme.colors.text,
                fontSize: "15px",
                fontWeight: "500",
                lineHeight: "1.55",
              }}
            >
              {lesson.keyTakeaway}
            </p>
          </div>

          {/* Do This Now */}
          {showAction && (
            <div
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: theme.radii.lg,
                padding: "18px",
                marginBottom: "18px",
                animation: "fadeIn 0.4s ease",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: cfg.color,
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                DO THIS NOW →
              </div>
              <p
                style={{
                  color: theme.colors.text,
                  fontSize: "15px",
                  lineHeight: "1.55",
                }}
              >
                {lesson.doThisNow}
              </p>
            </div>
          )}

          {/* Fun fact */}
          <div
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.md,
              padding: "14px",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              <span style={{ fontSize: "16px", marginRight: "6px" }}>💡</span>
              <strong style={{ color: theme.colors.text }}>Fun fact: </strong>
              {lesson.funFact}
            </p>
          </div>

          {/* Rating */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: "600",
                color: theme.colors.text,
                fontSize: "16px",
                marginBottom: "14px",
              }}
            >
              How was this lesson?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "6px",
                marginBottom: "18px",
              }}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRate(r)}
                  style={{
                    fontSize: "30px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: rated ? 0.4 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            {!rated && (
              <button onClick={() => navigate("quiz")} style={btnPrimary}>
                Take the Quiz →
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function Tag({ text, color, bg }) {
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: theme.radii.full,
        padding: "3px 10px",
        fontSize: "12px",
        fontWeight: "600",
      }}
    >
      {text}
    </span>
  );
}

const btnPrimary = {
  background: theme.colors.accent,
  color: "#000",
  border: "none",
  borderRadius: theme.radii.md,
  padding: "14px 32px",
  width: "100%",
  fontFamily: theme.fonts.heading,
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
};

const btnGhost = {
  background: "none",
  border: "none",
  color: theme.colors.textMuted,
  cursor: "pointer",
  fontFamily: theme.fonts.body,
  fontSize: "14px",
};
