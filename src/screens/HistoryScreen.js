import React, { useState, useEffect } from "react";
import { useApp } from "../App";
import { getUserSessions } from "../utils/db";
import { theme, topicConfig } from "../theme";
import BottomNav from "../components/BottomNav";

export default function HistoryScreen() {
  const { authUser } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSessions(authUser.uid, 60).then((s) => {
      setSessions(s);
      setLoading(false);
    });
  }, [authUser.uid]);

  const grouped = {};
  sessions.forEach((s) => {
    const d = s.completedAt?.toDate?.() || new Date();
    const k = d.toLocaleDateString("en-CA");
    grouped[k] = grouped[k] || [];
    grouped[k].push(s);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (key) => {
    const today = new Date().toLocaleDateString("en-CA");
    const yest = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    if (key === today) return "Today";
    if (key === yest) return "Yesterday";
    return new Date(key).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const topicCounts = {};
  sessions.forEach((s) => {
    topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
  });
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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
        <h1
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "24px",
            fontWeight: "700",
            color: theme.colors.text,
            letterSpacing: "-0.5px",
          }}
        >
          Learning History
        </h1>
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: "13px",
            marginTop: "4px",
          }}
        >
          {sessions.length} lessons completed
        </p>

        {topTopics.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "14px",
              flexWrap: "wrap",
            }}
          >
            {topTopics.map(([topic, count]) => {
              const cfg = topicConfig[topic] || topicConfig["Tech"];
              return (
                <div
                  key={topic}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: theme.radii.full,
                    padding: "5px 12px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{cfg.icon}</span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: cfg.color,
                      fontWeight: "500",
                    }}
                  >
                    {topic}
                  </span>
                  <span
                    style={{ fontSize: "11px", color: theme.colors.textMuted }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 20px" }}>
        {loading ? (
          <p
            style={{
              color: theme.colors.textMuted,
              textAlign: "center",
              padding: "48px",
            }}
          >
            Loading…
          </p>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📚</div>
            <p style={{ color: theme.colors.textMuted, fontSize: "15px" }}>
              No lessons yet — start learning!
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: "12px",
                  fontWeight: "700",
                  color: theme.colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "10px",
                }}
              >
                {formatDate(date)}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {grouped[date].map((s, i) => {
                  const cfg = topicConfig[s.topic] || topicConfig["Tech"];
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: theme.colors.bgCard,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.md,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: theme.radii.sm,
                          background: cfg.bg,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                        }}
                      >
                        {cfg.icon}
                      </div>
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
                          {s.lessonTitle || s.topic}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: theme.colors.textMuted,
                            marginTop: "2px",
                          }}
                        >
                          {s.topic} · Quiz {s.quizScore ?? "—"}/3
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: theme.fonts.heading,
                          fontSize: "13px",
                          fontWeight: "600",
                          color: theme.colors.accent,
                          flexShrink: 0,
                        }}
                      >
                        +{s.xpEarned || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav active="history" />
    </div>
  );
}
