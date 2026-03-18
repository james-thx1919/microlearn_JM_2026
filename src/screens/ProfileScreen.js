import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useApp } from "../App";
import { getLevelForXP, BADGES } from "../utils/gamification";
import { theme, LEVELS } from "../theme";
import BottomNav from "../components/BottomNav";

export default function ProfileScreen() {
  const { userProfile, authUser } = useApp();

  const xp = userProfile?.xp || 0;
  const levelInfo = getLevelForXP(xp);
  const progress = Math.min(
    ((xp - levelInfo.minXP) / (levelInfo.maxXP - levelInfo.minXP)) * 100,
    100
  );
  const earned = new Set(userProfile?.badges || []);
  const firstName = userProfile?.displayName?.split(" ")[0] || "Learner";

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
          padding: "52px 20px 24px",
          background: `linear-gradient(180deg, ${theme.colors.bgCard} 0%, ${theme.colors.bg} 100%)`,
          textAlign: "center",
        }}
      >
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="avatar"
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              border: `3px solid ${theme.colors.accent}`,
              marginBottom: "12px",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
        ) : (
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: theme.colors.accentDim,
              border: `3px solid ${theme.colors.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.fonts.heading,
              fontSize: "26px",
              fontWeight: "700",
              color: theme.colors.accent,
              margin: "0 auto 12px",
            }}
          >
            {firstName[0]}
          </div>
        )}

        <h1
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "20px",
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: "2px",
          }}
        >
          {userProfile?.displayName}
        </h1>
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: "13px",
            marginBottom: "12px",
          }}
        >
          {authUser?.email}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: theme.colors.accentDim,
            border: `1px solid ${theme.colors.accent}30`,
            borderRadius: theme.radii.full,
            padding: "6px 16px",
          }}
        >
          <span style={{ fontSize: "14px" }}>⚡</span>
          <span
            style={{
              fontFamily: theme.fonts.heading,
              color: theme.colors.accent,
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            Level {levelInfo.level} · {levelInfo.title}
          </span>
        </div>
      </div>

      <div style={{ padding: "8px 20px" }}>
        {/* XP Progress */}
        <div
          style={{
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            padding: "18px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              {xp.toLocaleString()} XP
            </span>
            <span style={{ color: theme.colors.textMuted, fontSize: "13px" }}>
              Next: {levelInfo.maxXP.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              height: "8px",
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
                transition: "width 1s",
              }}
            />
          </div>
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            {(levelInfo.maxXP - xp).toLocaleString()} XP until Level{" "}
            {levelInfo.level + 1} — {LEVELS[levelInfo.level]?.title || "Max"}
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          {[
            { icon: "🔥", val: userProfile?.streak || 0, label: "Day Streak" },
            {
              icon: "📚",
              val: userProfile?.totalSessions || 0,
              label: "Lessons Done",
            },
            { icon: "⚡", val: xp.toLocaleString(), label: "Total XP" },
            { icon: "🏆", val: earned.size, label: "Badges Earned" },
          ].map(({ icon, val, label }) => (
            <div
              key={label}
              style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.md,
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>
                {icon}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: "22px",
                  fontWeight: "700",
                  color: theme.colors.text,
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: "11px", color: theme.colors.textMuted }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Badge Collection */}
        <div
          style={{
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            padding: "18px",
            marginBottom: "12px",
          }}
        >
          <h2
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "15px",
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: "14px",
            }}
          >
            Badge Collection
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.values(BADGES).map((badge) => {
              const isEarned = earned.has(badge.id);
              return (
                <div
                  key={badge.id}
                  title={badge.desc}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    width: "54px",
                    opacity: isEarned ? 1 : 0.25,
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: theme.radii.sm,
                      background: isEarned
                        ? theme.colors.accentDim
                        : theme.colors.bgElevated,
                      border: `1px solid ${
                        isEarned
                          ? theme.colors.accent + "40"
                          : theme.colors.border
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    {badge.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: theme.colors.textMuted,
                      textAlign: "center",
                      lineHeight: "1.2",
                    }}
                  >
                    {badge.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change API Key */}
        <button
          onClick={() => {
            localStorage.removeItem("ml_api_key");
            window.location.reload();
          }}
          style={{
            width: "100%",
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.md,
            padding: "13px",
            color: theme.colors.textMuted,
            cursor: "pointer",
            fontFamily: theme.fonts.body,
            fontSize: "13px",
            marginBottom: "10px",
          }}
        >
          Change API Key
        </button>

        {/* Sign Out */}
        <button
          onClick={() => signOut(auth)}
          style={{
            width: "100%",
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.md,
            padding: "13px",
            color: theme.colors.error,
            cursor: "pointer",
            fontFamily: theme.fonts.heading,
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Sign Out
        </button>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
