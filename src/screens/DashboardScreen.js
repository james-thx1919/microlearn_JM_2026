import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../App";
import { getUserSessions } from "../utils/db";
import { generateSuggestions } from "../utils/ai";
import { getLevelForXP } from "../utils/gamification";
import { theme, topicConfig } from "../theme";
import BottomNav from "../components/BottomNav";

export default function DashboardScreen() {
  const { userProfile, navigate, apiKey, authUser } = useApp();
  const [sessions, setSessions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
    );
  }, []);

  useEffect(() => {
    if (authUser) getUserSessions(authUser.uid, 10).then(setSessions);
  }, [authUser]);

  const loadSuggestions = useCallback(async () => {
    if (!userProfile || !apiKey) return;
    setLoadingSuggestions(true);
    try {
      const result = await generateSuggestions(userProfile, sessions, apiKey);
      setSuggestions(result.suggestions || []);
    } catch {
      setSuggestions([
        {
          topic: "Productivity",
          title: "The 2-Minute Rule",
          reason: "Perfect quick-win starter",
          difficulty: "Beginner",
        },
        {
          topic: "Mindfulness",
          title: "Box Breathing in 4 Steps",
          reason: "Instant stress relief",
          difficulty: "Beginner",
        },
        {
          topic: "Tech",
          title: "Keyboard Shortcuts That Save Hours",
          reason: "Apply today at your desk",
          difficulty: "Beginner",
        },
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [userProfile, sessions, apiKey]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const xp = userProfile?.xp || 0;
  const levelInfo = getLevelForXP(xp);
  const progress = Math.min(
    ((xp - levelInfo.minXP) / (levelInfo.maxXP - levelInfo.minXP)) * 100,
    100
  );
  const firstName = userProfile?.displayName?.split(" ")[0] || "Learner";

  const startLesson = (topic) => navigate("lesson", { topic, lesson: null });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.bg,
        paddingBottom: "88px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "52px 20px 20px",
          background: `linear-gradient(180deg, ${theme.colors.bgCard} 0%, ${theme.colors.bg} 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: "14px",
                marginBottom: "2px",
              }}
            >
              {greeting} 👋
            </p>
            <h1
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: "24px",
                fontWeight: "700",
                color: theme.colors.text,
                letterSpacing: "-0.5px",
              }}
            >
              {firstName}
            </h1>
          </div>
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt="avatar"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: `2px solid ${theme.colors.accent}50`,
              }}
            />
          ) : (
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: theme.colors.accentDim,
                border: `2px solid ${theme.colors.accent}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: theme.fonts.heading,
                fontWeight: "700",
                color: theme.colors.accent,
              }}
            >
              {firstName[0]}
            </div>
          )}
        </div>

        {/* XP Card */}
        <div
          style={{
            marginTop: "18px",
            background: theme.colors.bgElevated,
            borderRadius: theme.radii.lg,
            padding: "16px",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: "600",
                fontSize: "14px",
                color: theme.colors.accent,
              }}
            >
              ⚡ Lv.{levelInfo.level} {levelInfo.title}
            </span>
            <span style={{ color: theme.colors.textMuted, fontSize: "12px" }}>
              {xp} / {levelInfo.maxXP} XP
            </span>
          </div>
          <div
            style={{
              height: "5px",
              background: theme.colors.border,
              borderRadius: theme.radii.full,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.colors.accent} 0%, #7BDB2A 100%)`,
                borderRadius: theme.radii.full,
                transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "14px" }}>
            {[
              { icon: "🔥", val: userProfile?.streak || 0, label: "streak" },
              {
                icon: "📚",
                val: userProfile?.totalSessions || 0,
                label: "lessons",
              },
              {
                icon: "🏆",
                val: userProfile?.badges?.length || 0,
                label: "badges",
              },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontWeight: "700",
                    fontSize: "18px",
                    color: theme.colors.text,
                  }}
                >
                  {s.icon} {s.val}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: theme.colors.textMuted,
                    marginTop: "2px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "4px 20px" }}>
        {/* Suggestions */}
        <SectionHeader
          title="For You"
          action="↻ Refresh"
          onAction={loadSuggestions}
        />
        {loadingSuggestions ? (
          <LoadingCard icon="✨" text="AI is crafting your suggestions…" />
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {suggestions.map((s, i) => (
              <SuggestionCard
                key={i}
                s={s}
                onPress={() => startLesson(s.topic)}
              />
            ))}
          </div>
        )}

        {/* Topic Grid */}
        <SectionHeader title="Browse Topics" style={{ marginTop: "28px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {Object.entries(topicConfig).map(([topic, cfg]) => (
            <button
              key={topic}
              onClick={() => startLesson(topic)}
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: theme.radii.md,
                padding: "16px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "26px", marginBottom: "8px" }}>
                {cfg.icon}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: "14px",
                  fontWeight: "600",
                  color: cfg.color,
                  marginBottom: "4px",
                }}
              >
                {topic}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: theme.colors.textMuted,
                  lineHeight: "1.4",
                }}
              >
                {cfg.description}
              </div>
            </button>
          ))}
        </div>

        {/* Recent */}
        {sessions.length > 0 && (
          <>
            <SectionHeader
              title="Recent"
              action="See all →"
              onAction={() => navigate("history")}
              style={{ marginTop: "28px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              {sessions.slice(0, 3).map((s, i) => (
                <RecentCard key={i} session={s} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

function SectionHeader({ title, action, onAction, style }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        ...style,
      }}
    >
      <h2
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: "17px",
          fontWeight: "600",
          color: theme.colors.text,
        }}
      >
        {title}
      </h2>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            color: theme.colors.accent,
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: theme.fonts.body,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function LoadingCard({ icon, text }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "36px 20px",
        color: theme.colors.textMuted,
        fontSize: "14px",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
      {text}
    </div>
  );
}

function SuggestionCard({ s, onPress }) {
  const cfg = topicConfig[s.topic] || topicConfig["Tech"];
  return (
    <button
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.lg,
        padding: "14px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: theme.radii.md,
          background: cfg.bg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "14px",
            fontWeight: "600",
            color: theme.colors.text,
            marginBottom: "3px",
          }}
        >
          {s.title}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: theme.colors.textMuted,
            marginBottom: "6px",
          }}
        >
          {s.reason}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Tag text={s.topic} color={cfg.color} bg={cfg.bg} />
          <Tag
            text={s.difficulty}
            color={theme.colors.textMuted}
            bg={theme.colors.bgElevated}
          />
        </div>
      </div>
      <span
        style={{ color: theme.colors.accent, fontSize: "22px", flexShrink: 0 }}
      >
        ›
      </span>
    </button>
  );
}

function RecentCard({ session }) {
  const cfg = topicConfig[session.topic] || topicConfig["Tech"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: theme.colors.bgCard,
        borderRadius: theme.radii.md,
        padding: "12px 14px",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: theme.colors.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {session.lessonTitle || session.topic}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: theme.colors.textMuted,
            marginTop: "2px",
          }}
        >
          {session.quizScore !== undefined ? `Quiz ${session.quizScore}/3` : ""}{" "}
          · +{session.xpEarned || 0} XP
        </div>
      </div>
      <span
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: "13px",
          color: theme.colors.accent,
        }}
      >
        +{session.xpEarned || 0}
      </span>
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
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: "500",
      }}
    >
      {text}
    </span>
  );
}
