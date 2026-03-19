import React, { useState, useEffect } from "react";
import { useApp } from "../App";
import { getUserSessions } from "../utils/db";
import { topicConfig } from "../theme";
import BottomNav from "../components/BottomNav";

export default function HistoryScreen() {
  const { authUser, currentTheme: t } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

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
    const yest  = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
    if (key === today) return "Today";
    if (key === yest)  return "Yesterday";
    return new Date(key).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const topicCounts = {};
  sessions.forEach((s) => { topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1; });
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: t.colors.bg, paddingBottom: "88px" }}>

      {/* Header */}
      <div style={{
        padding: "3.25rem 1.25rem 1.25rem",
        background: `linear-gradient(180deg, ${t.colors.bgCard} 0%, ${t.colors.bg} 100%)`,
      }}>
        <h1 style={{
          fontFamily: t.fonts.heading, fontSize: "1.5rem", fontWeight: "700",
          color: t.colors.text, letterSpacing: "-0.5px", margin: 0,
        }}>
          Learning History
        </h1>
        <p style={{ color: t.colors.textMuted, fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          {sessions.length} lessons completed
        </p>

        {topTopics.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.875rem", flexWrap: "wrap" }}>
            {topTopics.map(([topic, count]) => {
              const cfg = topicConfig[topic] || topicConfig["Tech"];
              return (
                <div key={topic} style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: t.radii.full, padding: "0.3125rem 0.75rem",
                }}>
                  <span style={{ fontSize: "0.875rem" }}>{cfg.icon}</span>
                  <span style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: "500" }}>{topic}</span>
                  <span style={{ fontSize: "0.6875rem", color: t.colors.textMuted }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "0.25rem 1.25rem" }}>
        {loading ? (
          <p style={{ color: t.colors.textMuted, textAlign: "center", padding: "3rem" }}>Loading…</p>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.25rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📚</div>
            <p style={{ color: t.colors.textMuted, fontSize: "0.9375rem" }}>
              No lessons yet — start learning!
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} style={{ marginBottom: "1.5rem" }}>
              <div style={{
                fontFamily: t.fonts.heading, fontSize: "0.75rem", fontWeight: "700",
                color: t.colors.textMuted, textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: "0.625rem",
              }}>
                {formatDate(date)}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {grouped[date].map((s, i) => {
                  const cfg = topicConfig[s.topic] || topicConfig["Tech"];
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      background: t.colors.bgCard,
                      border: `1px solid ${t.colors.border}`,
                      borderRadius: t.radii.md, padding: "0.75rem 0.875rem",
                    }}>
                      <div style={{
                        width: "2.375rem", height: "2.375rem", borderRadius: t.radii.sm,
                        background: cfg.bg, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.125rem",
                      }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "0.8125rem", fontWeight: "500", color: t.colors.text,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {s.lessonTitle || s.topic}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: t.colors.textMuted, marginTop: "0.125rem" }}>
                          {s.topic} · Quiz {s.quizScore ?? "—"}/3
                        </div>
                      </div>
                      <div style={{
                        fontFamily: t.fonts.heading, fontSize: "0.8125rem",
                        fontWeight: "600", color: t.colors.accent, flexShrink: 0,
                      }}>
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
