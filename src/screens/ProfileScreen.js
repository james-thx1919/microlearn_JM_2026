import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useApp } from "../App";
import { getLevelForXP, BADGES } from "../utils/gamification";
import { LEVELS } from "../theme";
import BottomNav from "../components/BottomNav";

export default function ProfileScreen() {
  const { userProfile, authUser, currentTheme: t } = useApp();

  const xp        = userProfile?.xp || 0;
  const levelInfo = getLevelForXP(xp);
  const progress  = Math.min(((xp - levelInfo.minXP) / (levelInfo.maxXP - levelInfo.minXP)) * 100, 100);
  const earned    = new Set(userProfile?.badges || []);
  const firstName = userProfile?.displayName?.split(" ")[0] || "Learner";

  return (
    <div style={{ minHeight: "100vh", background: t.colors.bg, paddingBottom: "88px" }}>

      {/* Header */}
      <div style={{
        padding: "3.25rem 1.25rem 1.5rem",
        background: `linear-gradient(180deg, ${t.colors.bgCard} 0%, ${t.colors.bg} 100%)`,
        textAlign: "center",
      }}>
        {userProfile?.photoURL ? (
          <img src={userProfile.photoURL} alt="avatar" style={{
            width: "4.25rem", height: "4.25rem", borderRadius: "50%",
            border: `3px solid ${t.colors.accent}`,
            display: "block", margin: "0 auto 0.75rem",
          }} />
        ) : (
          <div style={{
            width: "4.25rem", height: "4.25rem", borderRadius: "50%",
            background: t.colors.accentDim, border: `3px solid ${t.colors.accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: t.fonts.heading, fontSize: "1.625rem", fontWeight: "700",
            color: t.colors.accent, margin: "0 auto 0.75rem",
          }}>
            {firstName[0]}
          </div>
        )}

        <h1 style={{
          fontFamily: t.fonts.heading, fontSize: "1.25rem", fontWeight: "700",
          color: t.colors.text, marginBottom: "0.125rem",
        }}>
          {userProfile?.displayName}
        </h1>
        <p style={{ color: t.colors.textMuted, fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
          {authUser?.email}
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: t.colors.accentDim, border: `1px solid ${t.colors.accent}30`,
          borderRadius: t.radii.full, padding: "0.375rem 1rem",
        }}>
          <span style={{ fontSize: "0.875rem" }}>⚡</span>
          <span style={{
            fontFamily: t.fonts.heading, color: t.colors.accent,
            fontWeight: "600", fontSize: "0.8125rem",
          }}>
            Level {levelInfo.level} · {levelInfo.title}
          </span>
        </div>
      </div>

      <div style={{ padding: "0.5rem 1.25rem" }}>

        {/* XP Progress */}
        <div style={{
          background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
          borderRadius: t.radii.lg, padding: "1.125rem", marginBottom: "0.75rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.625rem" }}>
            <span style={{ fontFamily: t.fonts.heading, fontWeight: "700", color: t.colors.text, fontSize: "1rem" }}>
              {xp.toLocaleString()} XP
            </span>
            <span style={{ color: t.colors.textMuted, fontSize: "0.8125rem" }}>
              Next: {levelInfo.maxXP.toLocaleString()}
            </span>
          </div>
          <div style={{ height: "0.5rem", background: t.colors.border, borderRadius: t.radii.full, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: `linear-gradient(90deg, ${t.colors.accent} 0%, #7BDB2A 100%)`,
              borderRadius: t.radii.full, transition: "width 1s",
            }} />
          </div>
          <p style={{ color: t.colors.textMuted, fontSize: "0.75rem", marginTop: "0.5rem" }}>
            {(levelInfo.maxXP - xp).toLocaleString()} XP until Level {levelInfo.level + 1} —{" "}
            {LEVELS[levelInfo.level]?.title || "Max"}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.75rem" }}>
          {[
            { icon: "🔥", val: userProfile?.streak || 0,         label: "Day Streak"    },
            { icon: "📚", val: userProfile?.totalSessions || 0,  label: "Lessons Done"  },
            { icon: "⚡", val: xp.toLocaleString(),              label: "Total XP"      },
            { icon: "🏆", val: earned.size,                      label: "Badges Earned" },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{
              background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
              borderRadius: t.radii.md, padding: "1rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.375rem", marginBottom: "0.375rem" }}>{icon}</div>
              <div style={{ fontFamily: t.fonts.heading, fontSize: "1.375rem", fontWeight: "700", color: t.colors.text }}>
                {val}
              </div>
              <div style={{ fontSize: "0.6875rem", color: t.colors.textMuted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Badge Collection */}
        <div style={{
          background: t.colors.bgCard, border: `1px solid ${t.colors.border}`,
          borderRadius: t.radii.lg, padding: "1.125rem", marginBottom: "0.75rem",
        }}>
          <h2 style={{
            fontFamily: t.fonts.heading, fontSize: "0.9375rem", fontWeight: "700",
            color: t.colors.text, marginBottom: "0.875rem",
          }}>
            Badge Collection
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
            {Object.values(BADGES).map((badge) => {
              const isEarned = earned.has(badge.id);
              return (
                <div key={badge.id} title={badge.desc} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "0.25rem", width: "3.375rem", opacity: isEarned ? 1 : 0.25,
                }}>
                  <div style={{
                    width: "2.875rem", height: "2.875rem", borderRadius: t.radii.sm,
                    background: isEarned ? t.colors.accentDim : t.colors.bgElevated,
                    border: `1px solid ${isEarned ? t.colors.accent + "40" : t.colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.375rem",
                  }}>
                    {badge.icon}
                  </div>
                  <div style={{ fontSize: "0.625rem", color: t.colors.textMuted, textAlign: "center", lineHeight: "1.2" }}>
                    {badge.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change API Key */}
        <button
          onClick={() => { localStorage.removeItem("ml_api_key"); window.location.reload(); }}
          style={{
            width: "100%", background: t.colors.bgCard,
            border: `1px solid ${t.colors.border}`, borderRadius: t.radii.md,
            padding: "0.8125rem", color: t.colors.textMuted, cursor: "pointer",
            fontFamily: t.fonts.body, fontSize: "0.8125rem", marginBottom: "0.625rem",
          }}
        >
          Change API Key
        </button>

        {/* Sign Out */}
        <button
          onClick={() => signOut(auth)}
          style={{
            width: "100%", background: t.colors.bgCard,
            border: `1px solid ${t.colors.border}`, borderRadius: t.radii.md,
            padding: "0.8125rem", color: t.colors.error, cursor: "pointer",
            fontFamily: t.fonts.heading, fontSize: "0.875rem", fontWeight: "500",
          }}
        >
          Sign Out
        </button>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
